'use client'

// Liquid glass surface driven by the shader pipeline of
// https://github.com/iyinchao/liquid-glass-studio (MIT, Charles Yin).
//
// Renders a WebGL2 canvas behind its children. Every descendant marked with
// `data-liquid-glass` becomes an SDF rounded-rect shape in the shader: the
// wallpaper behind the canvas region is refracted through the glass edge with
// chromatic dispersion, a fresnel rim and an angular glare, exactly like the
// studio's final pass. Shapes are re-measured every frame, so animated
// elements (dock magnification, panel entrances) stay in sync.

import { useSelector } from '@/app/store'
import { useTheme } from 'next-themes'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  computeGaussianKernelByRadius,
  FRAG_BG,
  FRAG_HBLUR,
  FRAG_MAIN,
  FRAG_VBLUR,
  MAX_SHAPES,
  VERTEX_SHADER,
} from './shaders'
import { loadWallpaperTexture, MultiPassRenderer } from './renderer'

export interface LiquidGlassStudioProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Extra canvas margin (CSS px) so edge refraction can sample outside the shapes */
  bleed?: number
  /** Glass tint as [r, g, b, a] in 0..1 */
  tint?: [number, number, number, number]
  /** Glass edge thickness in CSS px (studio: refThickness) */
  refThickness?: number
  /** Refractive index (studio: refFactor) */
  refFactor?: number
  /** Chromatic dispersion strength (studio: refDispersion) */
  refDispersion?: number
  fresnelRange?: number
  fresnelHardness?: number
  fresnelFactor?: number
  glareRange?: number
  glareHardness?: number
  glareConvergence?: number
  glareOppositeFactor?: number
  glareFactor?: number
  /** Glare rotation in degrees (studio: glareAngle) */
  glareAngleDeg?: number
  /** Gaussian blur radius for the frosted interior */
  blurRadius?: number
  /** If true the whole interior is frosted; if false only the edge */
  blurEdge?: boolean
  /** smin merge distance between shapes, CSS px */
  mergeRatePx?: number
  shadowExpand?: number
  shadowFactor?: number
  shadowPosition?: { x: number; y: number }
}

interface ShapeSnapshot {
  data: Float32Array
  params: Float32Array
  count: number
}

const parseRadius = (element: HTMLElement, width: number, height: number) => {
  const raw = window.getComputedStyle(element).borderTopLeftRadius
  const value = Number.parseFloat(raw)
  const radius = Number.isFinite(value) ? value : 0
  return Math.min(radius, width / 2, height / 2)
}

export function LiquidGlassStudio({
  children,
  className = '',
  style,
  bleed = 56,
  tint = [1, 1, 1, 0.04],
  refThickness = 20,
  refFactor = 1.4,
  refDispersion = 7,
  fresnelRange = 30,
  fresnelHardness = 0.2,
  fresnelFactor = 0.2,
  glareRange = 30,
  glareHardness = 0.2,
  glareConvergence = 0.5,
  glareOppositeFactor = 0.8,
  glareFactor = 0.9,
  glareAngleDeg = -45,
  blurRadius = 25,
  blurEdge = true,
  mergeRatePx = 8,
  shadowExpand = 25,
  shadowFactor = 0.2,
  shadowPosition = { x: 0, y: -6 },
}: LiquidGlassStudioProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSupported, setIsSupported] = useState(true)
  const wallpaper = useSelector((state) => state.settings.wallpaper)
  const { resolvedTheme } = useTheme()

  const wallpaperSrc = wallpaper
    ? resolvedTheme === 'dark'
      ? wallpaper.dark.src
      : wallpaper.light.src
    : null

  const settingsRef = useRef({
    tint,
    refThickness,
    refFactor,
    refDispersion,
    fresnelRange,
    fresnelHardness,
    fresnelFactor,
    glareRange,
    glareHardness,
    glareConvergence,
    glareOppositeFactor,
    glareFactor,
    glareAngleDeg,
    blurRadius,
    blurEdge,
    mergeRatePx,
    shadowExpand,
    shadowFactor,
    shadowPosition,
    bleed,
    wallpaperSrc,
  })
  settingsRef.current = {
    tint,
    refThickness,
    refFactor,
    refDispersion,
    fresnelRange,
    fresnelHardness,
    fresnelFactor,
    glareRange,
    glareHardness,
    glareConvergence,
    glareOppositeFactor,
    glareFactor,
    glareAngleDeg,
    blurRadius,
    blurEdge,
    mergeRatePx,
    shadowExpand,
    shadowFactor,
    shadowPosition,
    bleed,
    wallpaperSrc,
  }

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    })
    if (!gl) {
      setIsSupported(false)
      return
    }

    let renderer: MultiPassRenderer
    try {
      renderer = new MultiPassRenderer(gl, VERTEX_SHADER, [
        { name: 'bgPass', fragment: FRAG_BG },
        {
          name: 'vBlurPass',
          fragment: FRAG_VBLUR,
          inputs: { u_prevPassTexture: 'bgPass' },
        },
        {
          name: 'hBlurPass',
          fragment: FRAG_HBLUR,
          inputs: { u_prevPassTexture: 'vBlurPass' },
        },
        {
          name: 'mainPass',
          fragment: FRAG_MAIN,
          inputs: { u_blurredBg: 'hBlurPass', u_bg: 'bgPass' },
          outputToScreen: true,
        },
      ])
    } catch (error) {
      console.error('liquid-glass-studio pipeline failed to compile:', error)
      setIsSupported(false)
      return
    }

    let raf: number | null = null
    let disposed = false
    let wallpaperTexture: WebGLTexture | null = null
    let wallpaperRatio = 1
    let loadedWallpaperSrc: string | null = null
    let blurWeights = new Float32Array(computeGaussianKernelByRadius(settingsRef.current.blurRadius))
    let blurWeightsRadius = settingsRef.current.blurRadius
    let lastFrameKey = ''

    const shapeData = new Float32Array(MAX_SHAPES * 4)
    const shapeParams = new Float32Array(MAX_SHAPES * 2)

    const loadWallpaper = (src: string) => {
      loadedWallpaperSrc = src
      loadTextureAsync(src)
    }

    const loadTextureAsync = async (src: string) => {
      try {
        const { texture, ratio } = await loadWallpaperTexture(gl, src)
        if (disposed || loadedWallpaperSrc !== src) {
          gl.deleteTexture(texture)
          return
        }
        if (wallpaperTexture) gl.deleteTexture(wallpaperTexture)
        wallpaperTexture = texture
        wallpaperRatio = ratio
        lastFrameKey = ''
      } catch (error) {
        console.error(error)
      }
    }

    const measureShapes = (canvasRect: DOMRect, dpr: number): ShapeSnapshot => {
      const elements = container.querySelectorAll<HTMLElement>('[data-liquid-glass]')
      let count = 0

      elements.forEach((element) => {
        if (count >= MAX_SHAPES) return
        const rect = element.getBoundingClientRect()
        if (rect.width < 2 || rect.height < 2) return

        const opacity = Number.parseFloat(window.getComputedStyle(element).opacity)
        if (opacity < 0.25) return

        // Device px, GL orientation (y up from canvas bottom)
        const centerX = (rect.left + rect.width / 2 - canvasRect.left) * dpr
        const centerYCss = rect.top + rect.height / 2 - canvasRect.top
        const centerY = canvasRect.height * dpr - centerYCss * dpr

        shapeData[count * 4] = centerX
        shapeData[count * 4 + 1] = centerY
        shapeData[count * 4 + 2] = (rect.width / 2) * dpr
        shapeData[count * 4 + 3] = (rect.height / 2) * dpr
        shapeParams[count * 2] = parseRadius(element, rect.width, rect.height) * dpr
        shapeParams[count * 2 + 1] = Number.parseFloat(
          element.dataset.liquidGlassRoundness || '2'
        )
        count++
      })

      return { data: shapeData, params: shapeParams, count }
    }

    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!wallpaperTexture && settingsRef.current.wallpaperSrc) {
        if (loadedWallpaperSrc !== settingsRef.current.wallpaperSrc) {
          loadWallpaper(settingsRef.current.wallpaperSrc)
        }
        return
      }
      if (
        settingsRef.current.wallpaperSrc &&
        loadedWallpaperSrc !== settingsRef.current.wallpaperSrc
      ) {
        loadWallpaper(settingsRef.current.wallpaperSrc)
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      // Size the canvas to the container plus bleed, quantized so animated
      // containers (dock magnification) don't reallocate framebuffers every
      // frame. The canvas stays centered on the container.
      const containerRect = container.getBoundingClientRect()
      if (containerRect.width < 4 || containerRect.height < 4) return

      const quant = 96
      const cssW = Math.ceil((containerRect.width + settingsRef.current.bleed * 2) / quant) * quant
      const cssH = Math.ceil((containerRect.height + settingsRef.current.bleed * 2) / quant) * quant
      const nextWidth = `${cssW}px`
      if (canvas.style.width !== nextWidth || canvas.style.height !== `${cssH}px`) {
        canvas.style.width = nextWidth
        canvas.style.height = `${cssH}px`
        canvas.style.left = `${-(cssW - containerRect.width) / 2}px`
        canvas.style.top = `${-(cssH - containerRect.height) / 2}px`
      }

      const canvasRect = canvas.getBoundingClientRect()
      if (canvasRect.width < 4 || canvasRect.height < 4) return

      const width = Math.round(canvasRect.width * dpr)
      const height = Math.round(canvasRect.height * dpr)

      const shapes = measureShapes(canvasRect, dpr)
      if (shapes.count === 0) return

      const settings = settingsRef.current

      // Skip repaints when nothing has moved or resized
      let frameKey = `${width}x${height}:${dpr}:${loadedWallpaperSrc}:${canvasRect.left},${canvasRect.top}`
      for (let i = 0; i < shapes.count * 4; i++) frameKey += `,${shapes.data[i]}`
      if (frameKey === lastFrameKey) return
      lastFrameKey = frameKey

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      renderer.setSize(width, height)

      if (blurWeightsRadius !== settings.blurRadius) {
        blurWeights = new Float32Array(computeGaussianKernelByRadius(settings.blurRadius))
        blurWeightsRadius = settings.blurRadius
      }

      renderer.render(
        {
          u_resolution: [width, height],
          u_dpr: dpr,
          u_shapeCount: shapes.count,
          u_mergeRate: settings.mergeRatePx / canvasRect.height,
          u_shadowExpand: settings.shadowExpand,
          u_shadowFactor: settings.shadowFactor,
          u_shadowPosition: [settings.shadowPosition.x, settings.shadowPosition.y],
        },
        {
          bgPass: {
            u_bgTexture: wallpaperTexture,
            u_bgTextureReady: wallpaperTexture ? 1 : 0,
            u_bgTextureRatio: wallpaperRatio,
            u_viewport: [window.innerWidth, window.innerHeight],
            u_region: [canvasRect.left, canvasRect.top],
          },
          vBlurPass: {
            u_blurRadius: settings.blurRadius,
            u_blurWeights: blurWeights,
          },
          hBlurPass: {
            u_blurRadius: settings.blurRadius,
            u_blurWeights: blurWeights,
          },
          mainPass: {
            u_tint: settings.tint,
            u_refThickness: settings.refThickness,
            u_refFactor: settings.refFactor,
            u_refDispersion: settings.refDispersion,
            u_refFresnelRange: settings.fresnelRange,
            u_refFresnelHardness: settings.fresnelHardness,
            u_refFresnelFactor: settings.fresnelFactor,
            u_glareRange: settings.glareRange,
            u_glareHardness: settings.glareHardness,
            u_glareConvergence: settings.glareConvergence,
            u_glareOppositeFactor: settings.glareOppositeFactor,
            u_glareFactor: settings.glareFactor,
            u_glareAngle: (settings.glareAngleDeg * Math.PI) / 180,
            u_blurEdge: settings.blurEdge ? 1 : 0,
          },
        },
        {
          u_shapes: { size: 4, data: shapes.data },
          u_shapeParams: { size: 2, data: shapes.params },
        }
      )
    }

    raf = requestAnimationFrame(frame)

    return () => {
      disposed = true
      if (raf !== null) cancelAnimationFrame(raf)
      if (wallpaperTexture) gl.deleteTexture(wallpaperTexture)
      renderer.dispose()
    }
    // The render loop reads live values through settingsRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={style}
      data-lgs-fallback={isSupported ? undefined : ''}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute z-0"
        style={{
          left: -bleed,
          top: -bleed,
          display: isSupported ? undefined : 'none',
        }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  )
}

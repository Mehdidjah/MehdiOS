// Minimal WebGL2 multipass renderer for the liquid-glass-studio pipeline
// (bg -> vertical blur -> horizontal blur -> main). Modeled on the
// MultiPassRenderer in https://github.com/iyinchao/liquid-glass-studio (MIT).

export type UniformValue =
  | number
  | number[]
  | Float32Array
  | WebGLTexture
  | null

export interface PassConfig {
  name: string
  fragment: string
  // uniform name -> source pass name whose output texture is bound
  inputs?: Record<string, string>
  outputToScreen?: boolean
}

// Uniforms that must be uploaded as integers
const INT_UNIFORMS = new Set([
  'u_shapeCount',
  'u_blurRadius',
  'u_blurEdge',
  'u_bgTextureReady',
])

interface Pass {
  config: PassConfig
  program: WebGLProgram
  locations: Map<string, WebGLUniformLocation | null>
  framebuffer: WebGLFramebuffer | null
  texture: WebGLTexture | null
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error: ${info}`)
  }
  return shader
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
) {
  const program = gl.createProgram()
  if (!program) throw new Error('Failed to create program')
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`Program link error: ${info}`)
  }
  return program
}

function createPassTexture(gl: WebGL2RenderingContext, width: number, height: number) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return texture
}

export class MultiPassRenderer {
  private gl: WebGL2RenderingContext
  private passes: Pass[] = []
  private vao: WebGLVertexArrayObject | null
  private width = 0
  private height = 0

  constructor(gl: WebGL2RenderingContext, vertexShader: string, passes: PassConfig[]) {
    this.gl = gl

    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    )
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)

    for (const config of passes) {
      const program = createProgram(gl, vertexShader, config.fragment)
      gl.bindAttribLocation(program, 0, 'a_position')
      this.passes.push({
        config,
        program,
        locations: new Map(),
        framebuffer: null,
        texture: null,
      })
    }
  }

  setSize(width: number, height: number) {
    if (width === this.width && height === this.height) return
    this.width = width
    this.height = height

    const gl = this.gl
    for (const pass of this.passes) {
      if (pass.config.outputToScreen) continue
      if (pass.texture) gl.deleteTexture(pass.texture)
      if (pass.framebuffer) gl.deleteFramebuffer(pass.framebuffer)
      pass.texture = createPassTexture(gl, width, height)
      pass.framebuffer = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer)
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        pass.texture,
        0
      )
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  private getLocation(pass: Pass, name: string) {
    if (!pass.locations.has(name)) {
      pass.locations.set(name, this.gl.getUniformLocation(pass.program, name))
    }
    return pass.locations.get(name) ?? null
  }

  private setUniform(pass: Pass, name: string, value: UniformValue, textureUnit: () => number) {
    const gl = this.gl
    const location = this.getLocation(pass, name)
    if (location === null || value === null) return

    if (typeof value === 'number') {
      if (INT_UNIFORMS.has(name)) {
        gl.uniform1i(location, value)
      } else {
        gl.uniform1f(location, value)
      }
      return
    }

    if (value instanceof WebGLTexture) {
      const unit = textureUnit()
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, value)
      gl.uniform1i(location, unit)
      return
    }

    const array = value instanceof Float32Array ? value : new Float32Array(value)
    if (name.endsWith('[0]') || array.length > 4) {
      // Structured arrays are dispatched by declared name below instead
      gl.uniform1fv(location, array)
      return
    }
    if (array.length === 2) gl.uniform2fv(location, array)
    else if (array.length === 3) gl.uniform3fv(location, array)
    else if (array.length === 4) gl.uniform4fv(location, array)
    else gl.uniform1fv(location, array)
  }

  render(
    globalUniforms: Record<string, UniformValue>,
    perPassUniforms: Record<string, Record<string, UniformValue>> = {},
    vecArrayUniforms: Record<string, { size: 2 | 4; data: Float32Array }> = {}
  ) {
    const gl = this.gl
    gl.bindVertexArray(this.vao)

    for (const pass of this.passes) {
      gl.useProgram(pass.program)
      gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        pass.config.outputToScreen ? null : pass.framebuffer
      )
      gl.viewport(0, 0, this.width, this.height)

      let nextUnit = 0
      const textureUnit = () => nextUnit++

      for (const [name, value] of Object.entries(globalUniforms)) {
        this.setUniform(pass, name, value, textureUnit)
      }
      for (const [name, value] of Object.entries(perPassUniforms[pass.config.name] ?? {})) {
        this.setUniform(pass, name, value, textureUnit)
      }
      for (const [name, { size, data }] of Object.entries(vecArrayUniforms)) {
        const location = this.getLocation(pass, name)
        if (location === null) continue
        if (size === 2) gl.uniform2fv(location, data)
        else gl.uniform4fv(location, data)
      }

      if (pass.config.inputs) {
        for (const [uniformName, sourcePassName] of Object.entries(pass.config.inputs)) {
          const source = this.passes.find((p) => p.config.name === sourcePassName)
          if (source?.texture) {
            this.setUniform(pass, uniformName, source.texture, textureUnit)
          }
        }
      }

      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindVertexArray(null)
  }

  dispose() {
    const gl = this.gl
    for (const pass of this.passes) {
      gl.deleteProgram(pass.program)
      if (pass.texture) gl.deleteTexture(pass.texture)
      if (pass.framebuffer) gl.deleteFramebuffer(pass.framebuffer)
    }
    this.passes = []
    if (this.vao) gl.deleteVertexArray(this.vao)
    this.vao = null
  }
}

export function loadWallpaperTexture(
  gl: WebGL2RenderingContext,
  src: string
): Promise<{ texture: WebGLTexture; ratio: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const texture = gl.createTexture()
      if (!texture) {
        reject(new Error('Failed to create texture'))
        return
      }
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      resolve({ texture, ratio: image.naturalWidth / image.naturalHeight })
    }
    image.onerror = () => reject(new Error(`Failed to load wallpaper: ${src}`))
    image.src = src
  })
}

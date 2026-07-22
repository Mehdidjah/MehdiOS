// GLSL pipeline ported from liquid-glass-studio (MIT, Copyright (c) 2024 Charles Yin)
// https://github.com/iyinchao/liquid-glass-studio
//
// Differences from the original: the two mouse-driven shapes are generalized to
// an array of DOM-tracked rounded rects, the background pass samples the OS
// wallpaper for the canvas region instead of demo textures, and everything
// outside the glass shapes is emitted as transparent pixels so the canvas
// composites over live DOM content.

export const MAX_SHAPES = 24
export const MAX_BLUR_RADIUS = 64

export const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec4 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position.xy + 1.0) * 0.5;
  gl_Position = a_position;
}
`

// Shared SDF chunk. Shapes are given in device pixels, GL orientation
// (y up from the bottom of the canvas):
//   u_shapes[i]      = center.x, center.y, halfWidth, halfHeight
//   u_shapeParams[i] = corner radius, superellipse roundness (2 = circular)
const SDF_CHUNK = /* glsl */ `
#define MAX_SHAPES ${MAX_SHAPES}

uniform int u_shapeCount;
uniform vec4 u_shapes[MAX_SHAPES];
uniform vec2 u_shapeParams[MAX_SHAPES];
uniform float u_mergeRate;

float superellipseCornerSDF(vec2 p, float r, float n) {
  p = abs(p);
  float v = pow(pow(p.x, n) + pow(p.y, n), 1.0 / n);
  return v - r;
}

float roundedRectSDF(vec2 p, vec2 halfSize, float cornerRadius, float n) {
  vec2 d = abs(p) - halfSize;

  if (d.x > -cornerRadius && d.y > -cornerRadius) {
    vec2 cornerCenter = sign(p) * (halfSize - vec2(cornerRadius));
    return superellipseCornerSDF(p - cornerCenter, cornerRadius, n);
  }

  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// SDF over every tracked shape, normalized by canvas height like the studio
// (distances stay resolution independent for the optics math).
float mainSDF(vec2 fragPx) {
  float d = 1e5;
  for (int i = 0; i < MAX_SHAPES; i++) {
    if (i >= u_shapeCount) break;
    vec4 s = u_shapes[i];
    vec2 p = (fragPx - s.xy) / u_resolution.y;
    float di = roundedRectSDF(
      p,
      s.zw / u_resolution.y,
      u_shapeParams[i].x / u_resolution.y,
      u_shapeParams[i].y
    );
    d = smin(d, di, u_mergeRate);
  }
  return d;
}
`

// Background pass: wallpaper (object-cover mapped for the viewport, cropped to
// the canvas region) + the studio's exponential SDF drop shadow baked in so the
// glass refracts its own shadow.
export const FRAG_BG = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_dpr;
uniform sampler2D u_bgTexture;
uniform int u_bgTextureReady;
uniform float u_bgTextureRatio;
uniform vec2 u_viewport;
uniform vec2 u_region;
uniform float u_shadowExpand;
uniform float u_shadowFactor;
uniform vec2 u_shadowPosition;

${SDF_CHUNK}

vec2 getCoverUV(vec2 uv, float canvasAspect, float textureAspect) {
  if (canvasAspect > textureAspect) {
    float scale = textureAspect / canvasAspect;
    uv.y = uv.y * scale + 0.5 - 0.5 * scale;
  } else {
    float scale = canvasAspect / textureAspect;
    uv.x = uv.x * scale + 0.5 - 0.5 * scale;
  }
  return uv;
}

void main() {
  vec2 u_resolution1x = u_resolution.xy / u_dpr;
  vec3 bgColor = vec3(0.35);

  if (u_bgTextureReady == 1) {
    // Fragment position in viewport CSS pixels (top-down)
    vec2 fragCss = vec2(
      u_region.x + gl_FragCoord.x / u_dpr,
      u_region.y + (u_resolution.y - gl_FragCoord.y) / u_dpr
    );
    vec2 viewportUV = vec2(fragCss.x / u_viewport.x, 1.0 - fragCss.y / u_viewport.y);
    vec2 uv = getCoverUV(viewportUV, u_viewport.x / u_viewport.y, u_bgTextureRatio);
    bgColor = texture(u_bgTexture, uv).rgb;
  }

  float merged = mainSDF(gl_FragCoord.xy + u_shadowPosition * u_dpr);
  float shadow =
    exp(-1.0 / u_shadowExpand * abs(merged) * u_resolution1x.y) * 0.6 * u_shadowFactor;

  // The studio bakes the full shadow everywhere; over dark wallpapers that
  // crushes the glass interior to black, so keep only a hint of it inside.
  float inside = 1.0 - smoothstep(-2.0 / u_resolution.y, 0.0, mainSDF(gl_FragCoord.xy));
  shadow *= mix(1.0, 0.25, inside);

  fragColor = vec4(bgColor - vec3(shadow), 1.0);
}
`

const BLUR_CHUNK = /* glsl */ `#version 300 es
precision highp float;

#define MAX_BLUR_RADIUS (${MAX_BLUR_RADIUS})

in vec2 v_uv;

uniform sampler2D u_prevPassTexture;
uniform vec2 u_resolution;
uniform int u_blurRadius;
uniform float u_blurWeights[MAX_BLUR_RADIUS + 1];

out vec4 fragColor;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 color = texture(u_prevPassTexture, v_uv) * u_blurWeights[0];
  for (int i = 1; i <= MAX_BLUR_RADIUS; ++i) {
    if (i > u_blurRadius) break;
    float w = u_blurWeights[i];
    vec2 offset = vec2(float(i)) * texelSize;
`

export const FRAG_VBLUR = `${BLUR_CHUNK}
    color += texture(u_prevPassTexture, v_uv + vec2(0.0, offset.y)) * w;
    color += texture(u_prevPassTexture, v_uv - vec2(0.0, offset.y)) * w;
  }
  fragColor = color;
}
`

export const FRAG_HBLUR = `${BLUR_CHUNK}
    color += texture(u_prevPassTexture, v_uv + vec2(offset.x, 0.0)) * w;
    color += texture(u_prevPassTexture, v_uv - vec2(offset.x, 0.0)) * w;
  }
  fragColor = color;
}
`

// Main glass pass — the studio's final composition step (STEP 9): edge
// refraction from glass thickness/refractive index, chromatic dispersion,
// tint, fresnel rim and angular glare boosted in LCH space.
export const FRAG_MAIN = /* glsl */ `#version 300 es
precision highp float;

#define PI (3.14159265359)

const float N_R = 1.0 - 0.02;
const float N_G = 1.0;
const float N_B = 1.0 + 0.02;

in vec2 v_uv;
uniform sampler2D u_blurredBg;
uniform sampler2D u_bg;
uniform vec2 u_resolution;
uniform float u_dpr;
uniform vec4 u_tint;
uniform float u_refThickness;
uniform float u_refFactor;
uniform float u_refDispersion;
uniform float u_refFresnelRange;
uniform float u_refFresnelFactor;
uniform float u_refFresnelHardness;
uniform float u_glareRange;
uniform float u_glareConvergence;
uniform float u_glareOppositeFactor;
uniform float u_glareFactor;
uniform float u_glareHardness;
uniform float u_glareAngle;
uniform int u_blurEdge;
uniform float u_shadowExpand;
uniform float u_shadowFactor;
uniform vec2 u_shadowPosition;

out vec4 fragColor;

${SDF_CHUNK}

float safeAsin(float x) {
  return asin(clamp(x, -1.0, 1.0));
}

vec2 getNormal(vec2 p) {
  vec2 h = vec2(max(abs(dFdx(p.x)), 0.0001), max(abs(dFdy(p.y)), 0.0001));

  vec2 grad =
    vec2(
      mainSDF(p + vec2(h.x, 0.0)) - mainSDF(p - vec2(h.x, 0.0)),
      mainSDF(p + vec2(0.0, h.y)) - mainSDF(p - vec2(0.0, h.y))
    ) /
    (2.0 * h);

  return grad * 1.414213562 * 1000.0;
}

// --- LCH color stack, from the studio's lib/color.glsl ---
const vec3 D65_WHITE = vec3(0.95045592705, 1.0, 1.08905775076);
const mat3 RGB_TO_XYZ_M = mat3(
  0.4124, 0.3576, 0.1805,
  0.2126, 0.7152, 0.0722,
  0.0193, 0.1192, 0.9505
);
const mat3 XYZ_TO_RGB_M = mat3(
   3.2406255, -1.537208 , -0.4986286,
  -0.9689307,  1.8757561,  0.0415175,
   0.0557101, -0.2040211,  1.0569959
);

float UNCOMPAND_SRGB(float a) {
  return a > 0.04045 ? pow((a + 0.055) / 1.055, 2.4) : a / 12.92;
}

float COMPAND_RGB(float a) {
  return a <= 0.0031308 ? 12.92 * a : 1.055 * pow(a, 0.41666666666) - 0.055;
}

vec3 SRGB_TO_XYZ(vec3 srgb) {
  vec3 rgb = vec3(UNCOMPAND_SRGB(srgb.x), UNCOMPAND_SRGB(srgb.y), UNCOMPAND_SRGB(srgb.z));
  return rgb * RGB_TO_XYZ_M;
}

vec3 XYZ_TO_SRGB(vec3 xyz) {
  vec3 rgb = xyz * XYZ_TO_RGB_M;
  return vec3(COMPAND_RGB(rgb.x), COMPAND_RGB(rgb.y), COMPAND_RGB(rgb.z));
}

float XYZ_TO_LAB_F(float x) {
  return x > 0.00885645167 ? pow(x, 0.333333333) : 7.78703703704 * x + 0.13793103448;
}

vec3 XYZ_TO_LAB(vec3 xyz) {
  vec3 f = vec3(
    XYZ_TO_LAB_F(xyz.x / D65_WHITE.x),
    XYZ_TO_LAB_F(xyz.y / D65_WHITE.y),
    XYZ_TO_LAB_F(xyz.z / D65_WHITE.z)
  );
  return vec3(116.0 * f.y - 16.0, 500.0 * (f.x - f.y), 200.0 * (f.y - f.z));
}

float LAB_TO_XYZ_F(float x) {
  return x > 0.206897 ? x * x * x : 0.12841854934 * (x - 0.13793103448);
}

vec3 LAB_TO_XYZ(vec3 lab) {
  float fy = (lab.x + 16.0) / 116.0;
  return vec3(
    D65_WHITE.x * LAB_TO_XYZ_F(fy + lab.y / 500.0),
    D65_WHITE.y * LAB_TO_XYZ_F(fy),
    D65_WHITE.z * LAB_TO_XYZ_F(fy - lab.z / 200.0)
  );
}

vec3 LAB_TO_LCH(vec3 lab) {
  return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));
}

vec3 LCH_TO_LAB(vec3 lch) {
  return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));
}

vec3 SRGB_TO_LCH(vec3 srgb) {
  return LAB_TO_LCH(XYZ_TO_LAB(SRGB_TO_XYZ(srgb)));
}

vec3 LCH_TO_SRGB(vec3 lch) {
  return XYZ_TO_SRGB(LAB_TO_XYZ(LCH_TO_LAB(lch)));
}
// --- end color stack ---

float vec2ToAngle(vec2 v) {
  float angle = atan(v.y, v.x);
  if (angle < 0.0) angle += 2.0 * PI;
  return angle;
}

vec4 getTextureDispersion(
  sampler2D tex1,
  sampler2D tex2,
  float mixRate,
  vec2 offset,
  float factor
) {
  vec4 pixel = vec4(1.0);

  float bgR = texture(tex1, v_uv + offset * (1.0 - (N_R - 1.0) * factor)).r;
  float bgG = texture(tex1, v_uv + offset * (1.0 - (N_G - 1.0) * factor)).g;
  float bgB = texture(tex1, v_uv + offset * (1.0 - (N_B - 1.0) * factor)).b;

  float blurR = texture(tex2, v_uv + offset * (1.0 - (N_R - 1.0) * factor)).r;
  float blurG = texture(tex2, v_uv + offset * (1.0 - (N_G - 1.0) * factor)).g;
  float blurB = texture(tex2, v_uv + offset * (1.0 - (N_B - 1.0) * factor)).b;

  pixel.r = mix(bgR, blurR, mixRate);
  pixel.g = mix(bgG, blurG, mixRate);
  pixel.b = mix(bgB, blurB, mixRate);

  return pixel;
}

void main() {
  vec2 u_resolution1x = u_resolution.xy / u_dpr;
  float merged = mainSDF(gl_FragCoord.xy);

  vec4 outColor;

  if (merged < 0.005) {
    float nmerged = -1.0 * (merged * u_resolution1x.y);

    // refraction edge factor from glass thickness + refractive index
    float x_R_ratio = 1.0 - nmerged / u_refThickness;
    float thetaI = safeAsin(pow(x_R_ratio, 2.0));
    float thetaT = safeAsin(1.0 / u_refFactor * sin(thetaI));
    float edgeFactor = -1.0 * tan(thetaT - thetaI);
    if (nmerged >= u_refThickness) {
      edgeFactor = 0.0;
    }

    if (edgeFactor <= 0.0) {
      outColor = texture(u_blurredBg, v_uv);
      outColor = mix(outColor, vec4(u_tint.r, u_tint.g, u_tint.b, 1.0), u_tint.a * 0.8);
    } else {
      float edgeH = nmerged / u_refThickness;
      vec2 normal = getNormal(gl_FragCoord.xy);
      vec4 blurredPixel = getTextureDispersion(
        u_bg,
        u_blurredBg,
        u_blurEdge > 0 ? 1.0 : edgeH,
        -normal *
          edgeFactor *
          0.05 *
          u_dpr *
          vec2(u_resolution.y / (u_resolution1x.x * u_dpr), 1.0),
        u_refDispersion
      );

      // basic tint
      outColor = mix(blurredPixel, vec4(u_tint.r, u_tint.g, u_tint.b, 1.0), u_tint.a * 0.8);

      // fresnel rim
      float fresnelFactor = clamp(
        pow(
          1.0 +
            merged * u_resolution1x.y / 1500.0 * pow(500.0 / u_refFresnelRange, 2.0) +
            u_refFresnelHardness,
          5.0
        ),
        0.0,
        1.0
      );

      vec3 fresnelTintLCH = SRGB_TO_LCH(
        mix(vec3(1.0), vec3(u_tint.r, u_tint.g, u_tint.b), u_tint.a * 0.5)
      );
      fresnelTintLCH.x += 20.0 * fresnelFactor * u_refFresnelFactor;
      fresnelTintLCH.x = clamp(fresnelTintLCH.x, 0.0, 100.0);

      outColor = mix(
        outColor,
        vec4(LCH_TO_SRGB(fresnelTintLCH), 1.0),
        fresnelFactor * u_refFresnelFactor * 0.7 * length(normal)
      );

      // angular glare
      float glareGeoFactor = clamp(
        pow(
          1.0 +
            merged * u_resolution1x.y / 1500.0 * pow(500.0 / u_glareRange, 2.0) +
            u_glareHardness,
          5.0
        ),
        0.0,
        1.0
      );

      float glareAngle = (vec2ToAngle(normalize(normal)) - PI / 4.0 + u_glareAngle) * 2.0;
      int glareFarside = 0;
      if (
        glareAngle > PI * (2.0 - 0.5) && glareAngle < PI * (4.0 - 0.5) ||
        glareAngle < PI * (0.0 - 0.5)
      ) {
        glareFarside = 1;
      }
      float glareAngleFactor =
        (0.5 + sin(glareAngle) * 0.5) *
        (glareFarside == 1 ? 1.2 * u_glareOppositeFactor : 1.2) *
        u_glareFactor;
      glareAngleFactor = clamp(pow(glareAngleFactor, 0.1 + u_glareConvergence * 2.0), 0.0, 1.0);

      vec3 glareTintLCH = SRGB_TO_LCH(
        mix(blurredPixel.rgb, vec3(u_tint.r, u_tint.g, u_tint.b), u_tint.a * 0.5)
      );
      glareTintLCH.x += 150.0 * glareAngleFactor * glareGeoFactor;
      glareTintLCH.y += 30.0 * glareAngleFactor * glareGeoFactor;
      glareTintLCH.x = clamp(glareTintLCH.x, 0.0, 120.0);

      outColor = mix(
        outColor,
        vec4(LCH_TO_SRGB(glareTintLCH), 1.0),
        glareAngleFactor * glareGeoFactor * length(normal)
      );
    }

    // anti-aliased shape coverage; the canvas is transparent outside the glass
    float coverage = 1.0 - smoothstep(-1.5 / u_resolution.y, 1.5 / u_resolution.y, merged);
    float shadow =
      exp(
        -1.0 / u_shadowExpand *
          abs(mainSDF(gl_FragCoord.xy + u_shadowPosition * u_dpr)) *
          u_resolution1x.y
      ) *
      0.6 *
      u_shadowFactor;
    float alpha = max(coverage, shadow * (1.0 - coverage));
    vec3 rgb = mix(vec3(0.0), outColor.rgb, coverage);
    fragColor = vec4(rgb * alpha, alpha);
  } else {
    // outside the glass: only the soft drop shadow, over transparency
    float shadow =
      exp(
        -1.0 / u_shadowExpand *
          abs(mainSDF(gl_FragCoord.xy + u_shadowPosition * u_dpr)) *
          u_resolution1x.y
      ) *
      0.6 *
      u_shadowFactor;
    fragColor = vec4(0.0, 0.0, 0.0, shadow);
  }
}
`

// From the studio's utils: normalized one-sided gaussian kernel
export function computeGaussianKernelByRadius(radius: number) {
  const sigma = radius / 3.0
  const kernel: number[] = []
  let sum = 0
  for (let i = 0; i <= radius; i++) {
    const weight = Math.exp((-0.5 * (i * i)) / (sigma * sigma))
    kernel.push(weight)
    sum += i === 0 ? weight : weight * 2
  }
  return kernel.map((w) => w / sum)
}

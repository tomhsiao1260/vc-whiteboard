import { ShaderMaterial, Vector2, DoubleSide } from "three";

export class SolidMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      // transparent: true,
      side: DoubleSide,

      uniforms: {
        uFlatten : { value: 0 },
        uFlip : { value: true },
        uAlpha : { value: 1.0 },
        uArea : { value: 1.0 },
        uCenter : { value: 1.0 },
        uNormal : { value: 1.0 },
        uTifsize : { value: 1.0 },
        uTifsize : { value: 1.0 },
        uBasevectorX : { value: 1.0 },
        uBasevectorY : { value: 1.0 },
        uTexture : { value: null },
        uMask : { value: null },
      },

      vertexShader: /* glsl */ `
        uniform float uFlatten;
        uniform float uArea;
        uniform bool uFlip;
        uniform vec3 uCenter;
        uniform vec3 uNormal;
        uniform vec2 uTifsize;
        uniform vec3 uBasevectorX;
        uniform vec3 uBasevectorY;
        varying vec2 vUv;

        void main() {
          float flip = uFlip ? -1.0 : 1.0;
          float r = uTifsize.y / uTifsize.x;

          vec3 dir = (0.5 - uv.x) * uBasevectorX + (0.5 - uv.y) * uBasevectorY * r * flip;
          vec3 flatten = uCenter + dir * sqrt(uArea / r);

          vec3 newPosition = position + (flatten - position) * uFlatten;

          vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;

          gl_Position = projectedPosition;

          vUv = uv;
      }
      `,

      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform sampler2D uMask;
        uniform float uAlpha;

        void main() {
          vec4 textureSeg = texture2D(uTexture, vUv);
          vec4 mask = texture2D(uMask, vUv);
          float intensity = textureSeg.r;
          float maskI = mask.a;

          vec3 color = intensity * 0.88 * vec3(0.93, 0.80, 0.70);

          if (maskI < 0.1) { gl_FragColor = vec4(color, 1.0); return; }

          gl_FragColor = vec4(color, 1.0) * (1.0 - maskI * uAlpha);
        }
      `
    });

    this.setValues(params);
  }
}

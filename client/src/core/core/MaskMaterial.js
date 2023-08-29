import { ShaderMaterial, Vector2, DoubleSide } from "three";

export class MaskMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      transparent: true,
      side: DoubleSide,

      uniforms: {
        uAlpha : { value: 1.0 },
        uTexture : { value: null },
        uMask : { value: null }
      },

      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
      `,

      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uAlpha;
        uniform sampler2D uMask;
        uniform sampler2D uTexture;

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

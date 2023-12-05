import { ShaderMaterial, DoubleSide } from "three"

export class FragmentShader extends ShaderMaterial {
  constructor(params) {
    super({
      side: DoubleSide,
      transparent: true,

      uniforms: {
        tDiffuse: { value: null },
        uMask: { value: null },
        opacity: { value: 1.0 }
      },

      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
      `,

      fragmentShader: /* glsl */ `
        uniform float opacity;
        uniform sampler2D uMask;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;

        void main() {
          float intensity = texture2D( tDiffuse, vUv ).r;
          vec4 mask = texture2D( uMask, vUv );
          float maskI = mask.a;
          if (intensity < 0.0001) { gl_FragColor = vec4(0.0); return; }

          vec3 color = intensity * 0.88 * vec3(0.93, 0.80, 0.70);

          if (maskI < 0.1) { gl_FragColor = vec4(color, 1.0); return; }
          gl_FragColor = vec4(color, 1.0) * (1.0 - maskI * opacity);
          // gl_FragColor = vec4(color, opacity);
        }
      `
    });

    this.setValues(params);
  }
}

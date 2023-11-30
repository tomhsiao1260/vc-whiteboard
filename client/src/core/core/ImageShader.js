import { ShaderMaterial, DoubleSide } from "three"

export class ImageShader extends ShaderMaterial {
  constructor(params) {
    super({
      transparent: true,

      uniforms: {
        tDiffuse: { value: null },
        opacity: { value: 1.0 }
      },

      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4( position, 1.0 );
      }
      `,

      fragmentShader: /* glsl */ `
        uniform float opacity;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;

        void main() {
          vec4 color = texture2D( tDiffuse, vUv );
          gl_FragColor = color;
        }
      `
    });

    this.setValues(params);
  }
}

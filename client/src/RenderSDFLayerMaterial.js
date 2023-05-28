import { ShaderMaterial, Vector2 } from "three";

export class RenderSDFLayerMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      defines: {
        DISPLAY_GRID: 0
      },

      uniforms: {
        surface: { value: 0 },
        voldata: { value: null },
        sdfTex: { value: null },
        cmdata: { value: null },
        layer: { value: 0 },
        layers: { value: 0 },
        clim: { value: new Vector2() },
      },

      vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = vec2(uv.x, 1.0 - uv.y);
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}
			`,

      fragmentShader: /* glsl */ `
        precision highp sampler3D;
				varying vec2 vUv;
        uniform vec2 clim;
        uniform sampler3D voldata;
        uniform sampler3D sdfTex;
        uniform sampler2D cmdata;
        uniform float layer;
        uniform float layers;
        uniform float surface;

        vec4 apply_colormap(float val) {
          val = (val - clim[0]) / (clim[1] - clim[0]);
          return texture2D(cmdata, vec2(val, 0.5));
        }

				void main() {
          #if DISPLAY_GRID
          float dim = ceil( sqrt( layers ) );
					vec2 cell = floor( vUv * dim );
					vec2 frac = vUv * dim - cell;
					float zLayer = ( cell.y * dim + cell.x ) / ( dim * dim );
					float dist = texture( sdfTex, vec3( frac, zLayer ) ).r - surface;
          float intensity = texture( voldata, vec3( frac, zLayer ) ).r;

          gl_FragColor = apply_colormap(intensity);
          if (frac.x < 0.01 || frac.y < 0.01) gl_FragColor = vec4(0, 0, 0, 1.0);
          if (dist > 0.0) gl_FragColor = vec4(0, 0, 0, 1.0);
          #else
          float dist = texture( sdfTex, vec3( vUv, layer ) ).r - surface;
          float intensity = texture( voldata, vec3( vUv, layer ) ).r;

          gl_FragColor = apply_colormap(intensity);
          if (dist > 0.0) gl_FragColor = vec4(0, 0, 0, 1.0);
          #endif
          #include <encodings_fragment>
				}
			`
    });

    this.setValues(params);
  }
}
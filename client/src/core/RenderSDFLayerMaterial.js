import { ShaderMaterial, Vector2 } from "three";

export class RenderSDFLayerMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      defines: {
        DISPLAY_GRID: 0
      },

      uniforms: {
        inverse: { value: false },
        surface: { value: 0 },
        voldata: { value: null },
        sdfTex: { value: null },
        sdfTexFocus: { value: null },
        cmdata: { value: null },
        // change
        thickness: { value: 0 },
        layer: { value: 0 },
        volumeAspect: { value: 0 },
        screenAspect: { value: 0 },
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
        // change
        precision highp sampler2DArray;
        varying vec2 vUv;
        uniform vec2 clim;
        uniform sampler3D voldata;
        // uniform sampler3D sdfTex;
        // change
        uniform sampler2DArray sdfTex;
        uniform sampler2DArray sdfTexFocus;
        uniform sampler2D cmdata;
        uniform float thickness;
        uniform float layer;
        uniform float volumeAspect;
        uniform float screenAspect;
        uniform float surface;
        uniform bool inverse;

        vec4 apply_colormap(float val) {
          val = (val - clim[0]) / (clim[1] - clim[0]);
          return texture2D(cmdata, vec2(val, 0.5));
        }

        void main() {
          float r = screenAspect / volumeAspect;

          #if DISPLAY_GRID
          float dimH = 5.0;
          float dimW = floor(r * dimH);

          float aspect = r / (dimW / dimH);
          vec2 uv = vec2( (vUv.x - 0.5) * aspect, (vUv.y - 0.5)) + vec2(0.5);
          if ( uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 ) return;

          vec2 cell = floor( uv * vec2(dimW, dimH) );
          vec2 frac = uv * vec2(dimW, dimH) - cell;
          float zLayer = ( cell.y * dimW + cell.x ) / ( dimH * dimW );

          // change
          float dist = texture( sdfTex, vec3( frac, zLayer * thickness ) ).r - surface;
          float intensity = texture( voldata, vec3( frac, zLayer ) ).r;

          gl_FragColor = apply_colormap(intensity);
          if (frac.x < 0.01 || frac.y < 0.01) gl_FragColor = vec4(0, 0, 0, 1.0);

          bool s = dist < 0.0 && dist > -surface;
          if (inverse && s) gl_FragColor = vec4(0, 0, 0, 0.0);
          if (!inverse && !s) gl_FragColor = vec4(0, 0, 0, 0.0);
          #else
          float aspect = r;
          vec2 uv = vec2( (vUv.x - 0.5) * aspect, (vUv.y - 0.5)) + vec2(0.5);
          if ( uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 ) return;

          // change
          float dist = texture( sdfTex, vec3( uv, layer * thickness ) ).r - surface;
          float intensity = texture( voldata, vec3( uv, layer ) ).r;

          gl_FragColor = apply_colormap(intensity);

          bool s = dist < 0.0 && dist > -surface;
          if (inverse && s) gl_FragColor = vec4(0, 0, 0, 0.0);
          if (!inverse && !s) gl_FragColor = vec4(0, 0, 0, 0.0);

          float f_dist = texture( sdfTexFocus, vec3( uv, layer * thickness ) ).r - surface;
          if (f_dist > -surface && f_dist < 0.0 && dist < 0.0) gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

          #endif
          #include <colorspace_fragment>
                }
            `
    });

    this.setValues(params);
  }
}

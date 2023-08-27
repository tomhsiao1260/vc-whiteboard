import { ShaderMaterial, Matrix4, Vector2, Vector3 } from "three";

export class VolumeMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      defines: {
        // The maximum distance through our rendering volume is sqrt(3).
        MAX_STEPS: 887,  // 887 for 512^3, 1774 for 1024^3
        REFINEMENT_STEPS: 4,
        SURFACE_EPSILON: 0.001
      },

      uniforms: {
        surface: { value: 0 },
        sdfTex: { value: null },
        sdfTexFocus: { value: null },
        voldata: { value: null },
        cmdata: { value: null },
        // change
        thickness: { value: 0 },
        segmentMode: { value: false },
        size: { value: new Vector3() },
        clim: { value: new Vector2() },
        renderthreshold: { value: 0 },
        renderstyle: { value: 0 }, // 0: MIP, 1: ISO
        projectionInverse: { value: new Matrix4() },
        sdfTransformInverse: { value: new Matrix4() }
      },

      vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}
			`,

      fragmentShader: /* glsl */ `
        precision highp sampler3D;
        // change
        precision highp sampler2DArray;
				varying vec2 vUv;
        uniform vec2 clim;
        uniform vec3 size;
        // uniform sampler3D sdfTex;
        // change
        uniform sampler2DArray sdfTex;
        uniform sampler2DArray sdfTexFocus;
        // change
        uniform float thickness;
        uniform sampler3D voldata;
        uniform sampler2D cmdata;
        uniform mat4 projectionInverse;
				uniform mat4 sdfTransformInverse;
        uniform float renderthreshold;
        uniform float surface;
        uniform int renderstyle;
        uniform bool segmentMode;

        const float relative_step_size = 1.0;
        const vec4 ambient_color = vec4(0.2, 0.4, 0.2, 1.0);
        const vec4 diffuse_color = vec4(0.8, 0.2, 0.2, 1.0);
        const vec4 specular_color = vec4(1.0, 1.0, 1.0, 1.0);
        const float shininess = 40.0;

        void cast_mip(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray);
        void cast_iso(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray);

        float sample1(vec3 texcoords);
        vec4 apply_colormap(float val);
        vec4 add_lighting(float val, vec3 loc, vec3 step, vec3 view_ray);

        // distance to box bounds
				vec2 rayBoxDist( vec3 boundsMin, vec3 boundsMax, vec3 rayOrigin, vec3 rayDir ) {
					vec3 t0 = ( boundsMin - rayOrigin ) / rayDir;
					vec3 t1 = ( boundsMax - rayOrigin ) / rayDir;
					vec3 tmin = min( t0, t1 );
					vec3 tmax = max( t0, t1 );
					float distA = max( max( tmin.x, tmin.y ), tmin.z );
					float distB = min( tmax.x, min( tmax.y, tmax.z ) );
					float distToBox = max( 0.0, distA );
					float distInsideBox = max( 0.0, distB - distToBox );
					return vec2( distToBox, distInsideBox );
				}

				void main() {
          float fragCoordZ = -1.;

          // float v = texture(sdfTex, vec3( vUv, 1.0 )).r;
          // gl_FragColor = vec4(v, v, v, 1.0); return;

          // get the inverse of the sdf box transform
					mat4 sdfTransform = inverse( sdfTransformInverse );
          // convert the uv to clip space for ray transformation
					vec2 clipSpace = 2.0 * vUv - vec2( 1.0 );
          // get world ray direction
					vec3 rayOrigin = vec3( 0.0 );
          vec4 homogenousDirection = projectionInverse * vec4( clipSpace, - 1.0, 1.0 );
          vec3 rayDirection = normalize( homogenousDirection.xyz / homogenousDirection.w );
          // transform ray into local coordinates of sdf bounds
          vec3 sdfRayOrigin = ( sdfTransformInverse * vec4( rayOrigin, 1.0 ) ).xyz;
          vec3 sdfRayDirection = normalize( ( sdfTransformInverse * vec4( rayDirection, 0.0 ) ).xyz );
          // find whether our ray hits the box bounds in the local box space
          vec2 boxIntersectionInfo = rayBoxDist( vec3( - 0.5 ), vec3( 0.5 ), sdfRayOrigin, sdfRayDirection );
          float distToBox = boxIntersectionInfo.x;
          float distInsideBox = boxIntersectionInfo.y;
					bool intersectsBox = distInsideBox > 0.0;
					gl_FragColor = vec4( 0.0 );

          if ( intersectsBox ) {
            // Decide how many steps to take
            int nsteps = int(boxIntersectionInfo.y * size.x / relative_step_size + 0.5);
            if ( nsteps < 1 ) discard;

            bool intersectsSurface = false;
            vec4 boxNearPoint = vec4( sdfRayOrigin + sdfRayDirection * ( distToBox + 1e-5 ), 1.0 );
            vec4 boxFarPoint = vec4( sdfRayOrigin + sdfRayDirection * ( distToBox + distInsideBox - 1e-5 ), 1.0 );
            vec4 nearPoint = sdfTransform * boxNearPoint;
            vec4 farPoint = sdfTransform * boxFarPoint;

            // For testing: show the number of steps. This helps to establish whether the rays are correctly oriented
            // gl_FragColor = vec4(0.0, float(nsteps) / size.x, 1.0, 1.0);
            // return;

            if (segmentMode) {
              // ray march (near -> surface)
              for ( int i = 0; i < MAX_STEPS; i ++ ) {
                // sdf box extends from - 0.5 to 0.5
                // transform into the local bounds space [ 0, 1 ] and check if we're inside the bounds
                vec3 uv = ( sdfTransformInverse * nearPoint ).xyz + vec3( 0.5 );
                // change
                vec3 uvc =  vec3(uv.xy, uv.z * thickness);
                // get the distance to surface and exit the loop if we're close to the surface
                // change
                float distanceToSurface = texture( sdfTex, uvc ).r - surface;
                if ( distanceToSurface < SURFACE_EPSILON ) {
                  intersectsSurface = true;
                  break;
                }
                if ( uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 || uv.z < 0.0 || uv.z > 1.0 ) {
                  break;
                }
                // step the ray
                nearPoint.xyz += rayDirection * abs( distanceToSurface );
              }

              if (intersectsSurface) {
                // ray march (far -> surface)
                for ( int i = 0; i < MAX_STEPS; i ++ ) {
                  // sdf box extends from - 0.5 to 0.5
                  // transform into the local bounds space [ 0, 1 ] and check if we're inside the bounds
                  vec3 uv = ( sdfTransformInverse * farPoint ).xyz + vec3( 0.5 );
                  // change
                  vec3 uvc =  vec3(uv.xy, uv.z * thickness);
                  // get the distance to surface and exit the loop if we're close to the surface
                  // change
                  float distanceToSurface = texture( sdfTex, uvc ).r - surface;
                  if ( distanceToSurface < SURFACE_EPSILON ) {
                    break;
                  }
                  if ( uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 || uv.z < 0.0 || uv.z > 1.0 ) {
                    break;
                  }
                  // step the ray
                  farPoint.xyz -= rayDirection * abs( distanceToSurface );
                }
              }
            } else {
              intersectsSurface = true;
            }

            // volume rendering
            if ( intersectsSurface ) {
              float thickness = length((sdfTransformInverse * (farPoint - nearPoint)).xyz);

              if (segmentMode) {
                nsteps = int(thickness * size.x / relative_step_size + 0.5);
                if ( nsteps < 1 ) discard;
              }

              vec3 step = sdfRayDirection * thickness / float(nsteps);
              vec3 uv = (sdfTransformInverse * nearPoint).xyz + vec3( 0.5 );

              if (renderstyle == 0)
                cast_mip(uv, step, nsteps, sdfRayDirection);
              else if (renderstyle == 1)
                cast_iso(uv, step, nsteps, sdfRayDirection);
              return;
            }

            if (gl_FragColor.a < 0.05)
             discard;
          }
				}

        float sample1(vec3 texcoords) {
          /* Sample float value from a 3D texture. Assumes intensity data. */
          return texture(voldata, texcoords.xyz).r;
        }

        vec4 apply_colormap(float val) {
          val = (val - clim[0]) / (clim[1] - clim[0]);
          return texture2D(cmdata, vec2(val, 0.5));
        }

        void cast_mip(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray) {

          float max_val = -1e6;
          int max_i = 100;
          vec3 loc = start_loc;

          // Enter the raycasting loop. In WebGL 1 the loop index cannot be compared with
          // non-constant expression. So we use a hard-coded max, and an additional condition
          // inside the loop.
          for (int iter=0; iter<MAX_STEPS; iter++) {
            if (iter >= nsteps)
              break;
            // Sample from the 3D texture
            float val = sample1(loc);
            // Apply MIP operation
            if (val > max_val) {
              max_val = val;
              max_i = iter;
            }
            // Advance location deeper into the volume
            loc += step;
          }

          // Refine location, gives crispier images
          vec3 iloc = start_loc + step * (float(max_i) - 0.5);
          vec3 istep = step / float(REFINEMENT_STEPS);
          for (int i=0; i<REFINEMENT_STEPS; i++) {
            max_val = max(max_val, sample1(iloc));
            iloc += istep;
          }

          // Resolve final color
          gl_FragColor = apply_colormap(max_val);
        }

        void cast_iso(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray) {

          gl_FragColor = vec4(0.0);   // init transparent
          vec4 color3 = vec4(0.0);    // final color
          vec3 dstep = 1.5 / size;  // step to sample derivative
          vec3 loc = start_loc;

          float low_threshold = renderthreshold - 0.02 * (clim[1] - clim[0]);

          // Enter the raycasting loop. In WebGL 1 the loop index cannot be compared with
          // non-constant expression. So we use a hard-coded max, and an additional condition
          // inside the loop.
          for (int iter=0; iter<MAX_STEPS; iter++) {
            if (iter >= nsteps)
              break;

            // Sample from the 3D texture
            float val = sample1(loc);

            if (val > low_threshold) {
              // Take the last interval in smaller steps
              vec3 iloc = loc - 0.5 * step;
              vec3 istep = step / float(REFINEMENT_STEPS);
              for (int i=0; i<REFINEMENT_STEPS; i++) {
                val = sample1(iloc);
                if (val > renderthreshold) {
                  gl_FragColor = add_lighting(val, iloc, dstep, view_ray);
                    return;
                }
                iloc += istep;
              }
            }

            // Advance location deeper into the volume
            loc += step;
          }
        }

        vec4 add_lighting(float val, vec3 loc, vec3 step, vec3 view_ray)
        {
          // Calculate color by incorporating lighting

          // View direction
          vec3 V = normalize(view_ray);

          // calculate normal vector from gradient
          vec3 N;
          float val1, val2;
          val1 = sample1(loc + vec3(-step[0], 0.0, 0.0));
          val2 = sample1(loc + vec3(+step[0], 0.0, 0.0));
          N[0] = val1 - val2;
          val = max(max(val1, val2), val);
          val1 = sample1(loc + vec3(0.0, -step[1], 0.0));
          val2 = sample1(loc + vec3(0.0, +step[1], 0.0));
          N[1] = val1 - val2;
          val = max(max(val1, val2), val);
          val1 = sample1(loc + vec3(0.0, 0.0, -step[2]));
          val2 = sample1(loc + vec3(0.0, 0.0, +step[2]));
          N[2] = val1 - val2;
          val = max(max(val1, val2), val);

          float gm = length(N); // gradient magnitude
          N = normalize(N);

          // Flip normal so it points towards viewer
          float Nselect = float(dot(N, V) > 0.0);
          N = (2.0 * Nselect - 1.0) * N;  // ==   Nselect * N - (1.0-Nselect)*N;

          // Init colors
          vec4 ambient_color = vec4(0.0, 0.0, 0.0, 0.0);
          vec4 diffuse_color = vec4(0.0, 0.0, 0.0, 0.0);
          vec4 specular_color = vec4(0.0, 0.0, 0.0, 0.0);

          // note: could allow multiple lights
          for (int i=0; i<1; i++)
          {
            // Get light direction (make sure to prevent zero devision)
            vec3 L = normalize(view_ray);   //lightDirs[i];
            float lightEnabled = float( length(L) > 0.0 );
            L = normalize(L + (1.0 - lightEnabled));

            // Calculate lighting properties
            float lambertTerm = clamp(dot(N, L), 0.0, 1.0);
            vec3 H = normalize(L+V); // Halfway vector
            float specularTerm = pow(max(dot(H, N), 0.0), shininess);

            // Calculate mask
            float mask1 = lightEnabled;

            // Calculate colors
            ambient_color +=    mask1 * ambient_color;  // * gl_LightSource[i].ambient;
            diffuse_color +=    mask1 * lambertTerm;
            specular_color += mask1 * specularTerm * specular_color;
          }

          // Calculate final color by componing different components
          vec4 final_color;
          vec4 color = apply_colormap(val);
          final_color = color * (ambient_color + diffuse_color) + specular_color;
          final_color.a = color.a;
          return final_color;
        }`
    });

    this.setValues(params);
  }
}
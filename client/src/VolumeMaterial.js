import { ShaderMaterial, Matrix4, Vector2, Vector3 } from "three";

export class VolumeMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      defines: {
        // The maximum distance through our rendering volume is sqrt(3).
        MAX_STEPS: 887,  // 887 for 512^3, 1774 for 1024^3
        REFINEMENT_STEPS: 4
      },

      uniforms: {
        data: { value: null },
        cmdata: { value: null },
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
				varying vec2 vUv;
        uniform vec2 clim;
        uniform vec2 size;
        uniform sampler3D data;
        uniform sampler2D cmdata;
        uniform mat4 projectionInverse;
				uniform mat4 sdfTransformInverse;

        const float relative_step_size = 1.0;

        float sample1(vec3 texcoords);
        vec4 apply_colormap(float val);
        void cast_mip(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray);

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

            vec4 localPoint = vec4( sdfRayOrigin + sdfRayDirection * ( distToBox + 1e-5 ), 1.0 );
            vec3 uv = localPoint.xyz + vec3( 0.5 );
            vec3 step = sdfRayDirection * distInsideBox / float(nsteps);

            // For testing: show the number of steps. This helps to establish whether the rays are correctly oriented
            // gl_FragColor = vec4(0.0, float(nsteps) / size.x, 1.0, 1.0);
            // return;

            // gl_FragColor = vec4(vUv, 1.0, 1.0);
            cast_mip(uv, step, nsteps, sdfRayDirection);

            if (gl_FragColor.a < 0.05) discard;
          }
				}

        float sample1(vec3 texcoords) {
          /* Sample float value from a 3D texture. Assumes intensity data. */
          return texture(data, texcoords.xyz).r;
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
			`
    });

    this.setValues(params);
  }
}
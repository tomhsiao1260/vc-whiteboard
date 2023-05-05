import {
    Vector2,
    Vector3
} from 'three';

const InkLabelShader = {

    uniforms: {
        'u_alpha': { value: 1.0 },
        'u_labdata': { value: null }
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;

        void main() {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);  
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;

            // gl_Position = vec4(position, 1.0);
            gl_Position = projectedPosition;

            vUv = uv;
        }`,

    fragmentShader: /* glsl */`

        uniform float u_alpha;
        uniform sampler2D u_labdata;

        varying vec2 vUv;

        void main() {
            vec4 color = texture2D(u_labdata, vUv);

            if (color.x < 0.5) discard;

            gl_FragColor = vec4(color.xyz, u_alpha);
            // gl_FragColor = vec4(vUv, 1.0, u_alpha);
        }`

};

export { InkLabelShader };
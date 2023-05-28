import Stats from 'stats.js'
import * as THREE from 'three'

import meta from './meta.json'
import textureGray from './textures/cm_gray.png'
import textureViridis from './textures/cm_viridis.png'

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshBVH } from 'three-mesh-bvh'

import { GenerateSDFMaterial } from './GenerateSDFMaterial.js'
import { RenderSDFLayerMaterial } from './RenderSDFLayerMaterial.js'
import { RayMarchSDFMaterial } from './RayMarchSDFMaterial.js'
import { VolumeMaterial } from './VolumeMaterial.js'

const params = {
    gpuGeneration: true,
    resolution: 1.0,
    regenerate: () => updateSDF(),

    mode: 'geometry',
    layer: 0,
    surface: 1.8
}

const volconfig = {
    clim1: 0,
    clim2: 1,
    renderstyle: 'iso',
    renderthreshold: 0.15,
    colormap: 'viridis',
    label: 0.7
};

const { scale, clip, nrrd, obj } = meta
let renderer, camera, scene, gui, stats
let outputContainer, bvh, geometry, mesh, sdfTex, volumeTex
let generateSdfPass, layerPass, raymarchPass, volumePass
const inverseBoundsMatrix = new THREE.Matrix4()

const cmtextures = {
    viridis: new THREE.TextureLoader().load( textureViridis ),
    gray: new THREE.TextureLoader().load( textureGray )
};

init()
render()

function init() {
    outputContainer = document.getElementById('output')

    // renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    document.body.appendChild(renderer.domElement)

    // scene setup
    scene = new THREE.Scene()

    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(1, 1, 1)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xffffff, 0.2))

    // camera setup
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        50
    )
    camera.position.set(0, 0, -0.8)
    camera.up.set(0, -1, 0)
    camera.far = 5
    camera.updateProjectionMatrix()

    window.addEventListener(
        'resize',
        function () {
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
        },
        false
    )

    new OrbitControls(camera, renderer.domElement)

    // stats setup
    stats = new Stats()
    document.body.appendChild(stats.dom)

    // sdf pass to generate the 3d texture
    generateSdfPass = new FullScreenQuad(new GenerateSDFMaterial())
    // screen pass to render a single layer of the 3d texture
    layerPass = new FullScreenQuad(new RenderSDFLayerMaterial())
    // screen pass to render the sdf ray marching
    raymarchPass = new FullScreenQuad(new RayMarchSDFMaterial())
    // volume pass to render the volume data
    volumePass = new FullScreenQuad(new VolumeMaterial())


    const papyrus = new OBJLoader()
        .loadAsync(obj[0] + '.obj')
        .then((object) => {

            const s = 1 / Math.max(clip.w, clip.h, clip.d)
            geometry = object.children[0].geometry
            const positions = geometry.attributes.position.array

            for (let i = 0; i < positions.length; i += 3) {
                  const x = positions[i + 0] * scale;
                  const y = positions[i + 1] * scale;
                  const z = positions[i + 2] * scale;

                  const newX = - clip.w * s / 2 + (x - clip.x) * s
                  const newY = - clip.h * s / 2 + (y - clip.y) * s
                  const newZ = - clip.d * s / 2 + (z - clip.z) * s

                  positions[i + 0] = newX;
                  positions[i + 1] = newY;
                  positions[i + 2] = newZ;
            }
            geometry.attributes.position.needsUpdate = true

            geometry.computeBoundingBox()
            geometry.boundingBox.max.set( clip.w * s / 2,  clip.h * s / 2,  clip.d * s / 2)
            geometry.boundingBox.min.set(-clip.w * s / 2, -clip.h * s / 2, -clip.d * s / 2)
            console.log(geometry.boundingBox)

            return new MeshBVH(geometry, { maxLeafTris: 1 })
        })
        .then((result) => {
            bvh = result

            mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial())
            scene.add(mesh)
        })

    const voxel = new NRRDLoader()
        .loadAsync(nrrd)
        .then((volume) => {

            // THREEJS will select R32F (33326) based on the THREE.RedFormat and THREE.FloatType.
            // Also see https://www.khronos.org/registry/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
            volumeTex = new THREE.Data3DTexture( volume.data, volume.xLength, volume.yLength, volume.zLength )

            volumeTex.format = THREE.RedFormat
            volumeTex.type = THREE.FloatType
            volumeTex.minFilter = THREE.LinearFilter
            volumeTex.magFilter = THREE.LinearFilter
            // volumeTex.minFilter = THREE.NearestFilter
            // volumeTex.magFilter = THREE.NearestFilter
            volumeTex.unpackAlignment = 1
            volumeTex.needsUpdate = true

            const material = volumePass.material;
            material.uniforms.voldata.value = volumeTex;
            material.uniforms.size.value.set( volume.xLength, volume.yLength, volume.zLength );
        })

    Promise.all([papyrus, voxel]).then(() => { updateSDF(); rebuildGUI(); });
}

// build the gui with parameters based on the selected display mode
function rebuildGUI() {
    if (gui) {
        gui.destroy()
    }

    params.layer = Math.min(clip.d, params.layer)

    gui = new GUI()

    // const generationFolder = gui.addFolder('generation')
    // generationFolder.add(params, 'gpuGeneration')
    // generationFolder.add(params, 'resolution', 0.1, 1, 0.01)
    // generationFolder.add(params, 'regenerate')

    const displayFolder = gui.addFolder('display')
    displayFolder
      // .add(params, 'mode', ['volume', 'layer', 'grid layers'])
      .add(params, 'mode', ['geometry', 'raymarching', 'layer', 'grid layers', 'volume'])
      .onChange(() => {
        rebuildGUI()
      })

    if (params.mode === 'layer') {
      displayFolder.add(volconfig, 'clim1', 0, 1)
      displayFolder.add(volconfig, 'clim2', 0, 1)
      displayFolder.add(params, 'surface', -0.2, 2.0)
      displayFolder.add(params, 'layer', 0, clip.d, 1)
    }

    if (params.mode === 'grid layers') {
      displayFolder.add(volconfig, 'clim1', 0, 1)
      displayFolder.add(volconfig, 'clim2', 0, 1)
      displayFolder.add(params, 'surface', -0.2, 2.0)
    }

    if (params.mode === 'raymarching') {
      displayFolder.add(params, 'surface', -0.2, 2.0)
    }

    if (params.mode === 'volume') {
        displayFolder.add(volconfig, 'renderstyle', ['mip', 'iso'])
        displayFolder.add(volconfig, 'clim1', 0, 1)
        displayFolder.add(volconfig, 'clim2', 0, 1)
        displayFolder.add(params, 'surface', -0.2, 2.0)
        displayFolder.add(volconfig, 'renderthreshold', 0, 1)
    }
}

function updateSDF() {
    const matrix = new THREE.Matrix4()
    const center = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scaling = new THREE.Vector3()

    const r = params.resolution
    const { width, height, depth } = volumeTex.image

    const s = 1 / Math.max(clip.w, clip.h, clip.d)
    scaling.set(clip.w * s, clip.h * s, clip.d * s)
    matrix.compose(center, quat, scaling)
    inverseBoundsMatrix.copy(matrix).invert()

    // dispose of the existing sdf
    if (sdfTex) {
        sdfTex.dispose()
    }

    const pxWidth = 1 / (depth * r)
    const halfWidth = 0.5 * pxWidth

    const startTime = window.performance.now()
    if (params.gpuGeneration) {
        // create a new 3d render target texture
        sdfTex = new THREE.WebGL3DRenderTarget(width * r, height * r, depth * r)
        sdfTex.texture.format = THREE.RedFormat
        sdfTex.texture.type = THREE.FloatType
        sdfTex.texture.minFilter = THREE.LinearFilter
        sdfTex.texture.magFilter = THREE.LinearFilter

        // prep the sdf generation material pass
        generateSdfPass.material.uniforms.bvh.value.updateFrom(bvh)
        generateSdfPass.material.uniforms.matrix.value.copy(matrix)

        // render into each layer
        for (let i = 0; i < depth * r; i++) {
            generateSdfPass.material.uniforms.zValue.value = i * pxWidth + halfWidth

            renderer.setRenderTarget(sdfTex, i)
            generateSdfPass.render(renderer)
        }

        // initiate read back to get a rough estimate of time taken to generate the sdf
        renderer.readRenderTargetPixels(sdfTex, 0, 0, 1, 1, new Float32Array(4))
        renderer.setRenderTarget(null)

        // generateSdfPass.render(renderer);
        // layerPass.render(renderer);
        // raymarchPass.render(renderer);
        // volumePass.render(renderer);
    }

    // update the timing display
    const delta = window.performance.now() - startTime
    outputContainer.innerText = `${delta.toFixed(2)}ms`

    rebuildGUI()
}

function render() {

    stats.update();
    requestAnimationFrame( render );

    if ( ! sdfTex ) {

		// render nothing
		return;

    } else if ( params.mode === 'geometry' ) {

        // render the rasterized geometry
		renderer.render( scene, camera );

	} else if ( params.mode === 'layer' || params.mode === 'grid layers' ) {
        
        // render a layer of the 3d texture
		let tex;
		const material = layerPass.material;
        const texture = cmtextures[ volconfig.colormap ]

        if (volumeTex) material.uniforms.voldata.value = volumeTex
        if (texture) material.uniforms.cmdata.value = texture

		material.uniforms.clim.value.set( volconfig.clim1, volconfig.clim2 );
        material.uniforms.surface.value = params.surface;
        material.uniforms.layer.value = params.layer / volumeTex.image.depth;
        material.uniforms.layers.value = volumeTex.image.depth;
		material.uniforms.sdfTex.value = sdfTex.texture;
		tex = sdfTex.texture;

        const gridMode = params.mode === 'layer' ? 0 : 1;
		if ( gridMode !== material.defines.DISPLAY_GRID ) {

			material.defines.DISPLAY_GRID = gridMode;
			material.needsUpdate = true;

		}

        layerPass.render( renderer );

    } else if ( params.mode === 'raymarching' ) {

        // render the ray marched texture
        camera.updateMatrixWorld();
		mesh.updateMatrixWorld();

        let tex;
        tex = sdfTex.texture;

        const { width, depth, height } = tex.image;
        raymarchPass.material.uniforms.sdfTex.value = tex;
		raymarchPass.material.uniforms.normalStep.value.set( 1 / width, 1 / height, 1 / depth );
		raymarchPass.material.uniforms.surface.value = params.surface;
		raymarchPass.material.uniforms.projectionInverse.value.copy( camera.projectionMatrixInverse );
		raymarchPass.material.uniforms.sdfTransformInverse.value.copy( mesh.matrixWorld ).invert().premultiply( inverseBoundsMatrix ).multiply( camera.matrixWorld );
		raymarchPass.render( renderer );
    } else if ( params.mode === 'volume' ) {
        // render the ray marched texture
        camera.updateMatrixWorld();
        mesh.updateMatrixWorld();

        const texture = cmtextures[ volconfig.colormap ]
        if (texture) volumePass.material.uniforms.cmdata.value = texture

        volumePass.material.uniforms.sdfTex.value = sdfTex.texture;
        volumePass.material.uniforms.surface.value = params.surface;
        volumePass.material.uniforms.clim.value.set( volconfig.clim1, volconfig.clim2 );
        volumePass.material.uniforms.renderstyle.value = volconfig.renderstyle == 'mip' ? 0 : 1; // 0: MIP, 1: ISO
        volumePass.material.uniforms.renderthreshold.value = volconfig.renderthreshold; // For ISO renderstyle
        volumePass.material.uniforms.projectionInverse.value.copy( camera.projectionMatrixInverse );
		volumePass.material.uniforms.sdfTransformInverse.value.copy( mesh.matrixWorld ).invert().premultiply( inverseBoundsMatrix ).multiply( camera.matrixWorld );
		volumePass.render( renderer );
    }
}
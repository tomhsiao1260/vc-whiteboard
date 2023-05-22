import Stats from 'stats.js'
import * as THREE from 'three'
import textureGray from './textures/cm_gray.png'
import textureViridis from './textures/cm_viridis.png'

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshBVH, StaticGeometryGenerator } from 'three-mesh-bvh'

import { GenerateSDFMaterial } from './GenerateSDFMaterial.js'
import { RenderSDFLayerMaterial } from './RenderSDFLayerMaterial.js'
import { RayMarchSDFMaterial } from './RayMarchSDFMaterial.js'
import { VolumeMaterial } from './VolumeMaterial.js'

const params = {
    gpuGeneration: true,
    resolution: 75,
    margin: 0.2,
    regenerate: () => updateSDF(),

    mode: 'volume',
    layer: 0,
    surface: 0.018
}

const volconfig = {
    clim1: 0,
    clim2: 1,
    renderstyle: 'mip',
    // renderstyle: 'iso',
    renderthreshold: 0.15,
    colormap: 'viridis',
    label: 0.7
};

let renderer, camera, scene, gui, stats, boxHelper
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
    camera.position.set(1, 1, 2)
    camera.far = 5
    camera.updateProjectionMatrix()

    boxHelper = new THREE.Box3Helper(new THREE.Box3())
    scene.add(boxHelper)

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

    new OBJLoader()
        .loadAsync('model.obj')
        .then((object) => {
            const staticGen = new StaticGeometryGenerator(object)

            staticGen.attributes = ['position', 'normal']
            staticGen.useGroups = false

            geometry = staticGen.generate().center()

            return new MeshBVH(geometry, { maxLeafTris: 1 })
        })
        .then((result) => {
            bvh = result
      
            mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial())
            scene.add(mesh)

            updateSDF()
        })

    new NRRDLoader()
        .loadAsync('data.nrrd')
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
            material.uniforms.data.value = volumeTex;
            material.uniforms.size.value.set( volume.xLength, volume.yLength, volume.zLength );
        })

    rebuildGUI()

    window.addEventListener(
        'resize',
        function () {
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
        },
        false
    )
}

// build the gui with parameters based on the selected display mode
function rebuildGUI() {
    if (gui) {
        gui.destroy()
    }

    params.layer = Math.min(params.resolution, params.layer)

    gui = new GUI()

    const generationFolder = gui.addFolder('generation')
    generationFolder.add(params, 'gpuGeneration')
    generationFolder.add(params, 'resolution', 10, 200, 1)
    generationFolder.add(params, 'margin', 0, 1)
    generationFolder.add(params, 'regenerate')

    const displayFolder = gui.addFolder('display')
    displayFolder
      .add(params, 'mode', ['geometry', 'raymarching', 'layer', 'grid layers', 'volume'])
      .onChange(() => {
        rebuildGUI()
      })

    if (params.mode === 'layer') {
      displayFolder.add(params, 'layer', 0, params.resolution, 1)
    }

    if (params.mode === 'raymarching') {
      displayFolder.add(params, 'surface', -0.2, 0.5)
    }

    if (params.mode === 'volume') {
        displayFolder.add(volconfig, 'renderstyle', ['mip', 'iso'])
        displayFolder.add(volconfig, 'clim1', 0, 1)
        displayFolder.add(volconfig, 'clim2', 0, 1)
        displayFolder.add(volconfig, 'renderthreshold', 0, 1)
    }
}

function updateSDF() {
    const dim = params.resolution
    const matrix = new THREE.Matrix4()
    const center = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    // compute the bounding box of the geometry including the margin which is used to
    // define the range of the SDF
    geometry.boundingBox.getCenter(center)
    scale.subVectors(geometry.boundingBox.max, geometry.boundingBox.min)
    scale.x += 2 * params.margin
    scale.y += 2 * params.margin
    scale.z += 2 * params.margin
    matrix.compose(center, quat, scale)
    inverseBoundsMatrix.copy(matrix).invert()

    // update the box helper
    boxHelper.box.copy(geometry.boundingBox)
    boxHelper.box.min.x -= params.margin
    boxHelper.box.min.y -= params.margin
    boxHelper.box.min.z -= params.margin
    boxHelper.box.max.x += params.margin
    boxHelper.box.max.y += params.margin
    boxHelper.box.max.z += params.margin

    // dispose of the existing sdf
    if (sdfTex) {
        sdfTex.dispose()
    }

    const pxWidth = 1 / dim
    const halfWidth = 0.5 * pxWidth

    const startTime = window.performance.now()
    if (params.gpuGeneration) {
        // create a new 3d render target texture
        sdfTex = new THREE.WebGL3DRenderTarget(dim, dim, dim)
        sdfTex.texture.format = THREE.RedFormat
        sdfTex.texture.type = THREE.FloatType
        sdfTex.texture.minFilter = THREE.LinearFilter
        sdfTex.texture.magFilter = THREE.LinearFilter

        // prep the sdf generation material pass
        generateSdfPass.material.uniforms.bvh.value.updateFrom(bvh)
        generateSdfPass.material.uniforms.matrix.value.copy(matrix)

        // render into each layer
        for (let i = 0; i < dim; i++) {
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

		material.uniforms.layer.value = params.layer / sdfTex.width;
        material.uniforms.layers.value = sdfTex.texture.image.width;
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

        volumePass.material.uniforms.clim.value.set( volconfig.clim1, volconfig.clim2 );
        volumePass.material.uniforms.renderstyle.value = volconfig.renderstyle == 'mip' ? 0 : 1; // 0: MIP, 1: ISO
        volumePass.material.uniforms.renderthreshold.value = volconfig.isothreshold; // For ISO renderstyle
        volumePass.material.uniforms.projectionInverse.value.copy( camera.projectionMatrixInverse );
		volumePass.material.uniforms.sdfTransformInverse.value.copy( mesh.matrixWorld ).invert().premultiply( inverseBoundsMatrix ).multiply( camera.matrixWorld );
		volumePass.render( renderer );
    }
}
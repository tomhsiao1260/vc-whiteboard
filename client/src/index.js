import Stats from 'stats.js'
import * as THREE from 'three'

import textureGray from './textures/cm_gray.png'
import textureViridis from './textures/cm_viridis.png'

import { MeshBVH } from 'three-mesh-bvh'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { GenerateSDFMaterial } from './GenerateSDFMaterial.js'
import { RenderSDFLayerMaterial } from './RenderSDFLayerMaterial.js'
import { RayMarchSDFMaterial } from './RayMarchSDFMaterial.js'
import { VolumeMaterial } from './VolumeMaterial.js'

const params = {
    gpuGeneration: true,
    resolution: 1.0,
    regenerate: () => { updateSDF(); rebuildGUI(); },

    mode: 'layer',
    layer: 0,
    surface: 0.005,
    inverse: false,
    layers: { select: 0, options: {} },
}

const volconfig = {
    clim1: 0.385,
    clim2: 0.715,
    renderstyle: 'mip',
    renderthreshold: 0.15,
    colormap: 'viridis',
    label: 0.7
};

let segmentMeta, volumeMeta, volumeTarget, nrrd, clip
let renderer, camera, scene, gui, stats
let outputContainer, bvh, geometry, mesh, boxHelper, sdfTex, volumeTex
let generateSdfPass, layerPass, raymarchPass, volumePass
const inverseBoundsMatrix = new THREE.Matrix4()

const cmtextures = {
    viridis: new THREE.TextureLoader().load( textureViridis ),
    gray: new THREE.TextureLoader().load( textureGray )
};

init()
// render()

async function init() {
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
    camera.position.set(0.4, -0.4, -1.0)
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

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.addEventListener( 'change', render );

    // stats setup
    stats = new Stats()
    // document.body.appendChild(stats.dom)

    boxHelper = new THREE.Box3Helper(new THREE.Box3())
    scene.add(boxHelper)

    // sdf pass to generate the 3d texture
    generateSdfPass = new FullScreenQuad(new GenerateSDFMaterial())
    // screen pass to render a single layer of the 3d texture
    layerPass = new FullScreenQuad(new RenderSDFLayerMaterial())
    // screen pass to render the sdf ray marching
    raymarchPass = new FullScreenQuad(new RayMarchSDFMaterial())
    // volume pass to render the volume data
    volumePass = new FullScreenQuad(new VolumeMaterial())

    segmentMeta = await fetch('segment/meta.json').then((res) => res.json())
    volumeMeta = await fetch('volume/meta.json').then((res) => res.json())

    for (let i = 0; i < volumeMeta.nrrd.length; i++) {
        const { clip } = volumeMeta.nrrd[i]
        const start = clip.z
        const end = clip.z + clip.d
        params.layers.options[ `${start} to ${end}` ] = i
    }

    await loadModel(params.layers.select)

    updateSDF()
    rebuildGUI()
    render()
}

async function loadModel(selectIndex) {
    // dispose previous assets
    if (sdfTex) { sdfTex.dispose() }
    if (volumeTex) { volumeTex.dispose() }
    if (mesh) {
        mesh.geometry.dispose()
        mesh.material.dispose()
        group.remove(mesh)
    }

    volumeTarget = volumeMeta.nrrd[selectIndex]
    clip = volumeTarget.clip
    nrrd = volumeTarget.shape

    // select necessary segment to list
    const segmentList = []

    for (let i = 0; i < segmentMeta.obj.length; i++) {
        const segmentTarget = segmentMeta.obj[i]
        const c0 = volumeTarget.clip
        const c1 = segmentTarget.clip

        if (c0.x + c0.w >= c1.x && c1.x + c1.w >= c0.x) {
            if (c0.y + c0.h >= c1.y && c1.y + c1.h >= c0.y) {
                if (c0.z + c0.d >= c1.z && c1.z + c1.d >= c0.z) {
                    segmentList.push(segmentTarget.id)
                }
            }
        }
    }

    // segment loading
    const promiseList = []
    const geometryList = []

    for (let i = 0; i < segmentList.length; i++) {
        const loading = new OBJLoader()
            .loadAsync('segment/' + segmentList[i] + '.obj')
            .then((object) => { geometryList.push(object.children[0].geometry) })

        promiseList.push(loading)
    }
    // console.log(segmentList)


    // turn all segment into single geometry
    const papyrus = Promise.all(promiseList)
        .then((object) => {

            const s = 1 / Math.max(nrrd.w, nrrd.h, nrrd.d)

            if (!segmentMeta['view_segment']) {
                geometry = BufferGeometryUtils.mergeGeometries([ new THREE.BoxGeometry(0.01, 0.01, 0.01) ])
            }
            // no segment here, show nothing
            if (segmentMeta['view_segment'] && !geometryList.length) {
                geometry = BufferGeometryUtils.mergeGeometries([ new THREE.BoxGeometry(0.01, 0.01, 0.01) ])
                const positions = geometry.attributes.position.array
                for (let i = 0; i < positions.length; i += 3) { positions[i + 2] += 10 }
            }
            // put segment points to the right position
            if (segmentMeta['view_segment'] && geometryList.length) {
                geometry = BufferGeometryUtils.mergeGeometries(geometryList)
                const positions = geometry.attributes.position.array

                for (let i = 0; i < positions.length; i += 3) {
                    const x = positions[i + 0];
                    const y = positions[i + 1];
                    const z = positions[i + 2];

                    const newX = nrrd.w * s * ((x - clip.x) / clip.w - 0.5)
                    const newY = nrrd.h * s * ((y - clip.y) / clip.h - 0.5)
                    const newZ = nrrd.d * s * ((z - clip.z) / clip.d - 0.5)

                    positions[i + 0] = newX;
                    positions[i + 1] = newY;
                    positions[i + 2] = newZ;
                }
            }

            for (let i = 0; i < geometryList.length; i ++) { geometryList[i].dispose() }
            geometry.attributes.position.needsUpdate = true

            geometry.computeBoundingBox()
            geometry.boundingBox.max.set( nrrd.w * s / 2,  nrrd.h * s / 2,  nrrd.d * s / 2)
            geometry.boundingBox.min.set(-nrrd.w * s / 2, -nrrd.h * s / 2, -nrrd.d * s / 2)
            boxHelper.box.copy(geometry.boundingBox)

            const maxDistance = geometry.boundingBox.min.distanceTo(geometry.boundingBox.max) / 2
            params.surface = maxDistance

            return new MeshBVH(geometry, { maxLeafTris: 1 })
        })
        .then((result) => {
            bvh = result

            mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }))
            scene.add(mesh)
        })

    const voxel = new NRRDLoader()
        .loadAsync('volume/' + volumeTarget.id + '.nrrd')
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

    return Promise.all([papyrus, voxel])
}

// build the gui with parameters based on the selected display mode
function rebuildGUI() {
    if (gui) { gui.destroy() }

    params.layer = Math.max(clip.z, params.layer)
    params.layer = Math.min(clip.z + clip.d, params.layer)
    const maxDistance = geometry.boundingBox.min.distanceTo(geometry.boundingBox.max) / 2

    gui = new GUI()

    // const generationFolder = gui.addFolder('generation')
    // generationFolder.add(params, 'gpuGeneration')
    // generationFolder.add(params, 'resolution', 0.1, 1, 0.01)
    // generationFolder.add(params, 'regenerate')

    const displayFolder = gui.addFolder('display')
    displayFolder
      .add(params, 'mode', ['geometry', 'layer', 'grid layers', 'volume'])
      // .add(params, 'mode', ['geometry', 'raymarching', 'layer', 'grid layers', 'volume'])
      .onChange(() => {
        rebuildGUI()
        render()
      })

    if (params.mode === 'geometry') {
        displayFolder.add(params.layers, 'select', params.layers.options).name('layers').onChange(async () => {
            await loadModel(params.layers.select)
            updateSDF()
            rebuildGUI()
            render()
        })
    }

    if (params.mode === 'layer') {
        // displayFolder.add(volconfig, 'clim1', 0, 1)
        // displayFolder.add(volconfig, 'clim2', 0, 1)
        displayFolder.add(params, 'inverse').onChange(render)
        displayFolder.add(params, 'surface', 0.001, maxDistance).onChange(render)
        displayFolder.add(params, 'layer', clip.z, clip.z + clip.d, 1).onChange(render)
        displayFolder.add(params.layers, 'select', params.layers.options).name('layers').onChange(async () => {
            await loadModel(params.layers.select)
            updateSDF()
            rebuildGUI()
            render()
        })
    }

    if (params.mode === 'grid layers') {
        // displayFolder.add(volconfig, 'clim1', 0, 1).onChange(render)
        // displayFolder.add(volconfig, 'clim2', 0, 1).onChange(render)
        displayFolder.add(params, 'inverse').onChange(render)
        displayFolder.add(params, 'surface', 0.001, maxDistance).onChange(render)
        displayFolder.add(params.layers, 'select', params.layers.options).name('layers').onChange(async () => {
            await loadModel(params.layers.select)
            updateSDF()
            rebuildGUI()
            render()
        })
    }

    if (params.mode === 'raymarching') {
        displayFolder.add(params, 'surface', 0.001, maxDistance).onChange(render)
        displayFolder.add(params.layers, 'select', params.layers.options).name('layers').onChange(async () => {
            await loadModel(params.layers.select)
            updateSDF()
            rebuildGUI()
            render()
        })
    }

    if (params.mode === 'volume') {
        displayFolder.add(volconfig, 'renderstyle', ['mip', 'iso']).onChange(render)
        displayFolder.add(volconfig, 'clim1', 0, 1).onChange(render)
        displayFolder.add(volconfig, 'clim2', 0, 1).onChange(render)
        displayFolder.add(params, 'surface', 0.001, maxDistance).onChange(render)
        // displayFolder.add(volconfig, 'renderthreshold', 0, 1).onChange(render)
    }
}

function updateSDF() {
    const matrix = new THREE.Matrix4()
    const center = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scaling = new THREE.Vector3()

    const r = params.resolution
    const s = 1 / Math.max(nrrd.w, nrrd.h, nrrd.d)

    scaling.set(nrrd.w * s, nrrd.h * s, nrrd.d * s)
    matrix.compose(center, quat, scaling)
    inverseBoundsMatrix.copy(matrix).invert()

    const pxWidth = 1 / (nrrd.d * r)
    const halfWidth = 0.5 * pxWidth

    const startTime = window.performance.now()
    if (params.gpuGeneration) {
        // create a new 3d render target texture
        sdfTex = new THREE.WebGL3DRenderTarget(nrrd.w * r, nrrd.h * r, nrrd.d * r)
        sdfTex.texture.format = THREE.RedFormat
        sdfTex.texture.type = THREE.FloatType
        sdfTex.texture.minFilter = THREE.LinearFilter
        sdfTex.texture.magFilter = THREE.LinearFilter

        // prep the sdf generation material pass
        generateSdfPass.material.uniforms.bvh.value.updateFrom(bvh)
        generateSdfPass.material.uniforms.matrix.value.copy(matrix)

        // render into each layer
        for (let i = 0; i < nrrd.d * r; i++) {
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
    // outputContainer.innerText = `${delta.toFixed(2)}ms`
}

function render() {

    stats.update();
    // requestAnimationFrame( render );

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
        material.uniforms.inverse.value = params.inverse;
        material.uniforms.surface.value = params.surface;
        material.uniforms.layer.value = (params.layer - clip.z) / clip.d;
        material.uniforms.volumeAspect.value = clip.w / clip.h;
        material.uniforms.screenAspect.value = camera.aspect;
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

        const { width, depth, height } = sdfTex.texture.image;
        raymarchPass.material.uniforms.sdfTex.value = sdfTex.texture;
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
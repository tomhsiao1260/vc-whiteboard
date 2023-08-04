import Loader from './Loader'
import ViewerCore from './core/ViewerCore'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

init()

async function init() {
  const volumeMeta = await Loader.getVolumeMeta()
  const segmentMeta = await Loader.getSegmentMeta()

  const viewer = new ViewerCore({ volumeMeta, segmentMeta })

  update(viewer)
}

function update(viewer) {
  updateViewer(viewer)
  updateGUI(viewer)
}

function updateViewer(viewer) {
  const { mode } = viewer.params

  if (mode === 'segment') { modeA(viewer) }
  if (mode === 'volume') { modeB(viewer) }
  if (mode === 'volume-segment') { modeC(viewer) }
  if (mode === 'layer') { modeC(viewer) }
  if (mode === 'grid layer') { modeC(viewer) }
}

let gui

function updateGUI(viewer) {
  const { mode } = viewer.params

  if (gui) { gui.destroy() }
  gui = new GUI()
  gui.add(viewer.params, 'mode', ['segment', 'volume', 'volume-segment', 'layer', 'grid layer']).onChange(() => update(viewer))
  gui.add(viewer.params.layers, 'select', viewer.params.layers.options).name('layers').onChange(() => update(viewer))

  if (mode === 'segment') { return }
  if (mode === 'volume') { return }
  if (mode === 'volume-segment') {
    gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(viewer.render)
  }
  if (mode === 'layer') {
    const id = viewer.params.layers.select
    const clip = viewer.volumeMeta.nrrd[id].clip

    gui.add(viewer.params, 'inverse').onChange(viewer.render)
    gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(viewer.render)
    gui.add(viewer.params, 'layer', clip.z, clip.z + clip.d, 1).onChange(viewer.render)
  }
  if (mode === 'grid layer') {
    gui.add(viewer.params, 'inverse').onChange(viewer.render)
    gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(viewer.render)
  }
}

// segment mode
function modeA(viewer) {
  viewer.clear()
  const segment = viewer.updateSegment()

  segment.then(() => viewer.render())
    .then(() => { console.log(`segment ${viewer.params.layers.select} is loaded`) })
}

// volume mode
function modeB(viewer) {
  viewer.clear()
  const volume = viewer.updateVolume()

  volume.then(() => viewer.render())
    .then(() => { console.log(`volume ${viewer.params.layers.select} is loaded`) })
}

// volume-segment mode
function modeC(viewer) {
  viewer.clear()
  const volume = viewer.updateVolume()
  const segment = viewer.updateSegment()

  Promise.all([volume, segment])
    .then(() => viewer.clipSegment())
    .then(() => viewer.updateSegmentSDF())
    .then(() => viewer.render())
    .then(() => { console.log(`volume-segment ${viewer.params.layers.select} is loaded`) })
}


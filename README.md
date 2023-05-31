<h1 align="center">Volume Viewer</h1>

<h3 align="center">
A web-based volumetric renderer for <a href="https://scrollprize.org/" target="_blank">Vesuvius Challenge</a>
<h3/>

<p align="center">
    <img src="https://github.com/tomhsiao1260/segment-viewer/assets/31985811/7196a132-ae03-4e4d-8eaf-95ad24af7dc9" width="800px"/>
</p>

## Introduction

This is a web-based volumetric renderer which you can visualize the scroll data from Vesuvius Challenge on the top of [Three.js library](https://threejs.org/).

## Install

Clone this repository
```bash
git clone https://github.com/tomhsiao1260/volume-viewer.git
cd volume-viewer
```

Setup a virtual environment and activate it
```bash
python -m venv env
source env/bin/activate
```

Install the reqired python packages
```bash
pip install -r requirements.txt
```

Download [Node.js](https://nodejs.org/en/download/) and install the required npm packages
```bash
cd client && npm install
```

## Getting Started

Now, we need to give this repo the data you want to see. There's a file called `volume.py` for converting the `.tif` data into `.nrrd` format which can be used for rendering via this application. In this file, enter your `volpkg` directory, `volume` id info.

```python
VOLPKG_DIR = './example.volpkg'
VOLUME_ID  = '20230205180739'
```

Choose a clipped part that you want to visualize. The `CLIP` define a bounding box which `x`, `y`, `z` refer to the smallest point coordinate and `w`, `h`, `d` refer to clipped width, height and depth in raw CT scan volume data.

```python
CLIP = { 'x': 0, 'y': 0, 'z': 0, 'w': 8096, 'h': 7888, 'd': 1000 }

RAW_TO_TIF_SAMPLING    = 10    # volume: 1, volume_small: 10
TIF_TO_VOLUME_SAMPLING = 1     # n means compress to n^3 smaller
CLIP_CHUNK_NUM         = 20    # divided into n chunks along z-axis
```

There's another file called `segment.py` which can handle segment `.obj` files we need. Don't forget to update `VOLPKG_DIR` in it as well. Then, run the python scripts. It may take a while. Once finished, you will find some `.obj` and `nrrd` files generated in `./output/segment` and `./output/volume` folder, respectively.

```python
python segment.py
python volume.py
```

Now, eveything is set. Let's serve this web application and navigate to http://localhost:5173/. It may take a few seconds to load assets, but hopefully you can see the results. Have fun!

```bash
cd client && npm run dev
```

## Notes
    
Here's also some git branches called [demo-1](https://github.com/tomhsiao1260/volume-viewer/tree/demo-1), [demo-2](https://github.com/tomhsiao1260/volume-viewer/tree/demo-2) for different visualization purpose.

If you want to know more, the rendering part is modified from [this example](https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/sdfGeneration.js) from [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) and [this example](https://github.com/mrdoob/three.js/blob/master/examples/webgl2_materials_texture3d.html) from Three.js community. For me, Vesuvius Challenge is cool and I'll keep trying to make better tools for it, especially on the web. If you have any thoughts or issues, feel free to reach out me on [twitter](https://twitter.com/yaohsiao123) or send an issue here. I'm here to help!

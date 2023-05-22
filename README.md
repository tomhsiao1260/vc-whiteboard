<h1 align="center">Volume Viewer</h1>

<h3 align="center">
A web-based volumetric renderer for <a href="https://scrollprize.org/" target="_blank">Vesuvius Challenge</a>
<h3/>

<p align="center">
    <img src="https://github.com/tomhsiao1260/volume-viewer/assets/31985811/3e2572fd-8640-435a-bf13-7a48eb45973f" width="800px"/>
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

Now, we need to give this repo the data you want to see. There's a file called `convert.py` for converting the `.tif` data into `.nrrd` format which can be used for rendering via this application. In `convert.py`, enter your `volpkg` directory, `volume` and `segment` id info.

```python
VOLUME_ID      = '20230205180739'
SEGMENT_ID     = '20230503225234'
    
TIF_DIR        = f'./example.volpkg/ ...'
OBJ_DIR        = f'./example.volpkg/ ...'
```

Choose a clipped part that you want to visualize. `x`, `y` refer to the top left coordinates of the `.tif` file. `w`, `h` refer to clipped width and height. `z` is starting layer and `d` is layers number you want to see.

```python
clip = { 'x': 250, 'y': 250, 'z': 0, 'w': 160, 'h': 147, 'd': 65 }
```

Then, run the python script. It may take a while. Once finished, you will find a `data.nrrd` and a `data.obj` generated in `./output/` folder.

```python
python convert.py
```

Now, eveything is set. Let's serve this web application and navigate to http://localhost:5173/. It may take a few seconds to load assets, but hopefully you can see the results. Have fun!

```bash
cd client && npm run dev
```

## Notes
    
Here's also a [git branch](https://github.com/tomhsiao1260/volume-viewer/tree/demo-1) for different visualization purpose.

If you want to know more, the rendering part is modified from [this example](https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/sdfGeneration.js) from [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) and [this example](https://github.com/mrdoob/three.js/blob/master/examples/webgl2_materials_texture3d.html) from Three.js community. For me, Vesuvius Challenge is cool and I'll keep trying to make better tools for it, especially on the web. If you have any thoughts or issues, feel free to reach out me on [twitter](https://twitter.com/yaohsiao123) or send an issue here. I'm here to help!

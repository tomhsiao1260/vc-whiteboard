<h1 align="center">Volume Viewer</h1>

<h3 align="center">
A web-based volumetric renderer for <a href="https://scrollprize.org/" target="_blank">Vesuvius Challenge</a>
<h3/>

<p align="center">
    <img src="https://user-images.githubusercontent.com/31985811/236626955-a3300d98-212d-444f-99ec-3725164c0ac9.gif" width="800px"/>
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

## Getting Started

Now, we need to give this repo the data you want to see. There's a file called `convert.py` for converting the `.tif` data into `.nrrd` format which can be used for rendering via this application. Let's create a folder called `res` in root directory. Put `inklabels.png` and a folder called `surface_volume` in it. The latter one contains all the `.tif` data. 

```python
LABEL_DIR = './res/inklabels.png'
TIF_DIR   = './res/surface_volume/*.tif'
```

In `convert.py`, choose a rectangular part in `inklabels.png` that you want to visualize. The origin starts at the top left. The `x`, `y` refer to the top left coordinates of the selection rectangle. The `w`, `h` refer to its width and height.

```python
rect = { 'x': 1100, 'y': 3500, 'w': 700, 'h': 950 }
```

Then, run the bash file in root directory. It may take a while. Once finished, you will find a `data.nrrd` and a cropped `inklabels.png` image generated in `./res/output/` folder.

```bash
bash convert.sh
```

Now, eveything is set. Let's serve this web application and navigate to http://localhost:8000. It may take a few seconds to load assets, but hopefully you can see the results. Have fun :p

```bash
cd client
python -m http.server
```

## Notes

If you want to know more, the rendering part is modified from [this example](https://github.com/mrdoob/three.js/blob/master/examples/webgl2_materials_texture3d.html) from Three.js community. For me, Vesuvius Challenge is cool and I'll keep trying to make better tools for it, especially on the web. If you have any thoughts or issues, feel free to reach out me on [twitter](https://twitter.com/yaohsiao123) or send an issue here. I'm here to help!

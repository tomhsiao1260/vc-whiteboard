import os
import json
import math
import glob
import nrrd
import shutil
import numpy as np
from PIL import Image
from tqdm import tqdm

CLIP = { 'x': 0, 'y': 0, 'z': 0, 'w': 8096, 'h': 7888, 'd': 1000 }

RAW_TO_TIF_SAMPLING    = 10
TIF_TO_VOLUME_SAMPLING = 1
CLIP_CHUNK_NUM         = 20

VOLPKG_DIR  = '../full-scrolls/Scroll1.volpkg'
VOLUME_ID   = '20230205180739'

# you may don't need to change the path below
TIF_INPUT   = f'{VOLPKG_DIR}/volumes_small/{VOLUME_ID}'
NRRD_OUTPUT = './output/volume'
NRRD_INFO   = './output/volume/meta.json'

def nrrd_list(CLIP, CLIP_CHUNK_NUM):
    NRRD_LIST = []
    DIGIT_NUM = len(str(CLIP_CHUNK_NUM))

    for i in range(CLIP_CHUNK_NUM):
        SUB_CLIP = CLIP.copy()
        SUB_CLIP['z'] = CLIP['z'] + (CLIP['d'] // CLIP_CHUNK_NUM) * i
        SUB_CLIP['d'] = CLIP['d'] // CLIP_CHUNK_NUM

        if (i == CLIP_CHUNK_NUM - 1):
            SUB_CLIP['d'] = CLIP['z'] + CLIP['d'] - SUB_CLIP['z']

        info = {}
        info['id'] = str(i).zfill(DIGIT_NUM)
        info['clip'] = SUB_CLIP

        NRRD_LIST.append(info)

    return NRRD_LIST

def read_tif(TIF_INPUT, CLIP):
    # change to tif data clip
    rs = RAW_TO_TIF_SAMPLING
    c  = { key: round(value / rs) for key, value in CLIP.items() }

    names = sorted(glob.glob(TIF_INPUT + '/*tif'))
    names = names[c['z'] : c['z'] + c['d']]
    image_stack = np.zeros((c['w'], c['h'], c['d']), dtype=np.float32)

    for i, filename in enumerate(tqdm(names)):
        image = np.array(Image.open(filename), dtype=np.float32)[c['y']:(c['y']+c['h']), c['x']:(c['x']+c['w'])]
        image /= 65535.0
        image_stack[:, :, i] = np.transpose(image, (1, 0))

    # sampling tif stack
    ts = TIF_TO_VOLUME_SAMPLING

    pad_x = (ts - image_stack.shape[0] % ts) % ts
    pad_y = (ts - image_stack.shape[1] % ts) % ts
    pad_z = (ts - image_stack.shape[2] % ts) % ts

    image_stack = np.pad(image_stack, ((0, pad_x), (0, pad_y), (0, pad_z)), mode='edge')

    image_stack = image_stack.reshape((math.ceil(c['w'] / ts), ts, math.ceil(c['h'] / ts), ts, math.ceil(c['d'] / ts), ts))
    image_stack = image_stack.mean(axis=(1, 3, 5))

    return image_stack

def read_nrrd(NRRD_DIR):
    data, header = nrrd.read(NRRD_DIR)

def write_nrrd(NRRD_DIR, data):
    # header = {'spacings': [1.0, 1.0, 1.0]}
    # nrrd.write(NRRD_DIR, data, header)
    nrrd.write(NRRD_DIR, data)

# clear .nrrd output folder
shutil.rmtree(NRRD_OUTPUT, ignore_errors=True)
os.makedirs(NRRD_OUTPUT)

# generate nrrd list
NRRD_LIST = nrrd_list(CLIP, CLIP_CHUNK_NUM)

# generate .nrrd files from .tif files
for NRRD_CHUNK in NRRD_LIST:
    NRRD_ID = NRRD_CHUNK['id']
    NRRD_SUBCLIP = NRRD_CHUNK['clip']

    # extract image stack from .tif files
    image_stack = read_tif(TIF_INPUT, NRRD_SUBCLIP)

    NRRD_CHUNK['shape'] = {}
    NRRD_CHUNK['shape']['w'] = image_stack.shape[0]
    NRRD_CHUNK['shape']['h'] = image_stack.shape[1]
    NRRD_CHUNK['shape']['d'] = image_stack.shape[2]

    # generate .nrrd file from image stack
    write_nrrd(f'{NRRD_OUTPUT}/{NRRD_ID}.nrrd', image_stack)

# save relevant info and copy to client
meta = {}
meta['nrrd'] = NRRD_LIST

with open(NRRD_INFO, "w") as outfile:
    json.dump(meta, outfile, indent=4)

shutil.copytree(NRRD_OUTPUT, 'client/public/volume', dirs_exist_ok=True)

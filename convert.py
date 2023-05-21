import os
import shutil
import glob
import nrrd
import numpy as np
from PIL import Image
from tqdm import tqdm

clip = { 'x': 1100, 'y': 3500, 'w': 700, 'h': 950 }
# clip = { 'x': 1100, 'y': 3500, 'z': 10, 'w': 700, 'h': 950, 'd': 30 }

LABEL_DIR      = './res/inklabels.png'
TIF_DIR        = './res/surface_volume/*.tif'

CROP_LABEL_DIR = './res/output/' + 'inklabels.png'
NPZ_DIR        = './res/output/' + 'data.npz'
NRRD_DIR       = './res/output/' + 'data.nrrd'


if not os.path.exists('res'):
    os.makedirs('res')
if not os.path.exists('res/output'):
    os.makedirs('res/output')

def image_crop(LABEL_DIR, CROP_LABEL_DIR, clip):
    image = Image.open(LABEL_DIR)

    cropped = image.crop((clip['x'], clip['y'], clip['x']+clip['w'], clip['y']+clip['h']))
    cropped.save(CROP_LABEL_DIR)

def read_npz(NPZ_DIR, key):
    data = np.load(NPZ_DIR)
    array = np.array(data[key])

    return array

def write_npz(NPZ_DIR, TIF_DIR, clip):
    names = sorted(glob.glob(TIF_DIR))

    if 'z' in clip:
        start = clip['z']
        if 'd' in clip:
            end = start + clip['d']
            names = names[start:end]
        else:
            names = names[start:]

    image_stack = np.zeros((len(names), clip['h'], clip['w']), dtype=np.float32)

    for i, filename in enumerate(tqdm(names)):
        image = np.array(Image.open(filename), dtype=np.float32)[clip['y']:(clip['y']+clip['h']), clip['x']:(clip['x']+clip['w'])]
        image /= 65535.0
        image_stack[i] = image

    np.savez(NPZ_DIR, image_stack=image_stack)

def read_nrrd(NRRD_DIR):
    data, header = nrrd.read(NRRD_DIR)

def write_nrrd(NRRD_DIR, data):
    # header = {'spacings': [1.0, 1.0, 1.0]}
    # nrrd.write(NRRD_DIR, data, header)
    nrrd.write(NRRD_DIR, data)


# generate cropped inklabel image
image_crop(LABEL_DIR, CROP_LABEL_DIR, clip)
# generate .npz file from .tif files
write_npz(NPZ_DIR, TIF_DIR, clip)
# generate .nrrd file from .npz file
write_nrrd(NRRD_DIR, read_npz(NPZ_DIR, 'image_stack'))

# Copy the generated files to the client folder
shutil.copy(NRRD_DIR , 'client/models')
shutil.copy(CROP_LABEL_DIR , 'client/textures')

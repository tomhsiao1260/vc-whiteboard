import glob
import nrrd
import numpy as np
from PIL import Image
from tqdm import tqdm

rect = { 'x': 1100, 'y': 3500, 'w': 700, 'h': 950 }

LABEL_DIR      = './res/inklabels.png'
TIF_DIR        = './res/surface_volume/*.tif'

CROP_LABEL_DIR = './res/output/' + 'inklabels.png'
NPZ_DIR        = './res/output/' + 'data.npz'
NRRD_DIR       = './res/output/' + 'data.nrrd'


def image_crop(LABEL_DIR, CROP_LABEL_DIR, rect):
    image = Image.open(LABEL_DIR)

    cropped = image.crop((rect['x'], rect['y'], rect['x']+rect['w'], rect['y']+rect['h']))
    cropped.save(CROP_LABEL_DIR)

def read_npz(NPZ_DIR, key):
    data = np.load(NPZ_DIR)
    array = np.array(data[key])

    return array

def write_npz(NPZ_DIR, TIF_DIR, rect):
    names = sorted(glob.glob(TIF_DIR))
    image_stack = np.zeros((len(names), rect['h'], rect['w']), dtype=np.float32)

    for i, filename in enumerate(tqdm(names)):
        image = np.array(Image.open(filename), dtype=np.float32)[rect['y']:(rect['y']+rect['h']), rect['x']:(rect['x']+rect['w'])]
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
image_crop(LABEL_DIR, CROP_LABEL_DIR, rect)
# generate .npz file from .tif files
write_npz(NPZ_DIR, TIF_DIR, rect)
# generate .nrrd file from .npz file
write_nrrd(NRRD_DIR, read_npz(NPZ_DIR, 'image_stack'))

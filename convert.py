import os
import json
import math
import shutil
import glob
import nrrd
import numpy as np
from PIL import Image
from tqdm import tqdm

RAW_TO_TIF_SAMPLING = 10
TIF_TO_VOLUME_SAMPLING = 3

# CLIP = None
CLIP = { 'x': 0, 'y': 0, 'z': 0, 'w': 8096, 'h': 7888, 'd': 1000 }

VOLPKG_DIR     = '../full-scrolls/Scroll1.volpkg'
VOLUME_ID      = '20230205180739'
# SEGMENT_ID     = '20230506133355'

TIF_DIR        = f'{VOLPKG_DIR}/volumes_small/{VOLUME_ID}/'
OBJ_DIR        = f'{VOLPKG_DIR}/paths/'

# RAW_TO_TIF_SAMPLING = 1
# TIF_TO_VOLUME_SAMPLING = 1

# # CLIP = None
# CLIP = { 'x': 0, 'y': 0, 'z': 0, 'w': 500, 'h': 250, 'd': 100 }

# VOLPKG_DIR     = './output/pseudo.volpkg'
# VOLUME_ID      = '20230527161628'
# SEGMENT_ID     = '20230527164921'

# TIF_DIR        = f'{VOLPKG_DIR}/volumes/{VOLUME_ID}/'
# OBJ_DIR        = f'{VOLPKG_DIR}/paths/'

NRRD_INFO      = {}

OBJ_FOLDER     = './output/' + 'obj'
NPZ_DIR        = './output/' + 'volume.npz'
NRRD_DIR       = './output/' + 'volume.nrrd'
META_DIR       = './output/' + 'meta.json'

if not os.path.exists('output'):
    os.makedirs('output')

def read_npz(NPZ_DIR, key):
    data = np.load(NPZ_DIR)
    array = np.array(data[key])

    return array

def write_npz(NPZ_DIR, TIF_DIR, CLIP):
    # change to tif data clip
    rs = RAW_TO_TIF_SAMPLING
    c  = { key: round(value / rs) for key, value in CLIP.items() }

    names = sorted(glob.glob(TIF_DIR + '*tif'))
    names = names[c['z'] : c['z'] + c['d']]
    image_stack = np.zeros((c['w'], c['h'], c['d']), dtype=np.float32)

    for i, filename in enumerate(tqdm(names)):
        image = np.array(Image.open(filename), dtype=np.float32)[c['y']:(c['y']+c['h']), c['x']:(c['x']+c['w'])]
        image /= 65535.0
        image_stack[:, :, i] = np.transpose(image, (1, 0))

    # sampling tif stack
    ts = TIF_TO_VOLUME_SAMPLING

    print(image_stack.shape)

    pad_x = (ts - image_stack.shape[0] % ts) % ts
    pad_y = (ts - image_stack.shape[1] % ts) % ts
    pad_z = (ts - image_stack.shape[2] % ts) % ts

    image_stack = np.pad(image_stack, ((0, pad_x), (0, pad_y), (0, pad_z)), mode='edge')

    print(image_stack.shape)

    image_stack = image_stack.reshape((math.ceil(c['w'] / ts), ts, math.ceil(c['h'] / ts), ts, math.ceil(c['d'] / ts), ts))
    image_stack = image_stack.mean(axis=(1, 3, 5))

    print(image_stack.shape)

    NRRD_INFO['name'] = 'volume.nrrd'
    NRRD_INFO['w'] = image_stack.shape[0]
    NRRD_INFO['h'] = image_stack.shape[1]
    NRRD_INFO['d'] = image_stack.shape[2]

    np.savez(NPZ_DIR, image_stack=image_stack)

def read_nrrd(NRRD_DIR):
    data, header = nrrd.read(NRRD_DIR)

def write_nrrd(NRRD_DIR, data):
    # header = {'spacings': [1.0, 1.0, 1.0]}
    # nrrd.write(NRRD_DIR, data, header)
    nrrd.write(NRRD_DIR, data)

def parse_obj(filename):
    vertices = []
    normals = []
    uvs = []
    faces = []

    with open(filename, 'r') as f:
        for line in f:
            if line.startswith('v '):
                vertices.append([float(x) for x in line[2:].split()])
            elif line.startswith('vn '):
                normals.append([float(x) for x in line[3:].split()])
            elif line.startswith('vt '):
                uvs.append([float(x) for x in line[3:].split()])
            elif line.startswith('f '):
                indices = [int(x.split('/')[0]) - 1 for x in line.split()[1:]]
                faces.append(indices)

    data = {}
    data['vertices']    = np.array(vertices)
    data['normals']     = np.array(normals)
    data['uvs']         = np.array(uvs)
    data['faces']       = np.array(faces)

    return data

def save_obj(filename, data):
    vertices = data['vertices']
    normals  = data['normals']
    uvs      = data['uvs']
    faces    = data['faces']

    with open(filename, 'w') as f:

        for i in range(len(vertices)):
            vertex = vertices[i]
            normal = normals[i]
            f.write(f"v {' '.join(str(x) for x in vertex)}\n")
            f.write(f"vn {' '.join(str(x) for x in normal)}\n")

        for uv in uvs:
            f.write(f"vt {' '.join(str(x) for x in uv)}\n")

        for face in faces:
            indices = ' '.join(f"{x+1}/{x+1}/{x+1}" for x in face)
            f.write(f"f {indices}\n")

def processing(data):
    vertices = data['vertices']
    normals  = data['normals']
    uvs      = data['uvs']
    faces    = data['faces']

    # calculate bounding box
    mean_vertices = np.mean(vertices, axis=0)
    max_x = np.max(np.abs(vertices[:, 0] - mean_vertices[0]))
    max_y = np.max(np.abs(vertices[:, 1] - mean_vertices[1]))
    max_z = np.max(np.abs(vertices[:, 2] - mean_vertices[2]))

    bounding_box = {}
    bounding_box['min'] = mean_vertices - np.array([max_x, max_y, max_z])
    bounding_box['max'] = mean_vertices + np.array([max_x, max_y, max_z])

    # translate & rescale
    p_vertices = vertices
    p_normals = normals
    p_uvs = uvs
    p_faces = faces

    p_data = {}
    p_data['vertices']    = p_vertices
    p_data['normals']     = p_normals
    p_data['uvs']         = p_uvs
    p_data['faces']       = p_faces
    p_data['boundingBox'] = bounding_box

    return p_data


# Select .obj files
SEGMENT_LIST = []

shutil.rmtree('client/public/obj', ignore_errors=True)
shutil.rmtree('output/obj', ignore_errors=True)

if not isinstance(CLIP, dict):

    if not os.path.exists(OBJ_FOLDER):
        os.makedirs(OBJ_FOLDER)

    filename = f'{OBJ_DIR}{SEGMENT_ID}/{SEGMENT_ID}.obj'
    shutil.copy(filename, OBJ_FOLDER)
    SEGMENT_LIST.append(SEGMENT_ID)

else:

    subfolders = [f.path for f in os.scandir(OBJ_DIR) if f.is_dir()]
    for subfolder in subfolders:
        folder_name = os.path.basename(subfolder)
        obj_file_path = os.path.join(subfolder, folder_name + '.obj')
        
        if os.path.isfile(obj_file_path):
            if not os.path.exists(OBJ_FOLDER):
                os.makedirs(OBJ_FOLDER)
            shutil.copy(obj_file_path , OBJ_FOLDER)
            SEGMENT_LIST.append(folder_name)

shutil.copytree(OBJ_FOLDER, 'client/public/obj')

# Generate .npz file from .tif files
if not isinstance(CLIP, dict):
    # Read .obj file
    data = parse_obj(f'{OBJ_DIR}{SEGMENT_ID}/{SEGMENT_ID}.obj')
    # Processing .obj data
    p_data = processing(data)

    c = p_data['boundingBox']['min']
    b = p_data['boundingBox']['max']

    c[c < 0] = 0
    b[b < 0] = 0

    CLIP = {}
    CLIP['x'] = int(c[0])
    CLIP['y'] = int(c[1])
    CLIP['z'] = int(c[2])
    CLIP['w'] = int(b[0] - c[0])
    CLIP['h'] = int(b[1] - c[1])
    CLIP['d'] = int(b[2] - c[2])

print('CLIP: ', CLIP)
write_npz(NPZ_DIR, TIF_DIR, CLIP)
# Generate .nrrd file from .npz file
write_nrrd(NRRD_DIR, read_npz(NPZ_DIR, 'image_stack'))

# Save meta data
meta = {}
meta['clip'] = CLIP
meta['nrrd'] = NRRD_INFO
meta['obj'] = SEGMENT_LIST

with open(META_DIR, "w") as outfile:
    json.dump(meta, outfile, indent=4)

# Copy the generated files to the client folder
shutil.copy(NRRD_DIR , 'client/public')
shutil.copy(META_DIR , 'client/src')




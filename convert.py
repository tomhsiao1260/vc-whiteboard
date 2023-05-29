import os
import json
import shutil
import glob
import nrrd
import numpy as np
from PIL import Image
from tqdm import tqdm

CLIP = None
CLIP = { 'x': 300, 'y': 300, 'z': 0, 'w': 200, 'h': 150, 'd': 100 }
# CLIP = { 'x': 0, 'y': 0, 'z': 0, 'w': 810, 'h': 789, 'd': 100 }

SCALE          = 0.1
VOLPKG_DIR     = '../full-scrolls/Scroll1.volpkg'
VOLUME_ID      = '20230205180739'
# CLIP:  {'x': 395, 'y': 406, 'z': 0, 'w': 42, 'h': 34, 'd': 99}
# SEGMENT_ID     = '20230506133355'
# CLIP:  {'x': 265, 'y': 259, 'z': 0, 'w': 20, 'h': 18, 'd': 6}
# SEGMENT_ID     = '20230503225234'

TIF_DIR        = f'{VOLPKG_DIR}/volumes_small/{VOLUME_ID}/'
OBJ_DIR        = f'{VOLPKG_DIR}/paths/'

# SCALE          = 1.0
# VOLPKG_DIR     = './output/pseudo.volpkg'
# VOLUME_ID      = '20230527161628'
# SEGMENT_ID     = '20230527164921'

# TIF_DIR        = f'{VOLPKG_DIR}/volumes/{VOLUME_ID}/'
# OBJ_DIR        = f'{VOLPKG_DIR}/paths/'

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
    names = sorted(glob.glob(TIF_DIR + '*tif'))
    names = names[CLIP['z'] : CLIP['z'] + CLIP['d']]
    image_stack = np.zeros((CLIP['w'], CLIP['h'], len(names)), dtype=np.float32)

    for i, filename in enumerate(tqdm(names)):
        image = np.array(Image.open(filename), dtype=np.float32)[CLIP['y']:(CLIP['y']+CLIP['h']), CLIP['x']:(CLIP['x']+CLIP['w'])]
        image /= 65535.0
        image_stack[:, :, i] = np.transpose(image, (1, 0))

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

    c = p_data['boundingBox']['min'] * SCALE
    b = p_data['boundingBox']['max'] * SCALE

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
meta['scale'] = SCALE
meta['clip'] = CLIP
meta['nrrd'] = 'volume.nrrd'
meta['obj'] = SEGMENT_LIST

with open(META_DIR, "w") as outfile:
    json.dump(meta, outfile, indent=4)

# Copy the generated files to the client folder
shutil.copy(NRRD_DIR , 'client/public')
shutil.copy(META_DIR , 'client/src')




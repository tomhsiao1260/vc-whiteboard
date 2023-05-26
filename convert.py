import os
import shutil
import glob
import nrrd
import numpy as np
from PIL import Image
from tqdm import tqdm

SCALE          = 0.1
VOLPKG_DIR     = './example.volpkg'
VOLUME_ID      = '20230205180739'
SEGMENT_ID     = '20230506133355'

# VOLPKG_DIR     = '../full-scrolls/Scroll1.volpkg'
# VOLUME_ID      = 'pseudo'

TIF_DIR        = f'{VOLPKG_DIR}/volumes_small/{VOLUME_ID}/*.tif'
OBJ_DIR        = f'{VOLPKG_DIR}/paths/{SEGMENT_ID}/{SEGMENT_ID}.obj'

NEW_OBJ_DIR    = './output/' + 'data.obj'
NPZ_DIR        = './output/' + 'data.npz'
NRRD_DIR       = './output/' + 'data.nrrd'


if not os.path.exists('output'):
    os.makedirs('output')

def read_npz(NPZ_DIR, key):
    data = np.load(NPZ_DIR)
    array = np.array(data[key])

    return array

def write_npz(NPZ_DIR, TIF_DIR, data):
    c = data['mean_vertices'] * SCALE
    b = data['bounding_box']  * SCALE

    min_point = (c - b / 2).astype(int)
    max_point = (c + b / 2).astype(int)
    min_point[min_point < 0] = 0
    max_point[max_point < 0] = 0

    clip = {}
    clip['x'] = min_point[0]
    clip['y'] = min_point[1]
    clip['z'] = min_point[2]
    clip['w'] = max_point[0] - min_point[0]
    clip['h'] = max_point[1] - min_point[1]
    clip['d'] = max_point[2] - min_point[2]

    print('clip: ', clip)

    names = sorted(glob.glob(TIF_DIR))
    names = names[clip['z'] : clip['z'] + clip['d']]
    image_stack = np.zeros((clip['w'], clip['h'], len(names)), dtype=np.float32)

    for i, filename in enumerate(tqdm(names)):
        image = np.array(Image.open(filename), dtype=np.float32)[clip['y']:(clip['y']+clip['h']), clip['x']:(clip['x']+clip['w'])]
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
    distances = np.linalg.norm(vertices - mean_vertices, axis=1)
    farthest_vertex = vertices[np.argmax(distances)]
    bounding_box = 2 * np.abs(farthest_vertex - mean_vertices)

    # translate & rescale
    p_vertices = (vertices - mean_vertices) / np.amax(bounding_box)
    p_normals = normals
    p_uvs = uvs
    p_faces = faces

    # output
    p_vertices = np.around(p_vertices, decimals=5)
    bounding_box = np.around(bounding_box, decimals=5)
    mean_vertices = np.around(mean_vertices, decimals=5)

    p_data = {}
    p_data['vertices']      = p_vertices
    p_data['normals']       = p_normals
    p_data['uvs']           = p_uvs
    p_data['faces']         = p_faces
    p_data['mean_vertices'] = mean_vertices
    p_data['bounding_box']  = bounding_box

    return p_data

# Read .obj file
data = parse_obj(OBJ_DIR)
# Processing .obj data
p_data = processing(data)
# Save .obj file
save_obj(NEW_OBJ_DIR, p_data)
# Generate .npz file from .tif files
write_npz(NPZ_DIR, TIF_DIR, p_data)
# Generate .nrrd file from .npz file
write_nrrd(NRRD_DIR, read_npz(NPZ_DIR, 'image_stack'))

# Copy the generated files to the client folder
shutil.copy(NRRD_DIR , 'client/public')
shutil.copy(NEW_OBJ_DIR , 'client/public')

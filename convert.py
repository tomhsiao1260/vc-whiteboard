import os
import shutil
import glob
import nrrd
import numpy as np
from PIL import Image
from tqdm import tqdm

clip = { 'x': 250, 'y': 250, 'z': 0, 'w': 160, 'h': 147, 'd': 65 }

VOLUME_ID      = '20230205180739'
SEGMENT_ID     = '20230503225234'

# clip = { 'x': 0, 'y': 0, 'z': 0, 'w': 160, 'h': 147, 'd': 65 }

# VOLUME_ID      = 'pseudo'
# SEGMENT_ID     = '20230503225234'

TIF_DIR        = f'./example.volpkg/volumes_small/{VOLUME_ID}/*.tif'
OBJ_DIR        = f'./example.volpkg/paths/{SEGMENT_ID}/{SEGMENT_ID}.obj'

NEW_OBJ_DIR    = './output/' + 'data.obj'
NPZ_DIR        = './output/' + 'data.npz'
NRRD_DIR       = './output/' + 'data.nrrd'


if not os.path.exists('output'):
    os.makedirs('output')

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

    vertices = np.array(vertices)
    normals = np.array(normals)
    uvs = np.array(uvs)
    faces = np.array(faces)

    return vertices, normals, uvs, faces

def save_obj(filename, vertices, normals, uvs, faces):
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

def processing(vertices, normals, uvs, faces):
    p_vertices = vertices
    p_normals = normals
    p_uvs = uvs
    p_faces = faces

    # Calculate bounding box
    mean_vertices = np.mean(vertices, axis=0)
    distances = np.linalg.norm(vertices - mean_vertices, axis=1)
    farthest_vertex = vertices[np.argmax(distances)]
    bounding_box = farthest_vertex - mean_vertices

    # translate & rescale
    p_vertices = (vertices - mean_vertices) / np.amax(bounding_box)
    p_vertices = np.around(p_vertices, decimals=5)

    # print(mean_vertices, bounding_box)

    return p_vertices, p_normals, p_uvs, p_faces

# generate .npz file from .tif files
write_npz(NPZ_DIR, TIF_DIR, clip)
# generate .nrrd file from .npz file
write_nrrd(NRRD_DIR, read_npz(NPZ_DIR, 'image_stack'))
# read .obj file
vertices, normals, uvs, faces = parse_obj(OBJ_DIR)
# processing .obj data
p_vertices, p_normals, p_uvs, p_faces = processing(vertices, normals, uvs, faces)
# save .obj file
save_obj(NEW_OBJ_DIR, p_vertices, p_normals, p_uvs, p_faces)

# Copy the generated files to the client folder
shutil.copy(NRRD_DIR , 'client/public')
shutil.copy(NEW_OBJ_DIR , 'client/public')

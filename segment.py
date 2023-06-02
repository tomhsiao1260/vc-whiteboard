import os
import json
import shutil
import numpy as np

# config & path
with open('config.json') as f:
    config = json.load(f)

CLIP           = config['CLIP']
CLIP_CHUNK_NUM = config['CLIP_CHUNK_NUM']
VIEW_SEGMENT   = config['VIEW_SEGMENT']
VOLPKG_DIR     = config['VOLPKG_DIR']

OBJ_INPUT  = f'{VOLPKG_DIR}/paths'
OBJ_OUTPUT = './output/segment'
OBJ_INFO   = './output/segment/meta.json'

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
                indices = [x.split('/') for x in line.split()[1:]]
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
            f.write(f"v {' '.join(str(x) for x in vertex)}\n")

        for i in range(len(normals)):
            normal = normals[i]
            f.write(f"vn {' '.join(str(x) for x in normal)}\n")

        for uv in uvs:
            f.write(f"vt {' '.join(str(x) for x in uv)}\n")

        for face in faces:
            indices = ' '.join(['/'.join(map(str, vertex)) for vertex in face])
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

def box_generator(CLIP):
    size     = np.array([ CLIP['w'], CLIP['h'], CLIP['d'] ])
    minPoint = np.array([ CLIP['x'], CLIP['y'], CLIP['z'] ])
    center   = minPoint + size / 2

    data = parse_obj('mask/box.obj')
    data['vertices'] = data['vertices'] + center

    return data

# clear .obj output folder
shutil.rmtree(OBJ_OUTPUT, ignore_errors=True)
os.makedirs(OBJ_OUTPUT)

# copy .obj files from .volpkg
SEGMENT_LIST = []

if (VIEW_SEGMENT):
    subfolders = [f.path for f in os.scandir(OBJ_INPUT) if f.is_dir()]

    for subfolder in subfolders:
        folder_name = os.path.basename(subfolder)
        obj_file_path = os.path.join(subfolder, folder_name + '.obj')

        if os.path.isfile(obj_file_path):
            shutil.copy(obj_file_path , OBJ_OUTPUT)
            SEGMENT_LIST.append(folder_name)
else:
    for i in range(CLIP_CHUNK_NUM):
        SUB_CLIP = CLIP.copy()
        SUB_CLIP['z'] = CLIP['z'] + (CLIP['d'] // CLIP_CHUNK_NUM) * i
        SUB_CLIP['d'] = CLIP['d'] // CLIP_CHUNK_NUM

        if (i == CLIP_CHUNK_NUM - 1):
            SUB_CLIP['d'] = CLIP['z'] + CLIP['d'] - SUB_CLIP['z']

        DIGIT_NUM = len(str(CLIP_CHUNK_NUM))
        SEGMENT_ID = str(i).zfill(DIGIT_NUM)
        SEGMENT_LIST.append(SEGMENT_ID)

        data = box_generator(SUB_CLIP)
        filename = f'{OBJ_OUTPUT}/{SEGMENT_ID}.obj'
        save_obj(filename, data)

# parse .obj files and get relevant info and copy to client
meta = {}
meta['obj'] = []

for SEGMENT_ID in SEGMENT_LIST:
    filename = f'{OBJ_OUTPUT}/{SEGMENT_ID}.obj'

    data = parse_obj(filename)
    p_data = processing(data)

    c = p_data['boundingBox']['min']
    b = p_data['boundingBox']['max']

    c[c < 0] = 0
    b[b < 0] = 0

    info = {}
    info['id'] = SEGMENT_ID
    # info['boundingBox'] = {}
    # info['boundingBox']['min'] = [round(v, 2) for v in p_data['boundingBox']['min']]
    # info['boundingBox']['max'] = [round(v, 2) for v in p_data['boundingBox']['max']]
    info['clip'] = {}
    info['clip']['x'] = int(c[0])
    info['clip']['y'] = int(c[1])
    info['clip']['z'] = int(c[2])
    info['clip']['w'] = int(b[0] - c[0])
    info['clip']['h'] = int(b[1] - c[1])
    info['clip']['d'] = int(b[2] - c[2])

    meta['obj'].append(info)

with open(OBJ_INFO, "w") as outfile:
    json.dump(meta, outfile, indent=4)

shutil.rmtree('client/public/segment', ignore_errors=True)
shutil.copytree(OBJ_OUTPUT, 'client/public/segment', dirs_exist_ok=True)


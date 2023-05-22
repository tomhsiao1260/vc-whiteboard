import os
import numpy as np
import tifffile as tiff

size = { 'w': 160, 'h': 147, 'd': 65 }
TIF_DIR = './example.volpkg/volumes_small/pseudo/'


if not os.path.exists(TIF_DIR):
    os.makedirs(TIF_DIR)

for name in os.listdir(TIF_DIR):
    if name.endswith('.tif'):
        os.remove(os.path.join(TIF_DIR, name))

for i in range(size['d']):
    image = np.zeros((size['h'], size['w']), dtype=np.uint16)

    radius = i * 1.13
    center_x = size['w'] // 2
    center_y = size['h'] // 2

    y_indices, x_indices = np.ogrid[:size['h'], :size['w']]
    circle_mask = (x_indices - center_x) ** 2 + (y_indices - center_y) ** 2 <= radius ** 2
    image[circle_mask] = np.iinfo(np.uint16).max

    filename = f'{TIF_DIR}{i:05d}.tif'
    tiff.imwrite(filename, image)



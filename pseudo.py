import os
import sys
import math
import json
import numpy as np
import tifffile as tiff

TIF_DIR = sys.argv[1]

size = { 'w': 500, 'h': 250, 'd': 100 }


for i in range(size['d']):
    image = np.zeros((size['h'], size['w']), dtype=np.uint16)

    radius = 5.0
    p0_x = size['w'] // 4
    p0_y = size['h'] // 4

    p1_x = p0_x + int(radius * math.sin(i * 0.3))
    p1_y = p0_y + int(radius * math.cos(i * 0.3))
    p2_x = p1_x + int(radius * math.sin(i * 0.3))
    p2_y = p1_y + int(radius * math.cos(i * 0.3))
    p3_x = p2_x + int(radius * math.sin(i * 0.3))
    p3_y = p2_y + int(radius * math.cos(i * 0.3))
    p4_x = p3_x + int(radius * math.sin(i * 0.3))
    p4_y = p3_y + int(radius * math.cos(i * 0.3))
    p5_x = p4_x + int(radius * math.sin(i * 0.3))
    p5_y = p4_y + int(radius * math.cos(i * 0.3))

    y_indices, x_indices = np.ogrid[:size['h'], :size['w']]

    p0_mask = (x_indices - p0_x) ** 2 + (y_indices - p0_y) ** 2 <= radius ** 2
    p1_mask = (x_indices - p1_x) ** 2 + (y_indices - p1_y) ** 2 <= radius ** 2
    p2_mask = (x_indices - p2_x) ** 2 + (y_indices - p2_y) ** 2 <= radius ** 2
    p3_mask = (x_indices - p3_x) ** 2 + (y_indices - p3_y) ** 2 <= radius ** 2
    p4_mask = (x_indices - p4_x) ** 2 + (y_indices - p4_y) ** 2 <= radius ** 2
    p5_mask = (x_indices - p5_x) ** 2 + (y_indices - p5_y) ** 2 <= radius ** 2

    image[p0_mask] = np.iinfo(np.uint16).max
    image[p1_mask] = np.iinfo(np.uint16).max
    image[p2_mask] = np.iinfo(np.uint16).max
    image[p3_mask] = np.iinfo(np.uint16).max
    image[p4_mask] = np.iinfo(np.uint16).max
    image[p5_mask] = np.iinfo(np.uint16).max

    filename = f'{TIF_DIR}{i:05d}.tif'
    tiff.imwrite(filename, image)



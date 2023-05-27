#!/bin/bash

PSEUDO_DIR="./output/pseudo/"
VOLPKG_DIR="./output/pseudo.volpkg"

VOLUME_ID="20230527161628"
SEGMENT_ID="20230527164921"

OBJ_DIR="$VOLPKG_DIR/paths/$SEGMENT_ID/$SEGMENT_ID.obj"

##############################################
#         generate pseudo .tif data
##############################################
# if [ -d "$PSEUDO_DIR" ]; then
#   rm -rf "$PSEUDO_DIR"
# fi

# mkdir "$PSEUDO_DIR"
# python pseudo.py "$PSEUDO_DIR"

##############################################
#    generate .volpkg file from .tif data
##############################################
# vc_packager -v "$VOLPKG_DIR" -m 1000 -s "$PSEUDO_DIR"

##############################################
#   generate .obj model from the segment id
##############################################
vc_render -v "$VOLPKG_DIR" -s "$SEGMENT_ID" -o "$OBJ_DIR"



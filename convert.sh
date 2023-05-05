#!/bin/bash

if [ ! -d "res/output" ]; then
  mkdir res/output
fi

python convert.py

cp res/output/data.nrrd client/models
cp res/output/inklabels.png client/textures

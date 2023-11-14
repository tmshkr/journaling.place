#!/bin/bash
set -e

mkdir -p saved_modules
cd node_modules
mv .bin *prisma turbo ../saved_modules/
cd ..
rm -rf node_modules
mv saved_modules node_modules
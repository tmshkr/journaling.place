#!/bin/bash -e

echo "Installing npm dependencies..."
npm run install:ci --workspace=scripts

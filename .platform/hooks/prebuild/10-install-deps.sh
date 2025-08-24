#!/bin/bash

set -o xtrace
set -e

dnf update
dnf install git -y

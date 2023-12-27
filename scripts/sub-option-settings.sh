#!/bin/bash -e

echo $(envsubst <option-settings.json) >option-settings.json

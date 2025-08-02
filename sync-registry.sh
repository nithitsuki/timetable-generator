#!/bin/bash
set -e

# Pull latest changes in the submodule
git submodule update --remote deps/timetable-registry

# Sync just the registry/files folder
rsync -av --delete deps/timetable-registry/registry/files/ public/data/

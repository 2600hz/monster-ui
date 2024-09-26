#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

if [[ "$1" == 'update' ]]; then
    pushd src/apps
    for app in ./*/; do
        pushd "$app"
        gu="$(git config --get remote.origin.url)"
        if [[ 'git@github.com:2600hz/monster-ui.git' != "$gu" ]]; then
            echo Pulling from "$gu"
            git pull
        fi
        popd
    done
    popd
fi

# Define build output directories on the host
BUILD_DIR_DIST="$(pwd)/monster-ui-build/dist"
BUILD_DIR_DISTDEV="$(pwd)/monster-ui-build/distDev"

# Create host build directories
mkdir -p "$BUILD_DIR_DIST"
mkdir -p "$BUILD_DIR_DISTDEV"

# Build the Docker image
echo "Building Docker image 'monster-ui-builder'..."
docker build -t monster-ui-builder .

# Create a unique container name (using current timestamp to avoid conflicts)
CONTAINER_NAME="monster-ui-builder-$(date +%s)"

# Run the container without volume mapping and with a specific name
echo "Running container '$CONTAINER_NAME'..."
docker run --name "$CONTAINER_NAME" monster-ui-builder

# Check if the container exited successfully
EXIT_CODE=$(docker inspect "$CONTAINER_NAME" --format='{{.State.ExitCode}}')
if [ "$EXIT_CODE" -ne 0 ]; then
  echo "Build failed with exit code $EXIT_CODE"
  docker logs "$CONTAINER_NAME"
  docker rm "$CONTAINER_NAME"
  exit 1
fi

# Copy build artifacts from the container to the host
echo "Copying build artifacts to host directories..."
docker cp "$CONTAINER_NAME:/var/www/dist/." "$BUILD_DIR_DIST/"
docker cp "$CONTAINER_NAME:/var/www/distDev/." "$BUILD_DIR_DISTDEV/"

# Remove the temporary container
echo "Removing temporary container '$CONTAINER_NAME'..."
docker rm "$CONTAINER_NAME"

echo "Build artifacts have been successfully copied to '$BUILD_DIR_DIST' and '$BUILD_DIR_DISTDEV'."

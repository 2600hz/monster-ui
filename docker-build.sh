#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

DATATABLES_PATHS=(
    "'datatables.net': 'js/vendor/datatables/jquery.dataTables.min',"
    "'datatables.net-bs': 'js/vendor/datatables/dataTables.bootstrap.min',"
    "'datatables.net-buttons': 'js/vendor/datatables/dataTables.buttons.min',"
    "'datatables.net-buttons-html5': 'js/vendor/datatables/buttons.html5.min',"
    "'datatables.net-buttons-bootstrap':'js/vendor/datatables/buttons.bootstrap.min',"
)

GITHUBREPO="https://github.com/kazoo-classic"

MAIN_JS="$(pwd)/src/js/main.js"
# Function to add a line to the paths object if it doesn't already exist
add_line_if_missing() {
    local line="$1"
    local file="$2"

    # Escape forward slashes for grep and sed
    local escaped_line=$(echo "$line" | sed 's/\//\\\//g')

    # Check if the line exists in the file
    if ! grep -qF "$line" "$file"; then
        # Insert the line before the closing '}' of the paths object
        # Assumes that 'paths: {' and the closing '}' are properly formatted
        sed -i "/paths\s*:\s*{/a \ \ \ \ \ \ \ \ $escaped_line" "$file"
        echo "Added line: $line"
    else
        echo "Line already exists: $line"
    fi
}

if [[ "$1" == 'allapps' ]]; then
    echo "adding callflows updates"
    #callflows
    mkdir -p $(pwd)/tmp
    git clone $GITHUBREPO/monster-ui-callflows-ng.git $(pwd)/tmp
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding resources app"
    #resources
    mkdir -p $(pwd)/tmp/src/apps/resources
    git clone $GITHUBREPO/monster-ui-resources.git $(pwd)/tmp/src/apps/resources
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding rates app"
    #rates
    mkdir -p $(pwd)/tmp/src/apps/rates
    git clone $GITHUBREPO/monster-ui-rates.git $(pwd)/tmp/src/apps/rates
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding callcenter app"
    #callcenter
    mkdir -p $(pwd)/tmp
    git clone $GITHUBREPO/monster-ui-callcenter.git $(pwd)/tmp
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    #echo "adding storagemgmt app"
    ##storagemgmt (fails minify when building)
    ## around the line for "storageManagerMakeConfig (storageKeyword, data, uuid) {"
    #mkdir -p $(pwd)/tmp
    #git clone $GITHUBREPO/monster-ui-storagemgmt.git $(pwd)/tmp
    #/bin/cp -rf $(pwd)/tmp/src $(pwd)/
    #rm -rf $(pwd)/tmp

    echo "adding whitelabel app"
    #whitelabel
    mkdir -p $(pwd)/tmp
    git clone $GITHUBREPO/monster-ui-whitelabel.git $(pwd)/tmp
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding addressbooks app"
    #addressbooks
    mkdir -p $(pwd)/tmp
    git clone $GITHUBREPO/monster-ui-addressbooks.git $(pwd)/tmp
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding registrations app"
    #registrations
    mkdir -p $(pwd)/tmp/src/apps/registrations
    git clone $GITHUBREPO/monster-ui-registrations.git $(pwd)/tmp/src/apps/registrations
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding voicemails app"
    #registrations
    mkdir -p $(pwd)/tmp/src/apps/voicemails
    git clone $GITHUBREPO/monster-ui-voicemails.git $(pwd)/tmp/src/apps/voicemails
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding recordings app"
    #registrations
    mkdir -p $(pwd)/tmp/src/apps/recordings
    git clone $GITHUBREPO/monster-ui-recordings.git $(pwd)/tmp/src/apps/recordings
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding SmartPBX app"
    #registrations
    mkdir -p $(pwd)/tmp/src/apps/voip
    git clone $GITHUBREPO/monster-ui-voip.git $(pwd)/tmp/src/apps/voip
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding Accounts app"
    #registrations
    mkdir -p $(pwd)/tmp/src/apps/accounts
    git clone $GITHUBREPO/monster-ui-accounts.git $(pwd)/tmp/src/apps/accounts
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding CSV-Onboarding app"
    #registrations
    mkdir -p $(pwd)/tmp/src/apps/csv-onboarding
    git clone $GITHUBREPO/monster-ui-csv-onboarding.git $(pwd)/tmp/src/apps/csv-onboarding
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding Fax app"
    #registrations
    mkdir -p $(pwd)/tmp/src/apps/fax
    git clone $GITHUBREPO/monster-ui-fax.git $(pwd)/tmp/src/apps/fax
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding Numbers app"
    #registrations
    mkdir -p $(pwd)/tmp/src/apps/numbers
    git clone $GITHUBREPO/monster-ui-numbers.git $(pwd)/tmp/src/apps/numbers
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding PBXs app"
    #registrations
    mkdir -p $(pwd)/tmp/src/apps/pbxs
    git clone $GITHUBREPO/monster-ui-pbxs.git $(pwd)/tmp/src/apps/pbxs
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    echo "adding Webhooks app"
    #registrations
    mkdir -p $(pwd)/tmp/src/apps/webhooks
    git clone $GITHUBREPO/monster-ui-webhooks.git $(pwd)/tmp/src/apps/webhooks
    /bin/cp -rf $(pwd)/tmp/src $(pwd)/
    rm -rf $(pwd)/tmp

    for line in "${DATATABLES_PATHS[@]}"; do
        add_line_if_missing "$line" "$MAIN_JS"
    done
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

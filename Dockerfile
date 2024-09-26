# Use an official Node runtime as a parent image
FROM node:14

# Set the working directory
WORKDIR /var/www

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Install Gulp globally
RUN npm install -g gulp@4.0.0

# Create the build directories
RUN mkdir -p /var/www/dist
RUN mkdir -p /var/www/distDev

# Define the default command to run Gulp
CMD ["gulp", "build-all"]

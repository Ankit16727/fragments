# This is a docker file
# It's important for Docker Engine to build a docker image which can be used for running the Docker Container

###################################################
# Use node version 23.6.0
FROM node:23.6.0 AS build

LABEL maintainer="Ankit Thapar <athapar4@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# Setting working directory for build
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies efficiently
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .


###################################################
#Use a smaller Alpine image for production
FROM node:23.6.0-alpine AS production

# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy only necessary files from build stage
COPY --from=build /app /app

# Start the container by running our server
CMD ["npm", "start"]

# We run our service on port 8080
EXPOSE 8080

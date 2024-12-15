FROM node:16

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set up the working directory
WORKDIR /

# Copy application files
COPY package*.json ./
RUN npm install
COPY . .

# Expose the port and start the server
EXPOSE 3000
CMD ["node", "index.js"]

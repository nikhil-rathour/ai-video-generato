FROM node:20-bullseye-slim

# Install system FFmpeg and tools
RUN apt-get update && \
    apt-get install -y ffmpeg fonts-dejavu-core fonts-liberation && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]

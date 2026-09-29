import { EventEmitter } from 'events';

class ProgressEmitter extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // videoId -> Set of express res objects
  }

  addClient(videoId, res) {
    if (!this.clients.has(videoId)) {
      this.clients.set(videoId, new Set());
    }
    this.clients.get(videoId).add(res);

    // Initial SSE connection ping
    res.write(`data: ${JSON.stringify({ type: 'connected', videoId, timestamp: Date.now() })}\n\n`);

    res.on('close', () => {
      this.removeClient(videoId, res);
    });
  }

  removeClient(videoId, res) {
    if (this.clients.has(videoId)) {
      this.clients.get(videoId).delete(res);
      if (this.clients.get(videoId).size === 0) {
        this.clients.delete(videoId);
      }
    }
  }

  notify(videoId, payload) {
    const data = {
      videoId,
      timestamp: Date.now(),
      ...payload,
    };

    // Emit internally
    this.emit(`progress:${videoId}`, data);

    // Send to active SSE clients
    if (this.clients.has(videoId)) {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      for (const client of this.clients.get(videoId)) {
        try {
          client.write(message);
        } catch {
          this.removeClient(videoId, client);
        }
      }
    }
  }
}

export const progressEmitter = new ProgressEmitter();
export default progressEmitter;

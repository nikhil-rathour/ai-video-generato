import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
});

export const videoApi = {
  // Trigger full pipeline
  generate: async (data) => {
    const res = await api.post('/video/generate', data);
    return res.data;
  },

  // Get all generated videos
  getAll: async () => {
    const res = await api.get('/videos');
    return res.data;
  },

  // Get single video details
  getById: async (id) => {
    const res = await api.get(`/video/${id}`);
    return res.data;
  },

  // Delete video
  delete: async (id) => {
    const res = await api.delete(`/video/${id}`);
    return res.data;
  },

  // Modular steps
  generateScript: async (data) => {
    const res = await api.post('/video/script', data);
    return res.data;
  },

  collectAssets: async (data) => {
    const res = await api.post('/video/assets', data);
    return res.data;
  },

  generateVoice: async (data) => {
    const res = await api.post('/video/voice', data);
    return res.data;
  },

  renderVideo: async (data) => {
    const res = await api.post('/video/render', data);
    return res.data;
  }
};

export const qoneqtApi = {
  publish: async (data) => {
    const res = await api.post('/qoneqt/publish', data);
    return res.data;
  },

  getStatus: async (id) => {
    const res = await api.get(`/qoneqt/status/${id}`);
    return res.data;
  }
};

export const settingsApi = {
  getStatus: async () => {
    const res = await api.get('/settings/status');
    return res.data;
  },

  testApi: async (provider) => {
    const res = await api.post('/settings/test', { provider });
    return res.data;
  }
};

export default api;

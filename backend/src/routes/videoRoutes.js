import express from 'express';
import VideoController from '../controllers/videoController.js';

const router = express.Router();

router.get('/', VideoController.getAllVideos);
router.post('/generate', VideoController.generateVideo);
router.post('/script', VideoController.generateScriptOnly);
router.post('/assets', VideoController.collectAssetsOnly);
router.post('/voice', VideoController.generateVoiceOnly);
router.post('/render', VideoController.renderVideoOnly);
router.get('/progress/:id', VideoController.streamProgress);
router.get('/:id', VideoController.getVideoById);
router.delete('/:id', VideoController.deleteVideo);

export default router;

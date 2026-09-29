import express from 'express';
import QoneqtController from '../controllers/qoneqtController.js';

const router = express.Router();

router.post('/publish', QoneqtController.publishVideo);
router.get('/status/:id', QoneqtController.getPublishStatus);

export default router;

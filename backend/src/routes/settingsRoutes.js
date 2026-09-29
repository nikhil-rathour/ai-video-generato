import express from 'express';
import SettingsController from '../controllers/settingsController.js';

const router = express.Router();

router.get('/status', SettingsController.getStatus);
router.post('/test', SettingsController.testApi);

export default router;

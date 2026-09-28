import express from 'express';
import { getAllMentorsHandler, getNotificationsHandler } from '../controllers/mentorController.js';

const router = express.Router();

// GET /api/mentors
router.get('/', getAllMentorsHandler);

// GET /api/mentors/notifications (Demo inspect logs)
router.get('/notifications', getNotificationsHandler);

export default router;

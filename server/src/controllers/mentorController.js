import mentorService from '../services/mentorService.js';
import notificationService from '../services/notificationService.js';

export async function getAllMentorsHandler(req, res, next) {
  try {
    const mentors = await mentorService.getAllMentorsWithStats();
    res.json({
      success: true,
      data: mentors,
    });
  } catch (err) {
    next(err);
  }
}

export async function getNotificationsHandler(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const logs = await notificationService.getRecentLogs(limit);
    res.json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}

import slotService from '../services/slotService.js';

export async function getSlotsHandler(req, res, next) {
  try {
    const { date, timezone } = req.validatedQuery;
    const result = await slotService.getAvailableSlots(date, timezone);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

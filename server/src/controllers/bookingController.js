import bookingService from '../services/bookingService.js';

export async function createBookingHandler(req, res, next) {
  try {
    const confirmation = await bookingService.createBooking(req.validatedBody);
    res.status(201).json({
      success: true,
      data: confirmation,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBookingHandler(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found with the provided ID',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}

export async function clearBookingsHandler(req, res, next) {
  try {
    await bookingService.clearAllBookings();
    res.json({
      success: true,
      message: 'All trial class bookings and notification logs have been reset for demo.',
    });
  } catch (err) {
    next(err);
  }
}

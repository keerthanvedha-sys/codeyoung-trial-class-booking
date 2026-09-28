export function errorHandler(err, req, res, next) {
  // Determine HTTP status code
  const statusCode = err.statusCode || (err.status ? err.status : 500);

  // Determine user-friendly error message
  let message = err.message || 'An unexpected error occurred. Please try again.';

  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error. Our engineering team has been notified.';
  }

  // Log error stack in development / testing
  if (statusCode === 500) {
    console.error('[UNHANDLED SERVER ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.name || 'Error',
    ...(process.env.NODE_ENV !== 'production' && statusCode === 500 ? { stack: err.stack } : {}),
  });
}

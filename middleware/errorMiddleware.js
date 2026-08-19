// ── Global error handler ──────────────────────────────────────────
// If a response was already sent (e.g. a controller's try block sent
// res.json(), then something else later threw and called next(err)),
// Express itself will crash with ERR_HTTP_HEADERS_SENT the moment we
// try to send a second response. The fix per Express's own docs:
// delegate to the default handler instead of sending again.
const errorMiddleware = (err, req, res, next) => {
  console.error("Unhandled error:", err.message);

  if (res.headersSent) {
    return next(err); // let Express's built-in handler close the connection safely
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server error",
  });
};

export default errorMiddleware;
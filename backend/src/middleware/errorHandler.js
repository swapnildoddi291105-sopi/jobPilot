/**
 * Centralized error handler. Place after all routes via app.use(errorHandler).
 * If the error has a status code, use it; otherwise default to 500.
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500
  const message = err.message || "Internal server error"

  // Log full error server-side; send concise message to client
  if (status >= 500) {
    console.error("[error]", err)
  } else {
    console.warn("[client-error]", status, message)
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && status >= 500 && { stack: err.stack }),
  })
}

/**
 * Wrap an async route handler so rejected promises reach the error handler
 * instead of crashing the process.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

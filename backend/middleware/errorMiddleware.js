export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found - ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProd = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    success: false,
    message: isProd && statusCode === 500
      ? 'An internal server error occurred.'
      : (err.message || 'Internal Server Error'),
  });
};

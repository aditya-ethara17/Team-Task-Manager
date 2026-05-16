const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.code === 'P1000') {
    return res.status(503).json({ error: 'Database authentication failed. Check DATABASE_URL in backend/.env.' });
  }

  if (err.code === 'P1001') {
    return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and verify DATABASE_URL in backend/.env.' });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error'
  });
};

module.exports = errorHandler;

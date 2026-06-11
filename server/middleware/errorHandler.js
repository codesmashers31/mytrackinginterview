export default function errorHandler(err, req, res, next) {
  console.error('Server Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
}

export default function requireRole(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user || !req.user.role || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role access' });
    }
    next();
  };
}

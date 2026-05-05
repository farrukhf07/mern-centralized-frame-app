const adminOnly = (req, res, next) => {
  const role = String(req?.user?.role || '').toLowerCase();
  if (role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admin can perform hard delete',
    });
  }
  return next();
};

module.exports = adminOnly;

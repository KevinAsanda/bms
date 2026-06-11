// apps/api/src/middleware/rbac.js
export function rbacMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    next();
  };
}

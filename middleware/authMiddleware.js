// middleware/authMiddleware.js

// This middleware checks if a user is authenticated before allowing access to a route
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    // User is authenticated, proceed to the next middleware or route handler
    next();
  }
  
  export default requireAuth;
  

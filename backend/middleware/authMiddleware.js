import { supabase } from '../supabaseClient.js';

/**
 * Middleware to protect API routes and verify the Supabase JWT.
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed authorization token.' });
  }

  const token = authHeader.split(' ')[1];

  // Intercept for Mock Database Mode
  if (global.useMockDatabase) {
    if (!token.startsWith('mock-token-')) {
      return res.status(401).json({ error: 'Unauthorized: Invalid mock token.' });
    }
    const userId = token.replace('mock-token-', '');
    // Import mockDb dynamically or just access users in mockDb
    const { mockDb } = await import('../mockDb.js');
    const user = mockDb.users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Mock user not found.' });
    }
    
    req.user = { id: user.id, email: user.email };
    req.userToken = token;
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token.', details: error?.message });
    }

    // Attach user to request object
    req.user = user;
    req.userToken = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal Server Error during auth verification.' });
  }
};

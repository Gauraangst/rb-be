import { verifyAuthToken } from '../lib/auth.js';
import { findDemoUserById, serializeDemoUser } from '../data/demoUsers.js';
import { getSupabase, isDatabaseReady } from '../lib/supabase.js';

const databaseReady = () => isDatabaseReady() && Boolean(getSupabase());

const loadUserFromPayload = async (payload) => {
  if (payload.source === 'demo' || !databaseReady()) {
    const demoUser = findDemoUserById(payload.id);
    return demoUser ? { ...serializeDemoUser(demoUser), source: 'demo' } : null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, role')
    .eq('id', payload.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    _id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    role: data.role,
    source: 'db',
  };
};

const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
};

export const protect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }

  try {
    const decoded = verifyAuthToken(token);
    const user = await loadUserFromPayload(decoded);

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const optionalProtect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyAuthToken(token);
    const user = await loadUserFromPayload(decoded);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.error('Optional auth failed:', error.message);
  }

  next();
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

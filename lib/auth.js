import crypto from 'crypto';

const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || 'radhe-boutique-auth-secret';
const CHECKOUT_TOKEN_SECRET = process.env.CHECKOUT_TOKEN_SECRET || AUTH_TOKEN_SECRET;

const base64UrlEncode = (value) =>
  Buffer.from(typeof value === 'string' ? value : JSON.stringify(value))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${'='.repeat(padding)}`, 'base64').toString('utf8');
};

const signPayload = (payload, secret, expiresInSeconds) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedBody = base64UrlEncode(body);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${encodedHeader}.${encodedBody}.${signature}`;
};

const verifySignedPayload = (token, secret) => {
  const [encodedHeader, encodedBody, signature] = String(token || '').split('.');
  if (!encodedHeader || !encodedBody || !signature) {
    throw new Error('Malformed token');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(encodedBody));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }

  return payload;
};

export const generateAuthToken = ({ id, email, role, source = 'db' }) =>
  signPayload({ id, email, role, source, type: 'auth' }, AUTH_TOKEN_SECRET, 60 * 60 * 24 * 30);

export const verifyAuthToken = (token) => {
  const payload = verifySignedPayload(token, AUTH_TOKEN_SECRET);

  if (payload.type !== 'auth') {
    throw new Error('Invalid auth token');
  }

  return payload;
};

export const signCheckoutToken = (payload) =>
  signPayload({ ...payload, type: 'checkout' }, CHECKOUT_TOKEN_SECRET, 60 * 15);

export const verifyCheckoutToken = (token) => {
  const payload = verifySignedPayload(token, CHECKOUT_TOKEN_SECRET);

  if (payload.type !== 'checkout') {
    throw new Error('Invalid checkout token');
  }

  return payload;
};

export const hashPasswordSync = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
};

export const verifyPasswordSync = (password, storedHash = '') => {
  const [salt, hashedValue] = String(storedHash).split(':');
  if (!salt || !hashedValue) {
    return false;
  }

  const expectedBuffer = Buffer.from(hashedValue, 'hex');
  const actualBuffer = Buffer.from(crypto.scryptSync(password, salt, 64));

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

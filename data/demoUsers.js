import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPasswordSync } from '../lib/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, 'users.json');

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const buildDefaultAdmin = () => ({
  _id: 'demo-user-admin',
  name: process.env.ADMIN_NAME || 'Boutique Owner',
  email: normalizeEmail(process.env.ADMIN_EMAIL || 'owner@radheboutique.com'),
  phone: process.env.ADMIN_PHONE || '',
  password: hashPasswordSync(process.env.ADMIN_PASSWORD || 'ChangeMe123!'),
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const stripPassword = (user) => {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
};

const ensureAdmin = (users = []) => {
  if (users.some((user) => user.role === 'admin')) {
    return users;
  }

  return [buildDefaultAdmin(), ...users];
};

const loadUsers = () => {
  try {
    if (!fs.existsSync(usersFilePath)) {
      const seededUsers = ensureAdmin([]);
      fs.writeFileSync(usersFilePath, JSON.stringify(seededUsers, null, 2), 'utf8');
      return seededUsers;
    }

    const raw = fs.readFileSync(usersFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return ensureAdmin(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error('Unable to read demo users file:', error.message);
    return ensureAdmin([]);
  }
};

let demoUsers = loadUsers();

const persistUsers = () => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(demoUsers, null, 2), 'utf8');
  } catch (error) {
    console.error('Unable to persist demo users file:', error.message);
  }
};

export const getDemoUsers = () => demoUsers.map((user) => stripPassword(user));

export const findDemoUserByEmail = (email) =>
  demoUsers.find((user) => user.email === normalizeEmail(email)) || null;

export const findDemoUserById = (id) =>
  demoUsers.find((user) => user._id === id) || null;

export const createDemoUser = ({ name, email, password, phone = '', role = 'user' }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = {
    _id: `demo-user-${Date.now()}`,
    name: String(name || '').trim(),
    email: normalizedEmail,
    phone: String(phone || '').trim(),
    password: hashPasswordSync(password),
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  demoUsers.unshift(user);
  persistUsers();
  return stripPassword(user);
};

export const updateDemoUser = (id, updates) => {
  const userIndex = demoUsers.findIndex((user) => user._id === id);
  if (userIndex === -1) {
    return null;
  }

  const currentUser = demoUsers[userIndex];
  demoUsers[userIndex] = {
    ...currentUser,
    ...updates,
    email: updates.email ? normalizeEmail(updates.email) : currentUser.email,
    password: updates.password ? hashPasswordSync(updates.password) : currentUser.password,
    updatedAt: new Date().toISOString(),
  };

  persistUsers();
  return stripPassword(demoUsers[userIndex]);
};

export const serializeDemoUser = stripPassword;

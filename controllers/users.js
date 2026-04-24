import { generateAuthToken, hashPasswordSync, verifyPasswordSync } from '../lib/auth.js';
import { mapUserRowToApi } from '../lib/db-mappers.js';
import { getSupabase, isDatabaseReady } from '../lib/supabase.js';
import {
  createDemoUser,
  findDemoUserByEmail,
  serializeDemoUser,
  updateDemoUser,
} from '../data/demoUsers.js';

const databaseReady = () => isDatabaseReady() && Boolean(getSupabase());

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const validatePassword = (password = '') => {
  if (String(password).length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
};

const buildAuthResponse = (user, source = 'db') => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  token: generateAuthToken({
    id: user._id,
    email: user.email,
    role: user.role,
    source,
  }),
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  try {
    if (databaseReady()) {
      const supabase = getSupabase();
      const { data: userRow, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const user = mapUserRowToApi(userRow, { includePassword: true });

      if (user && verifyPasswordSync(password, user.password)) {
        return res.json(buildAuthResponse(user, 'db'));
      }

      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = findDemoUserByEmail(email);
    if (user && verifyPasswordSync(password, user.password)) {
      return res.json(buildAuthResponse(user, 'demo'));
    }

    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req, res) => {
  const { name, password, phone = '' } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    validatePassword(password);

    if (databaseReady()) {
      const supabase = getSupabase();
      const { data: userExists, error: existsError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existsError) {
        throw existsError;
      }

      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const { data: createdUserRow, error: insertError } = await supabase
        .from('users')
        .insert({
          name,
          email,
          phone,
          password: hashPasswordSync(password),
          role: 'user',
        })
        .select('*')
        .single();

      if (insertError) {
        throw insertError;
      }

      const user = mapUserRowToApi(createdUserRow);

      return res.status(201).json(buildAuthResponse(user, 'db'));
    }

    const userExists = findDemoUserByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = createDemoUser({
      name,
      email,
      phone,
      password,
    });

    res.status(201).json({
      ...user,
      token: generateAuthToken({
        id: user._id,
        email: user.email,
        role: user.role,
        source: 'demo',
      }),
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(serializeDemoUser(req.user));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const nextEmail = normalizeEmail(req.body.email || req.user.email);

    if (req.user.source === 'demo') {
      const updatedUser = updateDemoUser(req.user._id, {
        name: req.body.name || req.user.name,
        email: nextEmail,
        phone: req.body.phone ?? req.user.phone,
        ...(req.body.password ? { password: req.body.password } : {}),
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(buildAuthResponse(updatedUser, 'demo'));
    }

    const supabase = getSupabase();

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user._id)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    const user = mapUserRowToApi(userRow, { includePassword: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { data: existingEmailUser, error: existingEmailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', nextEmail)
      .maybeSingle();

    if (existingEmailError) {
      throw existingEmailError;
    }

    if (existingEmailUser && existingEmailUser.id !== req.user._id) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    const updatePayload = {
      name: req.body.name || user.name,
      email: nextEmail,
      phone: req.body.phone ?? user.phone,
      updated_at: new Date().toISOString(),
    };

    if (req.body.password) {
      validatePassword(req.body.password);
      updatePayload.password = hashPasswordSync(req.body.password);
    }

    const { data: updatedUserRow, error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', req.user._id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    const updatedUser = mapUserRowToApi(updatedUserRow);
    res.json(buildAuthResponse(updatedUser, 'db'));
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to update profile' });
  }
};

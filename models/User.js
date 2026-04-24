import mongoose from 'mongoose';
import { hashPasswordSync, verifyPasswordSync } from '../lib/auth.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = function (enteredPassword) {
  return verifyPasswordSync(enteredPassword, this.password);
};

// Hash password before saving
userSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = hashPasswordSync(this.password);
  next();
});

const User = mongoose.model('User', userSchema);
export default User;

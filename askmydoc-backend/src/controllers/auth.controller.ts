import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { ApiError, AuthRequestBody } from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 12;   // bcrypt cost: higher = slower for attackers (and for us)

const signToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as AuthRequestBody;

    if (!email || !EMAIL_PATTERN.test(email)) {
      res.status(400).json({ error: 'A valid email is required' } as ApiError);
      return;
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      } as ApiError);
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash });

    res.status(201).json({
      token: signToken(user.id),
      user: { _id: user._id, email: user.email },
    });
  } catch (error) {
    // 11000 = MongoDB "duplicate key": this email is already registered
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ error: 'Email is already registered' } as ApiError);
      return;
    }
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
      error: 'Failed to register',
      details: isDev ? String(error) : undefined,
    } as ApiError);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as AuthRequestBody;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' } as ApiError);
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

    // Same message whether the email or the password was wrong
    if (!user || !passwordMatches) {
      res.status(401).json({ error: 'Invalid email or password' } as ApiError);
      return;
    }

    res.status(200).json({
      token: signToken(user.id),
      user: { _id: user._id, email: user.email },
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
      error: 'Failed to log in',
      details: isDev ? String(error) : undefined,
    } as ApiError);
  }
};
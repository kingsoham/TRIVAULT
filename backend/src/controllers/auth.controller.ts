import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { env } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['owner', 'user', 'admin']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const firebaseSyncSchema = z.object({
  idToken: z.string(),
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  firebaseUid: z.string(),
  role: z.enum(['owner', 'user', 'admin']).optional(),
});

export async function firebaseSync(req: Request, res: Response) {
  try {
    const parseResult = firebaseSyncSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.flatten().fieldErrors });
    }

    const { email, name, firebaseUid, role } = parseResult.data;
    let user = await User.findOne({
      $or: [{ firebaseUid }, { email: email.toLowerCase() }],
    });

    let isNew = false;
    if (!user) {
      isNew = true;
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        firebaseUid,
        authProvider: 'firebase',
        role: role || 'owner',
      });
    } else {
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        user.authProvider = 'firebase';
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await SecurityEvent.create({
      eventType: isNew ? 'USER_REGISTERED' : 'USER_LOGIN',
      requesterId: user._id,
      requesterEmail: user.email,
      reason: `Firebase authentication (${user.role} role)`,
      simulatedResponseStatus: 'NONE',
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.flatten().fieldErrors });
    }

    const { name, email, password, role } = parseResult.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role || 'owner';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: userRole,
    });

    const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, env.JWT_SECRET, {
      expiresIn: '24h',
    });

    await SecurityEvent.create({
      eventType: 'USER_REGISTERED',
      requesterId: user._id,
      requesterEmail: user.email,
      reason: `New user account created (${user.role})`,
      simulatedResponseStatus: 'NONE',
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.flatten().fieldErrors });
    }

    const { email, password } = parseResult.data;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      await SecurityEvent.create({
        eventType: 'FAILED_LOGIN',
        requesterEmail: email,
        reason: 'User email not found',
        simulatedResponseStatus: 'NONE',
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'This account was authenticated with Firebase/Google. Please sign in with Firebase.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await SecurityEvent.create({
        eventType: 'FAILED_LOGIN',
        requesterId: user._id,
        requesterEmail: user.email,
        reason: 'Incorrect password entered',
        simulatedResponseStatus: 'NONE',
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, env.JWT_SECRET, {
      expiresIn: '24h',
    });

    await SecurityEvent.create({
      eventType: 'USER_LOGIN',
      requesterId: user._id,
      requesterEmail: user.email,
      reason: 'Successful user authentication',
      simulatedResponseStatus: 'NONE',
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function logout(req: Request, res: Response) {
  return res.json({ success: true, message: 'Logged out successfully.' });
}

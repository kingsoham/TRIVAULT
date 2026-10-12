import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'owner' | 'user' | 'admin';
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // 1. Try verifying with application JWT_SECRET
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
      return next();
    } catch (jwtErr) {
      // 2. If signature fails, check if this is a Firebase token
      const decodedUnverified: any = jwt.decode(token);
      if (decodedUnverified && (decodedUnverified.firebase || decodedUnverified.iss?.includes('securetoken.google.com'))) {
        const uid = decodedUnverified.user_id || decodedUnverified.sub;
        const email = decodedUnverified.email;

        if (uid || email) {
          const user = await User.findOne({
            $or: [{ firebaseUid: uid }, { email: email?.toLowerCase() }],
          });

          if (user) {
            req.user = {
              id: user._id.toString(),
              email: user.email,
              role: user.role,
            };
            return next();
          }
        }
      }
      throw jwtErr;
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

export function requireRole(allowedRoles: ('owner' | 'user' | 'admin')[] | ('owner' | 'user' | 'admin')) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!rolesArray.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions for this role.' });
    }
    next();
  };
}

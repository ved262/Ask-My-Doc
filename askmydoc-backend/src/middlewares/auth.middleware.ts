import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../types';

// Teach TypeScript that our middleware adds `userId` to Express's Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' } as ApiError);
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    if (typeof payload.userId !== 'string') {
      throw new Error('Invalid token payload');
    }

    req.userId = payload.userId;
    next();   // let the request continue to the controller
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' } as ApiError);
  }
};
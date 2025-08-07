import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';
import { errorResponse } from '../utils/helpers';
import { logger } from '../utils/logger';

// Extend Express Request type to include admin user
declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

/**
 * Middleware to authenticate admin users via JWT from HTTP-only cookie
 */
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies?.admin_token;
    
    if (!token) {
      res.status(401).json(errorResponse('Authentication required'));
      return;
    }
    
    if (!token) {
      res.status(401).json(errorResponse('JWT token is required'));
      return;
    }
    
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Verify that this is an admin token
    if (decoded.role !== 'admin') {
      res.status(403).json(errorResponse('Admin access required'));
      return;
    }
    
    // Attach admin info to request
    req.admin = decoded;
    next();
    
  } catch (error) {
    logger.error('Admin authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json(errorResponse('Invalid JWT token'));
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json(errorResponse('JWT token has expired'));
      return;
    }
    
    res.status(500).json(errorResponse('Authentication error'));
  }
}

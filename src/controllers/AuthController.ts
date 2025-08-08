import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { LoginRequest, CreateAdminRequest } from '../types';
import { successResponse, errorResponse } from '../utils/helpers';
import { logger } from '../utils/logger';

export class AuthController {
  /**
   * Admin login with HTTP-only cookie
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      
      const result = await AuthService.login(loginData);
      
      // Set HTTP-only cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
      };
      
      logger.debug('Setting cookie with options:', cookieOptions);
      res.cookie('admin_token', result.token, cookieOptions);
      
      res.json(successResponse({
        user: result.admin,
        message: 'Login successful'
      }));
      
    } catch (error) {
      logger.error('Login error:', error);
      
      if (error instanceof Error && error.message === 'Invalid credentials') {
        res.status(401).json(errorResponse('Invalid email or password'));
        return;
      }
      
      res.status(500).json(errorResponse('Login failed'));
    }
  }

  /**
   * Admin logout - clear HTTP-only cookie
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie('admin_token');
      res.json(successResponse({ message: 'Logout successful' }));
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json(errorResponse('Logout failed'));
    }
  }

  /**
   * Get current admin user info
   */
  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json(errorResponse('Not authenticated'));
        return;
      }

      // Get full admin details from database
      const admin = await AuthService.getAdminById(req.admin.id);
      
      if (!admin) {
        res.status(404).json(errorResponse('Admin not found'));
        return;
      }

      res.json(successResponse(admin));
    } catch (error) {
      logger.error('Get admin info error:', error);
      res.status(500).json(errorResponse('Failed to get admin info'));
    }
  }
  
  /**
   * Create admin user (super admin only)
   */
  static async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const adminData: CreateAdminRequest = req.body;
      
      const newAdmin = await AuthService.createAdmin(adminData);
      
      res.status(201).json(successResponse(newAdmin));
      
    } catch (error) {
      logger.error('Create admin error:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json(errorResponse(error.message));
        return;
      }
      
      res.status(500).json(errorResponse('Failed to create admin user'));
    }
  }
  
  /**
   * Get current admin profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json(errorResponse('Admin not authenticated'));
        return;
      }
      
      const admin = await AuthService.getAdminById(req.admin.id);
      
      if (!admin) {
        res.status(404).json(errorResponse('Admin not found'));
        return;
      }
      
      res.json(successResponse(admin));
      
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json(errorResponse('Failed to get admin profile'));
    }
  }
  
  /**
   * Refresh token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json(errorResponse('Admin not authenticated'));
        return;
      }
      
      // Get fresh admin data
      const admin = await AuthService.getAdminById(req.admin.id);
      
      if (!admin) {
        res.status(404).json(errorResponse('Admin not found'));
        return;
      }
      
      // Create new token with fresh data
      const result = await AuthService.login({
        email: admin.email,
        password: '' // This won't be used since we're not validating password
      });
      
      res.json(successResponse({
        token: result.token,
        admin: result.admin
      }));
      
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json(errorResponse('Failed to refresh token'));
    }
  }
}

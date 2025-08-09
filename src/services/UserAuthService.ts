import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';

interface UserJwtPayload {
  id: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export class UserAuthService {
  /**
   * Login with Google OAuth
   */
  static async loginWithGoogle(req: Request, res: Response): Promise<void> {
    try {
      const { id_token } = req.body;

      if (!id_token) {
        res.status(400).json({
          success: false,
          data: null,
          error: { message: 'Google ID token is required' }
        });
        return;
      }

      // Exchange Google ID token for Supabase session
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: id_token,
      });

      if (error) {
        logger.error('Google OAuth error:', error);
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'Invalid Google token' }
        });
        return;
      }

      if (!data.user) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'Failed to authenticate with Google' }
        });
        return;
      }

      // Create user record in our database if it doesn't exist
      await this.ensureUserExists(data.user);

      // Generate our own JWT for HTTP-only cookie
      const userPayload: UserJwtPayload = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.email || '',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      };

      const token = jwt.sign(userPayload, config.jwt.secret);

      // Set HTTP-only cookie
      res.cookie('user_token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      logger.info(`User logged in: ${data.user.email}`);

      res.json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: userPayload.name,
            avatar: data.user.user_metadata?.avatar_url
          }
        },
        error: null
      });

    } catch (error) {
      logger.error('User login error:', error);
      res.status(500).json({
        success: false,
        data: null,
        error: { message: 'Internal server error' }
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear the HTTP-only cookie
      res.clearCookie('user_token', {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/'
      });

      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
        error: null
      });

    } catch (error) {
      logger.error('User logout error:', error);
      res.status(500).json({
        success: false,
        data: null,
        error: { message: 'Internal server error' }
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'Not authenticated' }
        });
        return;
      }

      // Get additional user data from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        logger.error('Error fetching user data:', error);
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: userData?.avatar_url,
            created_at: userData?.created_at
          }
        },
        error: null
      });

    } catch (error) {
      logger.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        data: null,
        error: { message: 'Internal server error' }
      });
    }
  }

  /**
   * Ensure user exists in our database
   */
  private static async ensureUserExists(supabaseUser: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          provider: 'google',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        logger.error('Error upserting user:', error);
      }
    } catch (error) {
      logger.error('Error ensuring user exists:', error);
    }
  }

  /**
   * Verify user JWT token from cookie
   */
  static verifyUserToken(token: string): UserJwtPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as UserJwtPayload;
      return decoded;
    } catch (error) {
      logger.error('JWT verification error:', error);
      return null;
    }
  }
}

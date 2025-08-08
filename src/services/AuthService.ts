import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { supabase } from '../utils/supabase';
import { AdminUser, JwtPayload, LoginRequest, CreateAdminRequest } from '../types';
import { logger } from '../utils/logger';

export class AuthService {
  /**
   * Authenticate admin user
   */
  static async login(credentials: LoginRequest): Promise<{ token: string; admin: Omit<AdminUser, 'password_hash'> }> {
    const { email, password } = credentials;
    
    // Get admin user from database
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !admin) {
      logger.warn('Login attempt with invalid email:', email);
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password for email:', email);
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const payload = {
      id: admin.id,
      email: admin.email,
      role: 'admin' as const
    };
    
    const token = jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn
    } as jwt.SignOptions);
    
    logger.info('Admin user logged in successfully:', { email, id: admin.id });
    
    // Return token and admin info (without password hash)
    const { password_hash, ...adminWithoutPassword } = admin;
    
    return {
      token,
      admin: adminWithoutPassword
    };
  }
  
  /**
   * Create a new admin user
   */
  static async createAdmin(adminData: CreateAdminRequest): Promise<Omit<AdminUser, 'password_hash'>> {
    const { name, email, password } = adminData;
    
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingAdmin) {
      throw new Error('Admin user with this email already exists');
    }
    
    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Insert new admin user
    const { data: newAdmin, error } = await supabase
      .from('admin_users')
      .insert([{
        name,
        email,
        password_hash
      }])
      .select('id, name, email, created_at')
      .single();
    
    if (error || !newAdmin) {
      logger.error('Failed to create admin user:', error);
      throw new Error('Failed to create admin user');
    }
    
    logger.info('New admin user created:', { email, id: newAdmin.id });
    
    return newAdmin;
  }
  
  /**
   * Get admin user by ID
   */
  static async getAdminById(id: string): Promise<Omit<AdminUser, 'password_hash'> | null> {
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, username, email, full_name, role, is_active, last_login, created_at, updated_at')
      .eq('id', id)
      .single();
    
    if (error || !admin) {
      logger.debug('Failed to get admin by ID:', { id, error });
      return null;
    }
    
    return admin;
  }
  
  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { successResponse, errorResponse } from '../utils/helpers';
import { logger } from '../utils/logger';

export class DashboardController {
  /**
   * Get dashboard statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      // For now, return mock data since we might not have all tables set up
      const stats = {
        totalUsers: 1250,
        totalResellers: 45,
        totalInvitations: 3200,
        totalOrders: 890,
        monthlyRevenue: 24500,
        activeInvitations: 156,
        recentUsers: [
          { id: 1, name: 'John Doe', email: 'john@example.com', created_at: new Date().toISOString() },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: new Date().toISOString() },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: new Date().toISOString() },
        ],
        recentOrders: [
          { id: 1, user_name: 'Alice Wilson', plan_name: 'Premium Plan', amount: 99, created_at: new Date().toISOString() },
          { id: 2, user_name: 'Charlie Brown', plan_name: 'Basic Plan', amount: 49, created_at: new Date().toISOString() },
          { id: 3, user_name: 'Diana Davis', plan_name: 'Enterprise Plan', amount: 199, created_at: new Date().toISOString() },
        ],
      };

      res.json(successResponse(stats));
      
    } catch (error) {
      logger.error('Dashboard stats error:', error);
      res.status(500).json(errorResponse('Failed to load dashboard statistics'));
    }
  }
}

import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { successResponse, errorResponse, parsePaginationQuery } from '../utils/helpers';
import { logger } from '../utils/logger';

export class UserController {
  /**
   * Get paginated list of users
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const { search, reseller_id } = req.query as { search?: string; reseller_id?: string };
      
      const result = await UserService.getUsers({
        page,
        limit,
        search,
        reseller_id
      });
      
      res.json(successResponse(result.users, result.meta));
      
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json(errorResponse('Failed to fetch users'));
    }
  }
  
  /**
   * Get user by ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await UserService.getUserById(id);
      
      if (!user) {
        res.status(404).json(errorResponse('User not found'));
        return;
      }
      
      res.json(successResponse(user));
      
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json(errorResponse('Failed to fetch user'));
    }
  }
  
  /**
   * Get user statistics
   */
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await UserService.getUserStats();
      
      res.json(successResponse(stats));
      
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json(errorResponse('Failed to fetch user statistics'));
    }
  }
}

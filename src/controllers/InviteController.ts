import { Request, Response } from 'express';
import { InviteService } from '../services/InviteService';
import { successResponse, errorResponse, parsePaginationQuery } from '../utils/helpers';
import { logger } from '../utils/logger';

export class InviteController {
  /**
   * Get paginated list of invites
   */
  static async getInvites(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const { user_id, plan_id, template_id, type, is_published } = req.query as {
        user_id?: string;
        plan_id?: string;
        template_id?: string;
        type?: 'WEDDING' | 'BIRTHDAY' | 'PARTY' | 'CORPORATE' | 'OTHER';
        is_published?: string;
      };
      
      const result = await InviteService.getInvites({
        page,
        limit,
        user_id,
        plan_id,
        template_id,
        type,
        is_published: is_published === 'true' ? true : is_published === 'false' ? false : undefined
      });
      
      res.json(successResponse(result.invites, result.meta));
      
    } catch (error) {
      logger.error('Get invites error:', error);
      res.status(500).json(errorResponse('Failed to fetch invites'));
    }
  }
  
  /**
   * Get invite by ID
   */
  static async getInviteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const invite = await InviteService.getInviteById(id);
      
      if (!invite) {
        res.status(404).json(errorResponse('Invite not found'));
        return;
      }
      
      res.json(successResponse(invite));
      
    } catch (error) {
      logger.error('Get invite by ID error:', error);
      res.status(500).json(errorResponse('Failed to fetch invite'));
    }
  }
  
  /**
   * Get invite by slug
   */
  static async getInviteBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      
      const invite = await InviteService.getInviteBySlug(slug);
      
      if (!invite) {
        res.status(404).json(errorResponse('Invite not found'));
        return;
      }
      
      res.json(successResponse(invite));
      
    } catch (error) {
      logger.error('Get invite by slug error:', error);
      res.status(500).json(errorResponse('Failed to fetch invite'));
    }
  }
  
  /**
   * Delete invite (admin only)
   */
  static async deleteInvite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await InviteService.deleteInvite(id);
      
      res.json(successResponse({ message: 'Invite deleted successfully' }));
      
    } catch (error) {
      logger.error('Delete invite error:', error);
      res.status(500).json(errorResponse('Failed to delete invite'));
    }
  }
  
  /**
   * Get invite statistics
   */
  static async getInviteStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await InviteService.getInviteStats();
      
      res.json(successResponse(stats));
      
    } catch (error) {
      logger.error('Get invite stats error:', error);
      res.status(500).json(errorResponse('Failed to fetch invite statistics'));
    }
  }
}

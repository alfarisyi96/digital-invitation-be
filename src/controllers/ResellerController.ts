import { Request, Response } from 'express';
import { ResellerService } from '../services/ResellerService';
import { UpdateResellerRequest } from '../types';
import { successResponse, errorResponse, parsePaginationQuery } from '../utils/helpers';
import { logger } from '../utils/logger';

export class ResellerController {
  /**
   * Get paginated list of resellers
   */
  static async getResellers(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const { type, search } = req.query as { type?: 'FREE' | 'PREMIUM'; search?: string };
      
      const result = await ResellerService.getResellers({
        page,
        limit,
        type,
        search
      });
      
      res.json(successResponse(result.resellers, result.meta));
      
    } catch (error) {
      logger.error('Get resellers error:', error);
      res.status(500).json(errorResponse('Failed to fetch resellers'));
    }
  }
  
  /**
   * Get reseller by ID
   */
  static async getResellerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const reseller = await ResellerService.getResellerById(id);
      
      if (!reseller) {
        res.status(404).json(errorResponse('Reseller not found'));
        return;
      }
      
      res.json(successResponse(reseller));
      
    } catch (error) {
      logger.error('Get reseller by ID error:', error);
      res.status(500).json(errorResponse('Failed to fetch reseller'));
    }
  }
  
  /**
   * Create a new reseller
   */
  static async createReseller(req: Request, res: Response): Promise<void> {
    try {
      const resellerData = req.body;
      
      const newReseller = await ResellerService.createReseller(resellerData);
      
      res.status(201).json(successResponse(newReseller));
      
    } catch (error) {
      logger.error('Create reseller error:', error);
      
      if (error instanceof Error && error.message.includes('already a reseller')) {
        res.status(409).json(errorResponse(error.message));
        return;
      }
      
      res.status(500).json(errorResponse('Failed to create reseller'));
    }
  }
  
  /**
   * Update reseller
   */
  static async updateReseller(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateResellerRequest = req.body;
      
      const updatedReseller = await ResellerService.updateReseller(id, updateData);
      
      res.json(successResponse(updatedReseller));
      
    } catch (error) {
      logger.error('Update reseller error:', error);
      res.status(500).json(errorResponse('Failed to update reseller'));
    }
  }
  
  /**
   * Delete reseller
   */
  static async deleteReseller(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await ResellerService.deleteReseller(id);
      
      res.json(successResponse({ message: 'Reseller deleted successfully' }));
      
    } catch (error) {
      logger.error('Delete reseller error:', error);
      res.status(500).json(errorResponse('Failed to delete reseller'));
    }
  }
  
  /**
   * Get reseller by referral code
   */
  static async getResellerByReferralCode(req: Request, res: Response): Promise<void> {
    try {
      const { referral_code } = req.params;
      
      const reseller = await ResellerService.getResellerByReferralCode(referral_code);
      
      if (!reseller) {
        res.status(404).json(errorResponse('Reseller not found'));
        return;
      }
      
      res.json(successResponse(reseller));
      
    } catch (error) {
      logger.error('Get reseller by referral code error:', error);
      res.status(500).json(errorResponse('Failed to fetch reseller'));
    }
  }
}

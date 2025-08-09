import { Request, Response } from 'express';
import { InvitationService } from '../services/InvitationService';
import { CreateInvitationRequest, UpdateInvitationRequest, InvitationType, InvitationStatus } from '../types/invitation';
import { validateInvitationData, ValidationResult } from '../utils/validation';

export class InvitationController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { type, title, form_data } = req.body;
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'User authentication required' }
        });
        return;
      }

      // Validate invitation type
      if (!Object.values(InvitationType).includes(type)) {
        res.status(400).json({
          success: false,
          data: null,
          error: { message: 'Invalid invitation type' }
        });
        return;
      }

      // Validate form data structure
      const validationResult = validateInvitationData(type, form_data);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          data: null,
          error: { message: validationResult.errors.join(', ') }
        });
        return;
      }

      const data: CreateInvitationRequest = {
        type,
        title,
        form_data,
        template_id: req.body.template_id
      };

      // If template_id is provided, validate it exists
      if (data.template_id) {
        try {
          // Check template exists - this will throw if not found
          // await TemplateService.getById(data.template_id);
        } catch (templateError) {
          res.status(400).json({ 
            success: false,
            data: null,
            error: { message: 'Template not found' }
          });
          return;
        }

        // Validate template matches invitation type
        // if (template.type !== type) {
        //   return res.status(400).json({
        //     error: 'Template type does not match invitation type'
        //   });
        // }
      }

      const invitation = await InvitationService.create(user_id, data);

      res.status(201).json({
        success: true,
        data: invitation,
        error: null
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
      res.status(500).json({
        success: false,
        data: null,
        error: { message: 'Internal server error' }
      });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'User authentication required' }
        });
        return;
      }

      const invitation = await InvitationService.getById(id, user_id);

      res.json({
        success: true,
        data: invitation,
        error: null
      });
    } catch (error) {
      console.error('Error getting invitation:', error);
      res.status(404).json({
        success: false,
        data: null,
        error: { message: 'Invitation not found' }
      });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'User authentication required' }
        });
        return;
      }

      const updates: UpdateInvitationRequest = req.body;

      // Validate form data if provided
      if (updates.form_data) {
        try {
          // We need to get the current invitation to check its type for validation
          const currentInvitation = await InvitationService.getById(id, user_id);
          if (!currentInvitation) {
            res.status(404).json({
              success: false,
              data: null,
              error: { message: 'Invitation not found' }
            });
            return;
          }
          
          const validationResult = validateInvitationData(currentInvitation.type, updates.form_data);
          if (!validationResult.isValid) {
            res.status(400).json({
              success: false,
              data: null,
              error: { message: validationResult.errors.join(', ') }
            });
            return;
          }
        } catch (fetchError) {
          res.status(404).json({
            success: false,
            data: null,
            error: { message: 'Invitation not found' }
          });
          return;
        }
      }

      const invitation = await InvitationService.update(id, user_id, updates);

      res.json({
        success: true,
        data: invitation,
        error: null
      });
    } catch (error) {
      console.error('Error updating invitation:', error);
      if (error instanceof Error && error.message === 'Invitation not found') {
        res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Invitation not found' }
        });
        return;
      }
      res.status(500).json({
        success: false,
        data: null,
        error: { message: 'Internal server error' }
      });
    }
  }

  static async publish(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'User authentication required' }
        });
        return;
      }

      const invitation = await InvitationService.publish(id, user_id);

      res.json({
        success: true,
        data: invitation,
        error: null
      });
    } catch (error) {
      console.error('Error publishing invitation:', error);
      if (error instanceof Error && error.message === 'Invitation not found') {
        res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Invitation not found' }
        });
        return;
      }
      res.status(500).json({
        success: false,
        data: null,
        error: { message: 'Internal server error' }
      });
    }
  }

  static async unpublish(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'User authentication required' }
        });
        return;
      }

      const invitation = await InvitationService.unpublish(id, user_id);

      res.json({
        success: true,
        data: invitation,
        error: null
      });
    } catch (error) {
      console.error('Error unpublishing invitation:', error);
      if (error instanceof Error && error.message === 'Invitation not found') {
        res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Invitation not found' }
        });
        return;
      }
      res.status(500).json({
        success: false,
        data: null,
        error: { message: 'Internal server error' }
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'User authentication required' }
        });
        return;
      }

      await InvitationService.delete(id, user_id);

      res.status(204).json({
        success: true,
        data: null,
        error: null
      });
    } catch (error) {
      console.error('Error deleting invitation:', error);
      res.status(404).json({
        success: false,
        data: null,
        error: { message: 'Invitation not found' }
      });
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'User authentication required' }
        });
        return;
      }

      const filters = {
        type: req.query.type as InvitationType,
        status: req.query.status as InvitationStatus,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => 
        filters[key as keyof typeof filters] === undefined && delete filters[key as keyof typeof filters]
      );

      const result = await InvitationService.list(user_id, filters);

      res.json({
        success: true,
        data: result,
        error: null
      });
    } catch (error) {
      console.error('Error listing invitations:', error);
      res.status(500).json({
        success: false,
        data: null,
        error: { message: 'Internal server error' }
      });
    }
  }

  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'User authentication required' }
        });
        return;
      }

      const stats = await InvitationService.getStats(user_id);

      res.json({
        success: true,
        data: stats,
        error: null
      });
    } catch (error) {
      console.error('Error getting invitation stats:', error);
      res.status(500).json({
        success: false,
        data: null,
        error: { message: 'Internal server error' }
      });
    }
  }

  static async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      const invitation = await InvitationService.getBySlug(slug);

      res.json({
        success: true,
        data: invitation,
        error: null
      });
    } catch (error) {
      console.error('Error getting invitation by slug:', error);
      res.status(404).json({
        success: false,
        data: null,
        error: { message: 'Invitation not found' }
      });
    }
  }

  static async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'User authentication required' }
        });
        return;
      }

      const { title } = req.body;

      const duplicatedInvitation = await InvitationService.duplicate(id, user_id, title);

      res.status(201).json({
        success: true,
        data: duplicatedInvitation,
        error: null
      });
    } catch (error) {
      console.error('Error duplicating invitation:', error);
      res.status(404).json({
        success: false,
        data: null,
        error: { message: 'Invitation not found' }
      });
    }
  }
}

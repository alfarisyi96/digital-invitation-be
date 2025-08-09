import { Request, Response } from 'express';
import { TemplateService } from '../services/TemplateService';
import { InvitationType, TemplateStyle } from '../types/invitation';

export class TemplateController {
  /**
   * Get template by ID
   * GET /api/templates/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await TemplateService.getById(id);
      
      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  }

  /**
   * List templates with filtering and pagination
   * GET /api/templates
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = '1', 
        limit = '20',
        category,
        style,
        isPremium,
        search,
        sortBy = 'popularity'
      } = req.query;

      const options = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        category: category as InvitationType | 'all',
        style: style as TemplateStyle | 'all',
        isPremium: isPremium === 'true' ? true : isPremium === 'false' ? false : undefined,
        search: search as string,
        sortBy: sortBy as 'popularity' | 'newest' | 'name'
      };

      // Validate pagination
      if (options.page < 1 || options.limit < 1 || options.limit > 100) {
        res.status(400).json({ error: 'Invalid pagination parameters' });
        return;
      }

      // Validate category
      if (options.category && options.category !== 'all' && !Object.values(InvitationType).includes(options.category)) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      // Validate style
      if (options.style && options.style !== 'all' && !Object.values(TemplateStyle).includes(options.style)) {
        res.status(400).json({ error: 'Invalid style' });
        return;
      }

      const result = await TemplateService.list(options);
      res.json(result);
    } catch (error) {
      console.error('Error listing templates:', error);
      res.status(500).json({ error: 'Failed to list templates' });
    }
  }

  /**
   * Get popular templates
   * GET /api/templates/popular
   */
  static async getPopular(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '6' } = req.query;
      const limitNum = parseInt(limit as string, 10);

      if (limitNum < 1 || limitNum > 50) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }

      const templates = await TemplateService.getPopular(limitNum);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching popular templates:', error);
      res.status(500).json({ error: 'Failed to fetch popular templates' });
    }
  }

  /**
   * Get templates by category
   * GET /api/templates/category/:category
   */
  static async getByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const { limit } = req.query;

      // Validate category
      if (!Object.values(InvitationType).includes(category as InvitationType)) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      const limitNum = limit ? parseInt(limit as string, 10) : undefined;
      if (limitNum && (limitNum < 1 || limitNum > 100)) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }

      const templates = await TemplateService.getByCategory(category as InvitationType, limitNum);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      res.status(500).json({ error: 'Failed to fetch templates by category' });
    }
  }

  /**
   * Get premium templates
   * GET /api/templates/premium
   */
  static async getPremium(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : undefined;

      if (limitNum && (limitNum < 1 || limitNum > 100)) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }

      const templates = await TemplateService.getPremium(limitNum);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching premium templates:', error);
      res.status(500).json({ error: 'Failed to fetch premium templates' });
    }
  }

  /**
   * Search templates
   * GET /api/templates/search
   */
  static async search(req: Request, res: Response): Promise<void> {
    try {
      const { q, category, style, limit = '10' } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const options = {
        category: category as InvitationType,
        style: style as TemplateStyle,
        limit: parseInt(limit as string, 10)
      };

      if (options.limit < 1 || options.limit > 50) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }

      // Validate category if provided
      if (options.category && !Object.values(InvitationType).includes(options.category)) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      // Validate style if provided
      if (options.style && !Object.values(TemplateStyle).includes(options.style)) {
        res.status(400).json({ error: 'Invalid style' });
        return;
      }

      const templates = await TemplateService.search(q, options);
      res.json(templates);
    } catch (error) {
      console.error('Error searching templates:', error);
      res.status(500).json({ error: 'Failed to search templates' });
    }
  }

  /**
   * Get template categories with counts
   * GET /api/templates/categories
   */
  static async getCategoriesWithCounts(req: Request, res: Response): Promise<void> {
    try {
      const categories = await TemplateService.getCategoriesWithCounts();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  /**
   * Get template styles with counts
   * GET /api/templates/styles
   */
  static async getStylesWithCounts(req: Request, res: Response): Promise<void> {
    try {
      const styles = await TemplateService.getStylesWithCounts();
      res.json(styles);
    } catch (error) {
      console.error('Error fetching styles:', error);
      res.status(500).json({ error: 'Failed to fetch styles' });
    }
  }

  /**
   * Get related templates
   * GET /api/templates/:id/related
   */
  static async getRelated(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit = '4' } = req.query;

      const limitNum = parseInt(limit as string, 10);
      if (limitNum < 1 || limitNum > 20) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }

      const templates = await TemplateService.getRelated(id, limitNum);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching related templates:', error);
      res.status(500).json({ error: 'Failed to fetch related templates' });
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { errorResponse } from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request body using Zod schema
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        
        res.status(400).json(errorResponse(`Validation error: ${errorMessage}`));
        return;
      }
      
      logger.error('Body validation error:', error);
      res.status(500).json(errorResponse('Validation error'));
    }
  };
}

/**
 * Middleware to validate query parameters using Zod schema
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        
        res.status(400).json(errorResponse(`Query validation error: ${errorMessage}`));
        return;
      }
      
      logger.error('Query validation error:', error);
      res.status(500).json(errorResponse('Query validation error'));
    }
  };
}

/**
 * Middleware to validate route parameters using Zod schema
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        
        res.status(400).json(errorResponse(`Parameter validation error: ${errorMessage}`));
        return;
      }
      
      logger.error('Parameter validation error:', error);
      res.status(500).json(errorResponse('Parameter validation error'));
    }
  };
}

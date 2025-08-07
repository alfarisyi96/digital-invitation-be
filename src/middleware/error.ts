import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/helpers';

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Don't log the error if response was already sent
  if (res.headersSent) {
    return next(err);
  }

  // Send appropriate error response
  res.status(500).json(errorResponse('Internal server error'));
}

/**
 * 404 handler middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found:', {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json(errorResponse('Route not found'));
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed:', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });
  
  next();
}

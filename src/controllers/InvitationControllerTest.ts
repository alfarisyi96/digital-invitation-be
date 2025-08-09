import { Request, Response } from 'express';

export class InvitationController {
  static async create(req: Request, res: Response): Promise<void> {
    res.json({ message: 'Test endpoint' });
  }
}

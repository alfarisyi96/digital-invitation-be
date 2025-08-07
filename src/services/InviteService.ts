import { supabase } from '../utils/supabase';
import { Invite, User, Plan, Template } from '../types';
import { logger } from '../utils/logger';
import { calculatePagination } from '../utils/helpers';

export class InviteService {
  /**
   * Get paginated list of invites
   */
  static async getInvites(options: {
    page: number;
    limit: number;
    user_id?: string;
    plan_id?: string;
    template_id?: string;
    type?: 'WEDDING' | 'BIRTHDAY' | 'PARTY' | 'CORPORATE' | 'OTHER';
    is_published?: boolean;
  }): Promise<{ invites: (Invite & { user?: User; plan?: Plan; template?: Template })[]; meta: any }> {
    const { page, limit, user_id, plan_id, template_id, type, is_published } = options;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('invites')
      .select(`
        *,
        users(id, name, email),
        plans(id, name, type),
        templates(id, name, preview_url)
      `, { count: 'exact' });
    
    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    
    if (plan_id) {
      query = query.eq('plan_id', plan_id);
    }
    
    if (template_id) {
      query = query.eq('template_id', template_id);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (is_published !== undefined) {
      query = query.eq('is_published', is_published);
    }
    
    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    const { data: invites, error, count } = await query;
    
    if (error) {
      logger.error('Failed to fetch invites:', error);
      throw new Error('Failed to fetch invites');
    }
    
    const meta = calculatePagination(page, limit, count || 0);
    
    return { invites: invites || [], meta };
  }
  
  /**
   * Get invite by ID
   */
  static async getInviteById(id: string): Promise<(Invite & { user?: User; plan?: Plan; template?: Template }) | null> {
    const { data: invite, error } = await supabase
      .from('invites')
      .select(`
        *,
        users(id, name, email),
        plans(id, name, type, price),
        templates(id, name, preview_url, component_id)
      `)
      .eq('id', id)
      .single();
    
    if (error || !invite) {
      return null;
    }
    
    return invite;
  }
  
  /**
   * Get invite by slug
   */
  static async getInviteBySlug(slug: string): Promise<(Invite & { user?: User; plan?: Plan; template?: Template }) | null> {
    const { data: invite, error } = await supabase
      .from('invites')
      .select(`
        *,
        users(id, name, email),
        plans(id, name, type, price),
        templates(id, name, preview_url, component_id)
      `)
      .eq('slug', slug)
      .single();
    
    if (error || !invite) {
      return null;
    }
    
    return invite;
  }
  
  /**
   * Delete invite (admin only)
   */
  static async deleteInvite(id: string): Promise<void> {
    const { error } = await supabase
      .from('invites')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Failed to delete invite:', error);
      throw new Error('Failed to delete invite');
    }
    
    logger.info('Invite deleted by admin:', { id });
  }
  
  /**
   * Get invite analytics/stats
   */
  static async getInviteStats(): Promise<{
    totalInvites: number;
    publishedInvites: number;
    draftInvites: number;
    typeDistribution: Record<string, number>;
    recentInvites: number;
  }> {
    try {
      // Get total invites
      const { count: totalInvites } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true });
      
      // Get published invites
      const { count: publishedInvites } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);
      
      // Get draft invites
      const { count: draftInvites } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', false);
      
      // Get recent invites (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentInvites } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());
      
      // Get type distribution
      const { data: typeStats } = await supabase
        .from('invites')
        .select('type');
      
      const typeDistribution: Record<string, number> = {};
      typeStats?.forEach((invite: any) => {
        typeDistribution[invite.type] = (typeDistribution[invite.type] || 0) + 1;
      });
      
      return {
        totalInvites: totalInvites || 0,
        publishedInvites: publishedInvites || 0,
        draftInvites: draftInvites || 0,
        typeDistribution,
        recentInvites: recentInvites || 0
      };
      
    } catch (error) {
      logger.error('Failed to fetch invite stats:', error);
      throw new Error('Failed to fetch invite statistics');
    }
  }
}

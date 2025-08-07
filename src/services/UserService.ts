import { supabase } from '../utils/supabase';
import { User, Reseller, Invite, Plan, StatsResponse } from '../types';
import { logger } from '../utils/logger';
import { calculatePagination } from '../utils/helpers';

export class UserService {
  /**
   * Get paginated list of users
   */
  static async getUsers(options: {
    page: number;
    limit: number;
    search?: string;
    reseller_id?: string;
  }): Promise<{ users: User[]; meta: any }> {
    const { page, limit, search, reseller_id } = options;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (reseller_id) {
      query = query.eq('reseller_id', reseller_id);
    }
    
    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    const { data: users, error, count } = await query;
    
    if (error) {
      logger.error('Failed to fetch users:', error);
      throw new Error('Failed to fetch users');
    }
    
    const meta = calculatePagination(page, limit, count || 0);
    
    return { users: users || [], meta };
  }
  
  /**
   * Get user by ID with related data
   */
  static async getUserById(id: string): Promise<User & { invites?: Invite[]; reseller?: Reseller } | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        invites(*),
        resellers(*)
      `)
      .eq('id', id)
      .single();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  }
  
  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<StatsResponse> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      // Get total invites
      const { count: totalInvites } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true });
      
      // Get total resellers
      const { count: totalResellers } = await supabase
        .from('resellers')
        .select('*', { count: 'exact', head: true });
      
      // Get recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentSignups } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      // Get plan distribution
      const { data: planStats } = await supabase
        .from('invites')
        .select('plan_id, plans(name)')
        .not('plan_id', 'is', null);
      
      const planDistribution: Record<string, number> = {};
      planStats?.forEach((invite: any) => {
        const planName = invite.plans?.name || 'Unknown';
        planDistribution[planName] = (planDistribution[planName] || 0) + 1;
      });
      
      // Get reseller type distribution
      const { data: resellerStats } = await supabase
        .from('resellers')
        .select('type');
      
      const resellerTypeDistribution = {
        FREE: 0,
        PREMIUM: 0
      };
      
      resellerStats?.forEach((reseller: { type: 'FREE' | 'PREMIUM' }) => {
        if (reseller.type === 'FREE' || reseller.type === 'PREMIUM') {
          resellerTypeDistribution[reseller.type]++;
        }
      });
      
      return {
        totalUsers: totalUsers || 0,
        totalInvites: totalInvites || 0,
        totalResellers: totalResellers || 0,
        recentSignups: recentSignups || 0,
        planDistribution,
        resellerTypeDistribution
      };
      
    } catch (error) {
      logger.error('Failed to fetch user stats:', error);
      throw new Error('Failed to fetch user statistics');
    }
  }
}

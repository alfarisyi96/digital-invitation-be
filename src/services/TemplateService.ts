import { supabase } from '../utils/supabase';
import { 
  Template, 
  InvitationType, 
  TemplateStyle,
  TemplateListResponse
} from '../types/invitation';

export class TemplateService {
  private static readonly TABLE_NAME = 'templates';

  /**
   * Get template by ID
   */
  static async getById(id: string): Promise<Template | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw new Error('Failed to fetch template');
    }
  }

  /**
   * List templates with filtering and pagination
   */
  static async list(options: {
    page?: number;
    limit?: number;
    category?: InvitationType | 'all';
    style?: TemplateStyle | 'all';
    isPremium?: boolean;
    search?: string;
    sortBy?: 'popularity' | 'newest' | 'name';
  } = {}): Promise<TemplateListResponse> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category, 
        style, 
        isPremium, 
        search,
        sortBy = 'popularity'
      } = options;
      
      const offset = (page - 1) * limit;

      let query = supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .range(offset, offset + limit - 1);

      // Apply filters
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (style && style !== 'all') {
        query = query.eq('style', style);
      }

      if (isPremium !== undefined) {
        query = query.eq('is_premium', isPremium);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'popularity':
          query = query.order('popularity_score', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        templates: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error listing templates:', error);
      throw new Error('Failed to list templates');
    }
  }

  /**
   * Get popular templates
   */
  static async getPopular(limit: number = 6): Promise<Template[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('is_active', true)
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching popular templates:', error);
      throw new Error('Failed to fetch popular templates');
    }
  }

  /**
   * Get templates by category
   */
  static async getByCategory(category: InvitationType, limit?: number): Promise<Template[]> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('popularity_score', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      throw new Error('Failed to fetch templates by category');
    }
  }

  /**
   * Get premium templates
   */
  static async getPremium(limit?: number): Promise<Template[]> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('is_premium', true)
        .eq('is_active', true)
        .order('popularity_score', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching premium templates:', error);
      throw new Error('Failed to fetch premium templates');
    }
  }

  /**
   * Increment template usage count when used
   */
  static async incrementUsage(templateId: string): Promise<void> {
    try {
      // First get current usage count
      const { data: current, error: fetchError } = await supabase
        .from(this.TABLE_NAME)
        .select('usage_count')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // Update with incremented count
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({ 
          usage_count: (current?.usage_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing template usage:', error);
      // Don't throw error for analytics
    }
  }

  /**
   * Search templates
   */
  static async search(query: string, options: {
    category?: InvitationType;
    style?: TemplateStyle;
    limit?: number;
  } = {}): Promise<Template[]> {
    try {
      const { category, style, limit = 10 } = options;

      let searchQuery = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (category) {
        searchQuery = searchQuery.eq('category', category);
      }

      if (style) {
        searchQuery = searchQuery.eq('style', style);
      }

      const { data, error } = await searchQuery;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching templates:', error);
      throw new Error('Failed to search templates');
    }
  }

  /**
   * Get template categories with counts
   */
  static async getCategoriesWithCounts(): Promise<Array<{
    category: InvitationType;
    count: number;
    popular_template: Template | null;
  }>> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('category')
        .eq('is_active', true);

      if (error) throw error;

      // Count templates by category
      const categoryCounts = (data || []).reduce((acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get popular template for each category
      const categoriesWithCounts = await Promise.all(
        Object.entries(categoryCounts).map(async ([category, count]) => {
          const popularTemplates = await this.getByCategory(category as InvitationType, 1);
          return {
            category: category as InvitationType,
            count,
            popular_template: popularTemplates[0] || null
          };
        })
      );

      return categoriesWithCounts;
    } catch (error) {
      console.error('Error getting categories with counts:', error);
      throw new Error('Failed to get categories with counts');
    }
  }

  /**
   * Get template styles with counts
   */
  static async getStylesWithCounts(): Promise<Array<{
    style: TemplateStyle;
    count: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('style')
        .eq('is_active', true);

      if (error) throw error;

      // Count templates by style
      const styleCounts = (data || []).reduce((acc, template) => {
        acc[template.style] = (acc[template.style] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(styleCounts).map(([style, count]) => ({
        style: style as TemplateStyle,
        count
      }));
    } catch (error) {
      console.error('Error getting styles with counts:', error);
      throw new Error('Failed to get styles with counts');
    }
  }

  /**
   * Get related templates (same category, different style)
   */
  static async getRelated(templateId: string, limit: number = 4): Promise<Template[]> {
    try {
      // First get the current template
      const currentTemplate = await this.getById(templateId);
      if (!currentTemplate) return [];

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('category', currentTemplate.category)
        .neq('id', templateId)
        .eq('is_active', true)
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching related templates:', error);
      throw new Error('Failed to fetch related templates');
    }
  }
}

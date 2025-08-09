import { supabase } from '../utils/supabase';
import { 
  Invitation, 
  CreateInvitationRequest, 
  UpdateInvitationRequest, 
  PublishInvitationRequest,
  InvitationFormData,
  InvitationType,
  InvitationStatus,
  InvitationListResponse,
  InvitationStatsResponse
} from '../types/invitation';

export class InvitationService {
  private static readonly TABLE_NAME = 'invitations';

  /**
   * Create a new invitation
   */
  static async create(userId: string, data: CreateInvitationRequest): Promise<Invitation> {
    try {
      // Generate slug based on invitation type and form data
      const slug = await this.generateSlug(data.type, data.form_data);
      
      // Extract common fields from form data for easier querying
      const eventDate = this.extractEventDate(data.type, data.form_data);
      const venueName = this.extractVenueName(data.type, data.form_data);
      const venueAddress = this.extractVenueAddress(data.type, data.form_data);

      const invitation = {
        user_id: userId,
        title: data.title,
        type: data.type,
        template_id: data.template_id || null,
        form_data: data.form_data,
        event_date: eventDate,
        venue_name: venueName,
        venue_address: venueAddress,
        slug,
        status: InvitationStatus.DRAFT,
        is_published: false,
        rsvp_enabled: true,
        guest_can_invite_others: false,
        require_approval: false,
        view_count: 0,
        unique_view_count: 0,
        rsvp_count: 0,
        confirmed_count: 0
      };

      const { data: result, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(invitation)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw new Error('Failed to create invitation');
    }
  }

  /**
   * Get invitation by ID
   */
  static async getById(id: string, userId?: string): Promise<Invitation | null> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id);

      // If userId is provided, ensure the invitation belongs to the user
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw new Error('Failed to fetch invitation');
    }
  }

  /**
   * Get invitation by slug (for public access)
   */
  static async getBySlug(slug: string): Promise<Invitation | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      // Track view
      await this.trackView(data.id);

      return data;
    } catch (error) {
      console.error('Error fetching invitation by slug:', error);
      throw new Error('Failed to fetch invitation');
    }
  }

  /**
   * Update invitation
   */
  static async update(id: string, userId: string, data: UpdateInvitationRequest): Promise<Invitation> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.title) updateData.title = data.title;
      if (data.status) updateData.status = data.status;
      if (data.template_customization) updateData.template_customization = data.template_customization;

      // If form_data is being updated, merge with existing data and update extracted fields
      if (data.form_data) {
        const existing = await this.getById(id, userId);
        if (!existing) throw new Error('Invitation not found');

        const mergedFormData = { ...existing.form_data, ...data.form_data };
        updateData.form_data = mergedFormData;

        // Update extracted fields
        updateData.event_date = this.extractEventDate(existing.type, mergedFormData);
        updateData.venue_name = this.extractVenueName(existing.type, mergedFormData);
        updateData.venue_address = this.extractVenueAddress(existing.type, mergedFormData);
      }

      const { data: result, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error updating invitation:', error);
      throw new Error('Failed to update invitation');
    }
  }

  /**
   * Publish invitation
   */
  static async publish(id: string, userId: string, data: PublishInvitationRequest = {}): Promise<Invitation> {
    try {
      const updateData = {
        status: InvitationStatus.PUBLISHED,
        is_published: true,
        published_at: new Date().toISOString(),
        expires_at: data.expires_at || null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error publishing invitation:', error);
      throw new Error('Failed to publish invitation');
    }
  }

  /**
   * Unpublish invitation
   */
  static async unpublish(id: string, userId: string): Promise<Invitation> {
    try {
      const updateData = {
        status: InvitationStatus.DRAFT,
        is_published: false,
        published_at: null,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error unpublishing invitation:', error);
      throw new Error('Failed to unpublish invitation');
    }
  }

  /**
   * Delete invitation
   */
  static async delete(id: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw new Error('Failed to delete invitation');
    }
  }

  /**
   * List user's invitations with pagination and filtering
   */
  static async list(
    userId: string, 
    options: {
      page?: number;
      limit?: number;
      type?: InvitationType;
      status?: InvitationStatus;
      search?: string;
    } = {}
  ): Promise<InvitationListResponse> {
    try {
      const { page = 1, limit = 10, type, status, search } = options;
      const offset = (page - 1) * limit;

      let query = supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      if (search) {
        query = query.or(`title.ilike.%${search}%,venue_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        invitations: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error listing invitations:', error);
      throw new Error('Failed to list invitations');
    }
  }

  /**
   * Get user invitation statistics
   */
  static async getStats(userId: string): Promise<InvitationStatsResponse> {
    try {
      // Get invitation counts by status
      const { data: statusCounts, error: statusError } = await supabase
        .from(this.TABLE_NAME)
        .select('status')
        .eq('user_id', userId);

      if (statusError) throw statusError;

      // Get total views and RSVPs
      const { data: metrics, error: metricsError } = await supabase
        .from(this.TABLE_NAME)
        .select('view_count, rsvp_count')
        .eq('user_id', userId);

      if (metricsError) throw metricsError;

      // Calculate statistics
      const totalInvitations = statusCounts?.length || 0;
      const publishedInvitations = statusCounts?.filter(i => i.status === 'published').length || 0;
      const draftInvitations = statusCounts?.filter(i => i.status === 'draft').length || 0;
      const totalViews = metrics?.reduce((sum, m) => sum + (m.view_count || 0), 0) || 0;
      const totalRsvps = metrics?.reduce((sum, m) => sum + (m.rsvp_count || 0), 0) || 0;

      // Get recent activity (simplified for now)
      const recentActivity = [
        {
          type: 'info',
          message: `You have ${totalInvitations} total invitations`,
          timestamp: new Date().toISOString()
        }
      ];

      return {
        total_invitations: totalInvitations,
        published_invitations: publishedInvitations,
        draft_invitations: draftInvitations,
        total_views: totalViews,
        total_rsvps: totalRsvps,
        recent_activity: recentActivity
      };
    } catch (error) {
      console.error('Error getting invitation stats:', error);
      throw new Error('Failed to get invitation statistics');
    }
  }

  /**
   * Track invitation view
   */
  private static async trackView(invitationId: string): Promise<void> {
    try {
      // First get current view count
      const { data: current, error: fetchError } = await supabase
        .from(this.TABLE_NAME)
        .select('view_count')
        .eq('id', invitationId)
        .single();

      if (fetchError) throw fetchError;

      // Update with incremented count
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({ 
          view_count: (current?.view_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking view:', error);
      // Don't throw error for analytics
    }
  }

  /**
   * Generate unique slug for invitation
   */
  private static async generateSlug(type: InvitationType, formData: Partial<InvitationFormData>): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('generate_invitation_slug', {
          invitation_type: type,
          form_data: formData
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating slug:', error);
      // Fallback to simple slug generation
      const timestamp = Date.now();
      return `${type}-invitation-${timestamp}`;
    }
  }

  /**
   * Extract event date from form data based on invitation type
   */
  private static extractEventDate(type: InvitationType, formData: Partial<InvitationFormData>): string | null {
    try {
      switch (type) {
        case InvitationType.WEDDING:
          return (formData as any)?.eventDate || null;
        case InvitationType.BIRTHDAY:
          return (formData as any)?.partyDate || null;
        case InvitationType.GRADUATION:
          return (formData as any)?.graduationDate || null;
        case InvitationType.BABY_SHOWER:
          return (formData as any)?.partyDate || null;
        case InvitationType.BUSINESS:
          return (formData as any)?.eventDate || null;
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Extract venue name from form data based on invitation type
   */
  private static extractVenueName(type: InvitationType, formData: Partial<InvitationFormData>): string | null {
    try {
      return (formData as any)?.venueName || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract venue address from form data based on invitation type
   */
  private static extractVenueAddress(type: InvitationType, formData: Partial<InvitationFormData>): string | null {
    try {
      return (formData as any)?.venueAddress || null;
    } catch {
      return null;
    }
  }

  /**
   * Duplicate an invitation with new title
   */
  static async duplicate(invitationId: string, userId: string, newTitle?: string): Promise<Invitation> {
    try {
      // Get the original invitation
      const originalInvitation = await this.getById(invitationId, userId);
      if (!originalInvitation) {
        throw new Error('Invitation not found');
      }

      // Create new invitation data
      const newInvitationData: CreateInvitationRequest = {
        type: originalInvitation.type,
        title: newTitle || `${originalInvitation.title} (Copy)`,
        form_data: originalInvitation.form_data,
        template_id: originalInvitation.template_id || undefined
      };

      // Create the duplicate invitation
      const duplicatedInvitation = await this.create(userId, newInvitationData);

      console.log(`Invitation duplicated: ${invitationId} -> ${duplicatedInvitation.id} by user ${userId}`);
      return duplicatedInvitation;

    } catch (error) {
      console.error('Error duplicating invitation:', error);
      throw error;
    }
  }
}

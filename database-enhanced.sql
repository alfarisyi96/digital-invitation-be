-- Enhanced Invitation Database Schema for Multi-Type Support
-- This script updates the existing schema to support dynamic invitation types

-- Drop existing tables that will be restructured
DROP TABLE IF EXISTS invite_guests CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

-- Create enhanced enum types
DO $$ BEGIN
    CREATE TYPE invitation_type AS ENUM ('wedding', 'birthday', 'graduation', 'baby_shower', 'business', 'anniversary', 'party');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('draft', 'published', 'archived', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE template_style AS ENUM ('classic', 'modern', 'elegant', 'floral', 'minimalist', 'rustic', 'vintage', 'tropical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhanced templates table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    preview_url VARCHAR(500),
    
    -- Template categorization
    category invitation_type NOT NULL,
    style template_style NOT NULL,
    
    -- Template data and configuration
    template_data JSONB NOT NULL, -- HTML/CSS template structure
    default_config JSONB, -- Default configuration for the template
    supported_fields JSONB, -- List of supported form fields for this template
    
    -- Pricing and availability
    is_premium BOOLEAN DEFAULT false,
    price DECIMAL(10,2) DEFAULT 0.00,
    
    -- Popularity and metrics
    popularity_score INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    
    -- Features and tags
    features TEXT[], -- Array of feature strings
    tags TEXT[], -- Array of tag strings for search
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES admin_users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced invitations table (replaces invites)
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id),
    
    -- Basic invitation info
    title VARCHAR(255) NOT NULL,
    type invitation_type NOT NULL,
    status invitation_status DEFAULT 'draft',
    
    -- Dynamic form data (JSON structure varies by type)
    form_data JSONB NOT NULL,
    
    -- Common extracted fields for easier querying
    event_date TIMESTAMPTZ,
    venue_name VARCHAR(255),
    venue_address TEXT,
    
    -- Template customization
    template_customization JSONB, -- Custom colors, fonts, layout preferences
    
    -- Publishing and sharing
    slug VARCHAR(255) UNIQUE, -- For public URL: invite.app/wedding/sarah-john-2024
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Settings
    rsvp_enabled BOOLEAN DEFAULT true,
    rsvp_deadline TIMESTAMPTZ,
    guest_can_invite_others BOOLEAN DEFAULT false,
    require_approval BOOLEAN DEFAULT false,
    
    -- Analytics and metrics
    view_count INTEGER DEFAULT 0,
    unique_view_count INTEGER DEFAULT 0,
    rsvp_count INTEGER DEFAULT 0,
    confirmed_count INTEGER DEFAULT 0,
    
    -- SEO and sharing
    meta_title VARCHAR(255),
    meta_description TEXT,
    og_image_url VARCHAR(500),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest responses table (replaces invite_guests)
CREATE TABLE invitation_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    
    -- Guest information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- RSVP response
    response VARCHAR(20) DEFAULT 'pending', -- 'pending', 'attending', 'not_attending', 'maybe'
    response_data JSONB, -- Additional response data (meal choice, plus ones, etc.)
    
    -- Additional guests brought
    plus_ones_count INTEGER DEFAULT 0,
    plus_ones_details JSONB, -- Details of additional guests
    
    -- Engagement tracking
    invitation_opened_at TIMESTAMPTZ,
    response_submitted_at TIMESTAMPTZ,
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent_at TIMESTAMPTZ,
    
    -- Contact preferences
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitation analytics table for detailed tracking
CREATE TABLE invitation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    
    -- Event tracking
    event_type VARCHAR(50) NOT NULL, -- 'view', 'rsvp', 'share', 'download', etc.
    event_data JSONB, -- Additional event data
    
    -- Session and device info
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    referrer VARCHAR(500),
    
    -- Geographic data
    country VARCHAR(2),
    city VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media files table for invitation assets
CREATE TABLE invitation_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    
    -- File information
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'audio', 'video', 'document'
    mime_type VARCHAR(100),
    file_size BIGINT,
    
    -- Media metadata
    media_type VARCHAR(50), -- 'hero_image', 'gallery', 'background_music', 'attachment'
    display_order INTEGER DEFAULT 0,
    alt_text VARCHAR(255),
    
    -- Processing status
    is_processed BOOLEAN DEFAULT false,
    thumbnail_path VARCHAR(500),
    compressed_path VARCHAR(500),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_invitations_user_id ON invitations(user_id);
CREATE INDEX idx_invitations_type ON invitations(type);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_slug ON invitations(slug);
CREATE INDEX idx_invitations_published ON invitations(is_published, published_at);
CREATE INDEX idx_invitations_event_date ON invitations(event_date);

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_style ON templates(style);
CREATE INDEX idx_templates_premium ON templates(is_premium);
CREATE INDEX idx_templates_active ON templates(is_active);
CREATE INDEX idx_templates_popularity ON templates(popularity_score DESC);

CREATE INDEX idx_invitation_guests_invitation_id ON invitation_guests(invitation_id);
CREATE INDEX idx_invitation_guests_response ON invitation_guests(response);
CREATE INDEX idx_invitation_guests_email ON invitation_guests(email);

CREATE INDEX idx_invitation_analytics_invitation_id ON invitation_analytics(invitation_id);
CREATE INDEX idx_invitation_analytics_event_type ON invitation_analytics(event_type);
CREATE INDEX idx_invitation_analytics_created_at ON invitation_analytics(created_at);

CREATE INDEX idx_invitation_media_invitation_id ON invitation_media(invitation_id);
CREATE INDEX idx_invitation_media_type ON invitation_media(media_type);

-- Apply updated_at triggers
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitation_guests_updated_at BEFORE UPDATE ON invitation_guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_invitation_slug(invitation_type TEXT, form_data JSONB)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Generate base slug based on invitation type and data
    CASE invitation_type
        WHEN 'wedding' THEN
            base_slug := LOWER(
                COALESCE(form_data->>'brideName', 'bride') || '-' || 
                COALESCE(form_data->>'groomName', 'groom') || '-wedding'
            );
        WHEN 'birthday' THEN
            base_slug := LOWER(
                COALESCE(form_data->>'celebrantName', 'birthday') || '-birthday-' ||
                COALESCE(form_data->>'age', 'party')
            );
        WHEN 'graduation' THEN
            base_slug := LOWER(
                COALESCE(form_data->>'graduateName', 'graduate') || '-graduation'
            );
        ELSE
            base_slug := invitation_type || '-invitation';
    END CASE;
    
    -- Clean up slug
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9-]', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Ensure uniqueness
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM invitations WHERE slug = final_slug) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to update invitation analytics
CREATE OR REPLACE FUNCTION track_invitation_event(
    inv_id UUID,
    event_type TEXT,
    event_data JSONB DEFAULT NULL,
    session_id TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO invitation_analytics (
        invitation_id,
        event_type,
        event_data,
        session_id,
        user_agent,
        ip_address
    ) VALUES (
        inv_id,
        event_type,
        event_data,
        session_id,
        user_agent,
        ip_address
    );
    
    -- Update invitation counters
    CASE event_type
        WHEN 'view' THEN
            UPDATE invitations 
            SET view_count = view_count + 1 
            WHERE id = inv_id;
        WHEN 'rsvp' THEN
            UPDATE invitations 
            SET rsvp_count = rsvp_count + 1 
            WHERE id = inv_id;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Insert sample templates
INSERT INTO templates (name, description, category, style, template_data, supported_fields, is_premium, features, tags) VALUES 
(
    'Elegant Rose Wedding',
    'A beautiful wedding invitation with rose gold accents and elegant typography',
    'wedding',
    'elegant',
    '{"layout": "classic", "colors": {"primary": "#d4af37", "secondary": "#f5f5f5"}}',
    '["groomName", "brideName", "eventDate", "venue", "parents", "story", "timeline"]',
    false,
    ARRAY['Photo Gallery', 'RSVP Form', 'Timeline', 'Music Player'],
    ARRAY['wedding', 'elegant', 'rose', 'romantic', 'classic']
),
(
    'Modern Birthday Celebration',
    'Contemporary birthday invitation with vibrant colors and modern design',
    'birthday',
    'modern',
    '{"layout": "modern", "colors": {"primary": "#ff6b6b", "secondary": "#4ecdc4"}}',
    '["celebrantName", "age", "partyDate", "venue", "theme", "activities"]',
    false,
    ARRAY['Photo Upload', 'RSVP Form', 'Gift Registry', 'Activities List'],
    ARRAY['birthday', 'modern', 'colorful', 'fun', 'celebration']
),
(
    'Classic Graduation Honor',
    'Traditional graduation invitation with academic theme and formal styling',
    'graduation',
    'classic',
    '{"layout": "formal", "colors": {"primary": "#1a237e", "secondary": "#gold"}}',
    '["graduateName", "degree", "school", "ceremonyDate", "venue", "achievements"]',
    false,
    ARRAY['Achievement Showcase', 'RSVP Form', 'Photo Gallery', 'Reception Details'],
    ARRAY['graduation', 'classic', 'academic', 'formal', 'achievement']
);

-- Insert sample data for testing
INSERT INTO users (email, full_name, phone) VALUES 
('test@example.com', 'Test User', '+1234567890');

-- Get the user ID for sample invitation
DO $$
DECLARE
    test_user_id UUID;
    wedding_template_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE email = 'test@example.com' LIMIT 1;
    SELECT id INTO wedding_template_id FROM templates WHERE category = 'wedding' LIMIT 1;
    
    IF test_user_id IS NOT NULL AND wedding_template_id IS NOT NULL THEN
        INSERT INTO invitations (
            user_id,
            template_id,
            title,
            type,
            form_data,
            event_date,
            venue_name,
            slug
        ) VALUES (
            test_user_id,
            wedding_template_id,
            'Sarah & John Wedding',
            'wedding',
            '{"groomName": "John Doe", "brideName": "Sarah Smith", "eventDate": "2024-08-15", "venue": "Grand Ballroom", "story": "We met in college..."}',
            '2024-08-15 16:00:00+00',
            'Grand Ballroom Hotel',
            'sarah-john-wedding'
        );
    END IF;
END $$;

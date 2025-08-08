-- Invitation Admin Backend Database Schema
-- Run this script in Supabase Studio SQL Editor after starting local Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE invite_status AS ENUM ('draft', 'sent', 'viewed', 'confirmed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create resellers table
CREATE TABLE IF NOT EXISTS resellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    company_name VARCHAR(255),
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    reseller_id UUID REFERENCES resellers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    features JSONB,
    max_invites INTEGER,
    max_templates INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    template_data JSONB NOT NULL,
    category VARCHAR(50),
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id),
    title VARCHAR(255) NOT NULL,
    event_date TIMESTAMPTZ,
    venue VARCHAR(500),
    custom_data JSONB,
    status invite_status DEFAULT 'draft',
    views_count INTEGER DEFAULT 0,
    confirmations_count INTEGER DEFAULT 0,
    share_url VARCHAR(500) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),
    reseller_id UUID REFERENCES resellers(id),
    amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invite_guests table
CREATE TABLE IF NOT EXISTS invite_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invite_id UUID NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reseller_id ON users(reseller_id);
CREATE INDEX IF NOT EXISTS idx_invites_user_id ON invites(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_invite_guests_invite_id ON invite_guests(invite_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resellers_updated_at BEFORE UPDATE ON resellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invites_updated_at BEFORE UPDATE ON invites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: 'admin123')
INSERT INTO admin_users (username, email, password_hash, full_name, role) 
VALUES (
    'admin',
    'admin@invitation.com',
    '$2b$12$TwUR.t.Y1k4Ldh6ZFCtPV.9bdtuf6UM2tZvTKnunnQSf7woLsxUdW',
    'System Administrator',
    'super_admin'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample plans
INSERT INTO plans (name, description, price, max_invites, max_templates, features) VALUES
('Basic', 'Perfect for small events', 9.99, 50, 3, '{"custom_domain": false, "analytics": false, "support": "email"}'),
('Pro', 'Great for medium events', 19.99, 200, 10, '{"custom_domain": true, "analytics": true, "support": "priority"}'),
('Premium', 'Ultimate for large events', 39.99, -1, -1, '{"custom_domain": true, "analytics": true, "support": "phone", "white_label": true}')
ON CONFLICT DO NOTHING;

-- Insert sample templates
INSERT INTO templates (name, description, category, template_data, is_premium) VALUES
('Classic Wedding', 'Elegant wedding invitation template', 'wedding', '{"background": "white", "font": "serif", "color_scheme": "gold"}', false),
('Modern Birthday', 'Contemporary birthday invitation', 'birthday', '{"background": "colorful", "font": "sans-serif", "color_scheme": "rainbow"}', false),
('Corporate Event', 'Professional event invitation', 'corporate', '{"background": "dark", "font": "modern", "color_scheme": "blue"}', true)
ON CONFLICT DO NOTHING;

-- Create RLS (Row Level Security) policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Admin users can access everything
CREATE POLICY "Admin full access" ON admin_users FOR ALL USING (true);
CREATE POLICY "Admin access to resellers" ON resellers FOR ALL USING (true);
CREATE POLICY "Admin access to users" ON users FOR ALL USING (true);
CREATE POLICY "Admin access to invites" ON invites FOR ALL USING (true);
CREATE POLICY "Admin access to orders" ON orders FOR ALL USING (true);

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can access own invites" ON invites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own orders" ON orders FOR ALL USING (auth.uid() = user_id);

-- Public access to templates and plans
CREATE POLICY "Public read access to templates" ON templates FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to plans" ON plans FOR SELECT USING (is_active = true);

COMMENT ON TABLE admin_users IS 'Admin users who can access the admin dashboard';
COMMENT ON TABLE resellers IS 'Reseller partners who can sell invitations';
COMMENT ON TABLE users IS 'End users who create invitations';
COMMENT ON TABLE plans IS 'Subscription plans available to users';
COMMENT ON TABLE templates IS 'Invitation templates available to users';
COMMENT ON TABLE invites IS 'User-created invitations';
COMMENT ON TABLE orders IS 'Purchase orders for plans and services';
COMMENT ON TABLE invite_guests IS 'Guests for each invitation';

-- Create views for analytics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE reseller_id IS NOT NULL) as reseller_users
FROM users;

CREATE OR REPLACE VIEW invite_stats AS
SELECT 
    COUNT(*) as total_invites,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_invites_30d,
    COUNT(*) FILTER (WHERE status = 'sent') as sent_invites,
    SUM(views_count) as total_views,
    SUM(confirmations_count) as total_confirmations
FROM invites;

CREATE OR REPLACE VIEW order_stats AS
SELECT 
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_orders_30d,
    SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
    AVG(amount) FILTER (WHERE status = 'completed') as average_order_value
FROM orders;

COMMENT ON VIEW user_stats IS 'User statistics for admin dashboard';
COMMENT ON VIEW invite_stats IS 'Invitation statistics for admin dashboard';
COMMENT ON VIEW order_stats IS 'Order and revenue statistics for admin dashboard';

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON SCHEMA public IS 'Invitation Admin Backend Database Schema - Local Development';

-- Function to automatically generate unique referral codes for resellers
CREATE OR REPLACE FUNCTION generate_referral_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    is_unique BOOLEAN := FALSE;
BEGIN
    WHILE NOT is_unique LOOP
        result := '';
        FOR i IN 1..length LOOP
            result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
        END LOOP;
        
        -- Check if the code is unique
        SELECT NOT EXISTS(SELECT 1 FROM resellers WHERE referral_code = result) INTO is_unique;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate referral code for new resellers
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the referral code trigger to resellers table
DO $$ 
BEGIN
    -- Drop trigger if it exists to avoid conflicts
    DROP TRIGGER IF EXISTS trigger_set_referral_code ON resellers;
    
    -- Create the trigger
    CREATE TRIGGER trigger_set_referral_code
        BEFORE INSERT ON resellers
        FOR EACH ROW
        EXECUTE FUNCTION set_referral_code();
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if table doesn't exist yet
        NULL;
END $$;

-- Additional helper functions for the admin backend
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'users', (SELECT json_build_object(
            'total', COALESCE((SELECT total_users FROM user_stats), 0),
            'new_30d', COALESCE((SELECT new_users_30d FROM user_stats), 0),
            'active', COALESCE((SELECT active_users FROM user_stats), 0),
            'with_reseller', COALESCE((SELECT reseller_users FROM user_stats), 0)
        )),
        'invites', (SELECT json_build_object(
            'total', COALESCE((SELECT total_invites FROM invite_stats), 0),
            'new_30d', COALESCE((SELECT new_invites_30d FROM invite_stats), 0),
            'sent', COALESCE((SELECT sent_invites FROM invite_stats), 0),
            'total_views', COALESCE((SELECT total_views FROM invite_stats), 0),
            'total_confirmations', COALESCE((SELECT total_confirmations FROM invite_stats), 0)
        )),
        'orders', (SELECT json_build_object(
            'total', COALESCE((SELECT total_orders FROM order_stats), 0),
            'new_30d', COALESCE((SELECT new_orders_30d FROM order_stats), 0),
            'total_revenue', COALESCE((SELECT total_revenue FROM order_stats), 0),
            'avg_order_value', COALESCE((SELECT average_order_value FROM order_stats), 0)
        ))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_dashboard_stats() IS 'Get comprehensive dashboard statistics for admin backend';

SELECT 'Database schema setup complete! 🎉' as status;

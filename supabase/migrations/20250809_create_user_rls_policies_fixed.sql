-- Create user_profiles table for Supabase Auth users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add user_id column to existing tables that don't have it
DO $$
BEGIN
  -- Add user_id to templates if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'user_id') THEN
    ALTER TABLE public.templates ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
  
  -- Add is_public to templates if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'is_public') THEN
    ALTER TABLE public.templates ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;
  
  -- Update invites to reference auth.users instead of public.users
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invites' AND column_name = 'user_id') THEN
    -- Drop existing foreign key constraint
    ALTER TABLE public.invites DROP CONSTRAINT IF EXISTS invites_user_id_fkey;
    -- Add new foreign key to auth.users
    ALTER TABLE public.invites ADD CONSTRAINT invites_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Update invite_guests to use UUID if not already
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invite_guests' AND column_name = 'invite_id' AND data_type = 'uuid') THEN
    -- Already UUID, no change needed
    NULL;
  END IF;
END
$$;

-- Enable RLS on new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_guests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can access own invites" ON public.invites;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can access own orders" ON public.orders;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for invites (using auth.users)
CREATE POLICY "Users can view own invites" ON public.invites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invites" ON public.invites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invites" ON public.invites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invites" ON public.invites
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for invite_guests
CREATE POLICY "Users can view guests of own invites" ON public.invite_guests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invites 
      WHERE invites.id = invite_guests.invite_id 
      AND invites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage guests of own invites" ON public.invite_guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invites 
      WHERE invites.id = invite_guests.invite_id 
      AND invites.user_id = auth.uid()
    )
  );

-- Create RLS policies for templates
CREATE POLICY "Users can view public templates and own templates" ON public.templates
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON public.templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.templates
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger for user_profiles
CREATE OR REPLACE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON public.templates(is_public);

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

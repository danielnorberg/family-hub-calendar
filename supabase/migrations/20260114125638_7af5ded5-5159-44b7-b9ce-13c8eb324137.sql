-- Create role enum for family members
CREATE TYPE public.family_role AS ENUM ('parent', 'child');

-- Create event category table for color-coded categories
CREATE TABLE public.event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create families table
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Family',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create family members table (both parents and kids)
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role family_role NOT NULL,
  pin_code TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  avatar_emoji TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(family_id, pin_code)
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  location TEXT,
  created_by UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create event assignments (which family members are assigned to an event)
CREATE TABLE public.event_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, member_id)
);

-- Add foreign key for event_categories after families table exists
ALTER TABLE public.event_categories 
ADD CONSTRAINT event_categories_family_id_fkey 
FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

-- Enable RLS on all tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is a parent in a family
CREATE OR REPLACE FUNCTION public.is_family_parent(check_family_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = check_family_id
    AND user_id = check_user_id
    AND role = 'parent'
  )
$$;

-- Security definer function to check if user is a member of a family
CREATE OR REPLACE FUNCTION public.is_family_member(check_family_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = check_family_id
    AND user_id = check_user_id
  )
$$;

-- Families policies
CREATE POLICY "Users can view families they belong to"
ON public.families FOR SELECT
TO authenticated
USING (public.is_family_member(id, auth.uid()));

CREATE POLICY "Users can create families"
ON public.families FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Parents can update their family"
ON public.families FOR UPDATE
TO authenticated
USING (public.is_family_parent(id, auth.uid()));

-- Family members policies
CREATE POLICY "Members can view family members in their family"
ON public.family_members FOR SELECT
TO authenticated
USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Parents can insert family members"
ON public.family_members FOR INSERT
TO authenticated
WITH CHECK (public.is_family_parent(family_id, auth.uid()) OR 
  (role = 'parent' AND user_id = auth.uid()));

CREATE POLICY "Parents can update family members"
ON public.family_members FOR UPDATE
TO authenticated
USING (public.is_family_parent(family_id, auth.uid()));

CREATE POLICY "Parents can delete family members"
ON public.family_members FOR DELETE
TO authenticated
USING (public.is_family_parent(family_id, auth.uid()));

-- Events policies
CREATE POLICY "Members can view events in their family"
ON public.events FOR SELECT
TO authenticated
USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Parents can insert events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (public.is_family_parent(family_id, auth.uid()));

CREATE POLICY "Parents can update events"
ON public.events FOR UPDATE
TO authenticated
USING (public.is_family_parent(family_id, auth.uid()));

CREATE POLICY "Parents can delete events"
ON public.events FOR DELETE
TO authenticated
USING (public.is_family_parent(family_id, auth.uid()));

-- Event assignments policies
CREATE POLICY "Members can view assignments in their family"
ON public.event_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
    AND public.is_family_member(e.family_id, auth.uid())
  )
);

CREATE POLICY "Parents can insert assignments"
ON public.event_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
    AND public.is_family_parent(e.family_id, auth.uid())
  )
);

CREATE POLICY "Parents can delete assignments"
ON public.event_assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
    AND public.is_family_parent(e.family_id, auth.uid())
  )
);

-- Event categories policies
CREATE POLICY "Members can view categories in their family"
ON public.event_categories FOR SELECT
TO authenticated
USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Parents can insert categories"
ON public.event_categories FOR INSERT
TO authenticated
WITH CHECK (public.is_family_parent(family_id, auth.uid()));

CREATE POLICY "Parents can update categories"
ON public.event_categories FOR UPDATE
TO authenticated
USING (public.is_family_parent(family_id, auth.uid()));

CREATE POLICY "Parents can delete categories"
ON public.event_categories FOR DELETE
TO authenticated
USING (public.is_family_parent(family_id, auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for events updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create default categories after family creation
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.event_categories (family_id, name, color, icon) VALUES
    (NEW.id, 'School', '#3B82F6', '📚'),
    (NEW.id, 'Sports', '#22C55E', '⚽'),
    (NEW.id, 'Music', '#A855F7', '🎵'),
    (NEW.id, 'Family', '#F97316', '👨‍👩‍👧‍👦'),
    (NEW.id, 'Playdates', '#EC4899', '🎮'),
    (NEW.id, 'Trips', '#06B6D4', '✈️'),
    (NEW.id, 'Medical', '#EF4444', '🏥'),
    (NEW.id, 'Other', '#6B7280', '📌');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER create_family_default_categories
AFTER INSERT ON public.families
FOR EACH ROW
EXECUTE FUNCTION public.create_default_categories();
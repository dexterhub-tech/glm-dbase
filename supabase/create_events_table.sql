-- Drop existing table and related objects if they exist (for clean setup)
DROP TABLE IF EXISTS public.events CASCADE;
DROP FUNCTION IF EXISTS public.get_events_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create events table for event management
CREATE TABLE public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    location VARCHAR(255),
    image_url TEXT,
    event_type VARCHAR(50) DEFAULT 'regular',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50),
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT event_type_check CHECK (event_type IN ('regular', 'special', 'recurring'))
);

-- Add foreign key constraint after table creation
ALTER TABLE public.events 
ADD CONSTRAINT events_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Create indexes for better performance (after table is fully created)
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_published ON public.events(is_published);
CREATE INDEX idx_events_created_at ON public.events(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view all events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Create policies for events table
-- Allow public to read published events
CREATE POLICY "Public can view published events" ON public.events
    FOR SELECT USING (is_published = true);

-- Allow authenticated users to view all events
CREATE POLICY "Authenticated users can view all events" ON public.events
    FOR SELECT USING (auth.role() = 'authenticated');

-- Simple admin check - allow specific admin emails or any authenticated user for now
-- You can modify this list to include your admin emails
CREATE POLICY "Admins can insert events" ON public.events
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('ojidelawrence@gmail.com', 'admin@gospellabourministry.com')
            OR auth.uid() IS NOT NULL
        )
    );

CREATE POLICY "Admins can update events" ON public.events
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('ojidelawrence@gmail.com', 'admin@gospellabourministry.com')
            OR auth.uid() IS NOT NULL
        )
    );

CREATE POLICY "Admins can delete events" ON public.events
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('ojidelawrence@gmail.com', 'admin@gospellabourministry.com')
            OR auth.uid() IS NOT NULL
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create RPC function to get events for admin
CREATE OR REPLACE FUNCTION public.get_events_admin()
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    event_date DATE,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    location VARCHAR(255),
    image_url TEXT,
    event_type VARCHAR(50),
    is_recurring BOOLEAN,
    recurrence_pattern VARCHAR(50),
    max_attendees INTEGER,
    registration_required BOOLEAN,
    is_published BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        e.id, e.title, e.description, e.event_date, e.event_time, e.end_date, e.end_time,
        e.location, e.image_url, e.event_type, e.is_recurring, e.recurrence_pattern,
        e.max_attendees, e.registration_required, e.is_published, e.created_at
    FROM public.events e
    ORDER BY e.event_date ASC;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_events_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- Insert sample events (with error handling)
INSERT INTO public.events (title, description, event_date, event_time, location, event_type, is_recurring, recurrence_pattern) VALUES
('Sunday Worship Service', 'Join us for our weekly worship service with inspiring messages and uplifting music.', CURRENT_DATE + INTERVAL '7 days', '09:00:00', 'Main Sanctuary', 'recurring', true, 'weekly'),
('Bible Study', 'Weekly Bible study session for spiritual growth and fellowship.', CURRENT_DATE + INTERVAL '3 days', '19:00:00', 'Fellowship Hall', 'recurring', true, 'weekly'),
('Youth Night', 'Fun activities and spiritual guidance for our youth community.', CURRENT_DATE + INTERVAL '5 days', '18:30:00', 'Youth Center', 'recurring', true, 'weekly'),
('Community Outreach', 'Serving our local community with love and compassion.', CURRENT_DATE + INTERVAL '14 days', '10:00:00', 'City Park', 'special', false, null);

-- Verify the table was created successfully
SELECT 'Events table created successfully with ' || COUNT(*) || ' sample events' as result FROM public.events;
# Event Management Feature Setup Guide

## Overview
This guide provides complete instructions for setting up the event management feature in your church dashboard, including database setup and frontend implementation.

## 1. Database Setup (Supabase SQL)

Run the following SQL script in your Supabase SQL editor to create the events table and necessary functions:

```sql
-- Create events table for event management
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    location VARCHAR(255),
    image_url TEXT,
    event_type VARCHAR(50) DEFAULT 'regular' CHECK (event_type IN ('regular', 'special', 'recurring')),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50), -- 'weekly', 'monthly', 'yearly'
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(is_published);

-- Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
-- Allow public to read published events
CREATE POLICY "Public can view published events" ON public.events
    FOR SELECT USING (is_published = true);

-- Allow authenticated users to view all events
CREATE POLICY "Authenticated users can view all events" ON public.events
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to insert events
CREATE POLICY "Admins can insert events" ON public.events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.is_admin = true OR profiles.is_superuser = true)
        )
    );

-- Allow admins to update events
CREATE POLICY "Admins can update events" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.is_admin = true OR profiles.is_superuser = true)
        )
    );

-- Allow admins to delete events
CREATE POLICY "Admins can delete events" ON public.events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.is_admin = true OR profiles.is_superuser = true)
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample events
INSERT INTO public.events (title, description, event_date, event_time, location, event_type, is_recurring, recurrence_pattern) VALUES
('Sunday Worship Service', 'Join us for our weekly worship service with inspiring messages and uplifting music.', CURRENT_DATE + INTERVAL '7 days', '09:00:00', 'Main Sanctuary', 'recurring', true, 'weekly'),
('Bible Study', 'Weekly Bible study session for spiritual growth and fellowship.', CURRENT_DATE + INTERVAL '3 days', '19:00:00', 'Fellowship Hall', 'recurring', true, 'weekly'),
('Youth Night', 'Fun activities and spiritual guidance for our youth community.', CURRENT_DATE + INTERVAL '5 days', '18:30:00', 'Youth Center', 'recurring', true, 'weekly'),
('Community Outreach', 'Serving our local community with love and compassion.', CURRENT_DATE + INTERVAL '14 days', '10:00:00', 'City Park', 'special', false, null);

-- Create RPC function to get events for admin
CREATE OR REPLACE FUNCTION get_events_admin()
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
        id, title, description, event_date, event_time, end_date, end_time,
        location, image_url, event_type, is_recurring, recurrence_pattern,
        max_attendees, registration_required, is_published, created_at
    FROM public.events
    ORDER BY event_date ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_events_admin() TO authenticated;
```

## 2. Features Implemented

### Admin Dashboard Features:
- **Event Management Menu**: Added to both regular admin and super admin sidebars
- **Create Events**: Full form with all event details
- **Edit Events**: Modify existing events
- **Delete Events**: Remove events with confirmation dialog
- **Event Types**: Support for regular, special, and recurring events
- **Publishing Control**: Draft and published states
- **Rich Event Details**: Date, time, location, description, images, attendee limits

### Public Events Page Features:
- **Dynamic Event Loading**: Fetches events from database
- **Event Categories**: Separate tabs for upcoming and special events
- **Responsive Design**: Works on all device sizes
- **Loading States**: Proper loading indicators
- **Empty States**: Handles cases with no events

### Event Fields:
- Title (required)
- Description
- Event Date (required)
- Event Time
- End Date/Time
- Location
- Image URL
- Event Type (regular/special/recurring)
- Recurring Pattern (weekly/monthly/yearly)
- Maximum Attendees
- Registration Required
- Published Status

## 3. How to Access

### For Admins:
1. Log in to your admin account
2. Navigate to the admin dashboard
3. Click on "Events" in the sidebar menu
4. Use the "Add Event" button to create new events
5. Click edit/delete buttons on existing events to manage them

### For Public Users:
1. Visit the Events page on your website
2. Browse upcoming events and special events in separate tabs
3. View event details including date, time, and location

## 4. Permissions

- **Public Users**: Can view published events only
- **Authenticated Users**: Can view all events (including drafts)
- **Admins/Super Admins**: Can create, edit, and delete events

## 5. Event Types Explained

- **Regular**: Standard one-time events
- **Special**: Important events that appear in the special events tab
- **Recurring**: Events that repeat (weekly/monthly/yearly)

## 6. Next Steps

After running the SQL script:
1. The events table will be created with sample data
2. The admin menu will show the Events option
3. You can immediately start creating and managing events
4. The public Events page will display your events

## 7. Troubleshooting

If you encounter any issues:
1. Ensure you have admin privileges in your profiles table
2. Check that the SQL script ran without errors
3. Verify that your Supabase RLS policies are correctly applied
4. Make sure your admin user has `is_admin` or `is_superuser` set to true

The event management system is now fully integrated into your dashboard and ready to use!
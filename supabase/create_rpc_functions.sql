-- Create RPC functions for events and sermons
-- Drop existing functions first to avoid conflicts

DROP FUNCTION IF EXISTS get_upcoming_events(integer);
DROP FUNCTION IF EXISTS get_recent_sermons(integer);

-- Function to get upcoming events
CREATE OR REPLACE FUNCTION get_upcoming_events(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  image_url TEXT,
  event_type TEXT,
  is_recurring BOOLEAN,
  recurrence_pattern TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.event_date,
    e.start_time,
    e.end_time,
    e.location,
    e.image_url,
    e.event_type,
    e.is_recurring,
    e.recurrence_pattern,
    e.is_active
  FROM events e
  WHERE e.is_active = true
    AND (e.event_date >= CURRENT_DATE OR e.is_recurring = true)
  ORDER BY 
    CASE WHEN e.is_recurring THEN 0 ELSE 1 END,
    e.event_date ASC,
    e.start_time ASC
  LIMIT limit_count;
END;
$$;

-- Function to get recent sermons
CREATE OR REPLACE FUNCTION get_recent_sermons(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  speaker TEXT,
  sermon_date DATE,
  sermon_type TEXT,
  description TEXT,
  audio_url TEXT,
  video_url TEXT,
  image_url TEXT,
  scripture_reference TEXT,
  series_name TEXT,
  tags TEXT[],
  duration_minutes INTEGER,
  is_published BOOLEAN,
  view_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.speaker,
    s.sermon_date,
    s.sermon_type,
    s.description,
    s.audio_url,
    s.video_url,
    s.image_url,
    s.scripture_reference,
    s.series_name,
    s.tags,
    s.duration_minutes,
    s.is_published,
    s.view_count
  FROM sermons s
  WHERE s.is_published = true
  ORDER BY s.sermon_date DESC
  LIMIT limit_count;
END;
$$;
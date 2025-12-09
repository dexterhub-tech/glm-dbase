import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_type: string;
  target_audience: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString().split('T')[0])
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return { announcements, loading, error, refetch: fetchAnnouncements };
};

export const useActiveAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveAnnouncements = async () => {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any).rpc('get_active_announcements');

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch active announcements');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveAnnouncements();
  }, []);

  return { announcements, loading, error };
};
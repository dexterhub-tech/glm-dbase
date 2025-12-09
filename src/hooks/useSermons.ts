import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  sermon_date: string;
  sermon_type: string;
  description?: string;
  audio_url?: string;
  video_url?: string;
  image_url?: string;
  scripture_reference?: string;
  series_name?: string;
  tags?: string[];
  duration_minutes?: number;
  is_published: boolean;
  view_count: number;
}

export const useSermons = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSermons = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('sermons')
        .select('*')
        .eq('is_published', true)
        .order('sermon_date', { ascending: false });

      if (error) throw error;
      setSermons(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sermons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSermons();
  }, []);

  return { sermons, loading, error, refetch: fetchSermons };
};

export const useRecentSermons = (limit = 10) => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentSermons = async () => {
      try {
        setLoading(true);
        
        // Try RPC function first, fallback to direct query
        let { data, error } = await (supabase as any).rpc('get_recent_sermons', {
          limit_count: limit
        });

        // If RPC fails, use direct query
        if (error) {
          console.warn('RPC function failed, using direct query:', error.message);
          const result = await (supabase as any)
            .from('sermons')
            .select('*')
            .eq('is_published', true)
            .order('sermon_date', { ascending: false })
            .limit(limit);
          
          data = result.data;
          error = result.error;
        }

        if (error) throw error;
        setSermons(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recent sermons');
        console.error('Error fetching recent sermons:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSermons();
  }, [limit]);

  return { sermons, loading, error };
};
// This file creates a Supabase client with admin privileges using the service role key
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get Supabase credentials from environment variables
// Handle both VITE_ prefixed and non-prefixed variables for compatibility
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = 
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase admin environment variables:', { 
    hasUrl: !!SUPABASE_URL, 
    hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
    envKeys: Object.keys(import.meta.env).filter(key => key.includes('SUPABASE'))
  });
}

// Create a Supabase client with admin privileges
// This should ONLY be used in server-side code or secure API routes
// NEVER expose this client to the browser
export const adminSupabase = createClient<Database>(
  SUPABASE_URL as string,
  SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'glmcms-admin-client',
      },
      fetch: (url, options = {}) => {
        // Add retry logic with better timeout handling
        const fetchWithRetry = async (attempt = 1, maxAttempts = 3) => {
          // Create an AbortController for this fetch attempt
          const controller = new AbortController();
          
          // Set a timeout appropriate to the type of request
          const timeoutMs = 15000 / attempt; // 15s, 7.5s, 5s
          
          // Set the timeout
          const timeoutId = setTimeout(() => {
            console.warn(`Admin Supabase fetch timeout after ${timeoutMs}ms (attempt ${attempt}/${maxAttempts})`);
            controller.abort();
          }, timeoutMs);
          
          try {
            // Add cache-busting only for specific requests that need it
            // Skip cache-busting for REST API calls as they can cause parsing errors
            if (!url.toString().includes('/rest/v1/') && 
                !url.toString().includes('/storage/v1/') &&
                !url.toString().includes('/auth/')) {
              const urlObj = new URL(url.toString());
              urlObj.searchParams.append('_cb', Date.now().toString());
              url = urlObj.toString() as any;
            }
            
            // Add the signal to the options
            const fetchOptions = {
              ...options,
              signal: controller.signal
            };
            
            // Execute the fetch
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            return response;
          } catch (error: any) {
            clearTimeout(timeoutId);
            
            // Check if this was an abort error (timeout)
            const isAbortError = error.name === 'AbortError';
            console.warn(
              `Admin Supabase fetch ${isAbortError ? 'timeout' : 'error'} (attempt ${attempt}/${maxAttempts}):`, 
              isAbortError ? `Request timed out after ${timeoutMs}ms` : error
            );
            
            if (attempt < maxAttempts) {
              // Exponential backoff with jitter
              const baseDelay = Math.pow(2, attempt - 1) * 500; // Start with 500ms
              const jitter = Math.random() * 300; // Add up to 300ms of jitter
              const delay = baseDelay + jitter;
              
              console.log(`Retrying in ${Math.round(delay/1000)} seconds...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return fetchWithRetry(attempt + 1, maxAttempts);
            }
            
            // If we've exhausted all retries, throw a more informative error
            if (isAbortError) {
              throw new Error(`Request timed out after ${attempt} attempts`);
            }
            throw error;
          }
        };
        
        return fetchWithRetry();
      },
    }
  }
);

// Log initialization for debugging
console.log('Admin Supabase client initialized with URL:', SUPABASE_URL);

// Add a warning if we're in development mode
if (import.meta.env.DEV) {
  console.warn(
    'You are using the admin Supabase client with service role key. ' +
    'This should ONLY be used in secure server-side code.'
  );
}

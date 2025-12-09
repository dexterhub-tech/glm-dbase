import { supabase } from "@/integrations/supabase/client";

/**
 * Preload authentication data to improve performance
 * This function should be called as early as possible in the application lifecycle
 */
export const preloadAuthData = async () => {
  try {
    console.log("[AuthPreload] Starting auth data preload");
    
    // Start session fetch early
    const sessionPromise = supabase.auth.getSession();
    
    // Also try to get user data in parallel
    const userPromise = supabase.auth.getUser();
    
    // Wait for both promises to settle (not necessarily resolve)
    const results = await Promise.allSettled([sessionPromise, userPromise]);
    
    // Check results
    const sessionResult = results[0];
    const userResult = results[1];
    
    if (sessionResult.status === 'fulfilled') {
      console.log("[AuthPreload] Session preload successful");
    } else {
      console.warn("[AuthPreload] Session preload failed:", sessionResult.reason);
    }
    
    if (userResult.status === 'fulfilled') {
      console.log("[AuthPreload] User preload successful");
    } else {
      console.warn("[AuthPreload] User preload failed:", userResult.reason);
    }
    
    // Return the results
    return {
      sessionPreloaded: sessionResult.status === 'fulfilled',
      userPreloaded: userResult.status === 'fulfilled',
      session: sessionResult.status === 'fulfilled' ? sessionResult.value.data.session : null,
      user: userResult.status === 'fulfilled' ? userResult.value.data.user : null
    };
  } catch (error) {
    console.error("[AuthPreload] Error preloading auth data:", error);
    return {
      sessionPreloaded: false,
      userPreloaded: false,
      session: null,
      user: null
    };
  }
};

/**
 * Check if there's a stored session in localStorage
 * This is a synchronous operation that can be called very early
 */
export const hasStoredSession = (): boolean => {
  try {
    // Get the storage key from the Supabase client
    const storageKey = 'glm-auth-token';
    const storedSession = localStorage.getItem(storageKey);
    return !!storedSession;
  } catch (error) {
    console.error("[AuthPreload] Error checking stored session:", error);
    return false;
  }
};

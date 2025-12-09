import { useEffect } from 'react';
import AOS from 'aos';
import { shouldDisableAnimations, getOptimizedAnimationDuration } from '@/utils/animationUtils';

interface AOSOptions {
  duration?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'ease-in-back' | 'ease-out-back' | 'ease-in-out-back' | 'ease-in-sine' | 'ease-out-sine' | 'ease-in-out-sine' | 'ease-in-quad' | 'ease-out-quad' | 'ease-in-out-quad' | 'ease-in-cubic' | 'ease-out-cubic' | 'ease-in-out-cubic' | 'ease-in-quart' | 'ease-out-quart' | 'ease-in-out-quart';
  once?: boolean;
  mirror?: boolean;
  offset?: number;
  delay?: number;
  disable?: boolean | "phone" | "tablet" | "mobile" | (() => boolean);
}

export const useAOS = (options?: AOSOptions) => {
  useEffect(() => {
    // Default configuration optimized for performance and accessibility
    const defaultOptions: AOSOptions = {
      duration: getOptimizedAnimationDuration(800),
      easing: 'ease-out-cubic',
      once: true,
      mirror: false,
      offset: 50,
      delay: 0,
      // Use utility function to determine if animations should be disabled
      disable: shouldDisableAnimations(),
    };

    // Merge default options with provided options
    const finalOptions = { ...defaultOptions, ...options };

    // Initialize AOS with error handling
    try {
      AOS.init(finalOptions);
      
      // Refresh AOS on route changes or dynamic content updates
      const refreshAOS = () => {
        setTimeout(() => {
          AOS.refresh();
        }, 100);
      };

      // Listen for route changes (if using React Router)
      window.addEventListener('popstate', refreshAOS);
      
      // Listen for window resize to recalculate positions
      window.addEventListener('resize', refreshAOS);

      // Cleanup function
      return () => {
        window.removeEventListener('popstate', refreshAOS);
        window.removeEventListener('resize', refreshAOS);
      };
    } catch (error) {
      console.warn('AOS initialization failed:', error);
    }
  }, []);

  // Function to manually refresh AOS (useful for dynamic content)
  const refreshAOS = () => {
    try {
      AOS.refresh();
    } catch (error) {
      console.warn('AOS refresh failed:', error);
    }
  };

  return { refreshAOS };
};
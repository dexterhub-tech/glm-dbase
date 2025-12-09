/**
 * Utility functions for handling animations and performance optimization
 */

export const shouldDisableAnimations = (): boolean => {
  // Check for reduced motion preference
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return true;

    // Check for low-end devices (basic heuristics)
    const isLowEndDevice = () => {
      if (typeof navigator === 'undefined') return false;
      
      // Check available memory (if supported)
      if ('deviceMemory' in navigator) {
        return (navigator as any).deviceMemory < 4;
      }
      
      // Check hardware concurrency
      if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency) {
        return navigator.hardwareConcurrency < 4;
      }
      
      // Fallback: check user agent for known low-end devices
      if (typeof navigator !== 'undefined' && navigator.userAgent) {
        const userAgent = navigator.userAgent.toLowerCase();
        const lowEndPatterns = [
          'android 4',
          'android 5',
          'android 6',
          'iphone os 10',
          'iphone os 11',
        ];
        
        return lowEndPatterns.some(pattern => userAgent.includes(pattern));
      }
      
      return false;
    };

    // Disable animations on very small screens with low-end devices
    if (window.innerWidth < 768 && isLowEndDevice()) {
      return true;
    }
  }

  return false;
};

export const getOptimizedAnimationDuration = (baseDuration: number = 800): number => {
  if (shouldDisableAnimations()) return 0;
  
  // Reduce duration on mobile devices
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return Math.max(baseDuration * 0.7, 300);
  }
  
  return baseDuration;
};

export const getOptimizedAnimationDelay = (baseDelay: number = 0): number => {
  if (shouldDisableAnimations()) return 0;
  
  // Reduce delays on mobile devices
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return Math.max(baseDelay * 0.5, 0);
  }
  
  return baseDelay;
};

export const createStaggeredDelay = (index: number, baseDelay: number = 100): number => {
  const optimizedBaseDelay = getOptimizedAnimationDelay(baseDelay);
  return optimizedBaseDelay * index;
};
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AOSWrapperProps {
  children: React.ReactNode;
  animation?: string;
  delay?: number;
  duration?: number;
  offset?: number;
  className?: string;
  once?: boolean;
  easing?: string;
  disabled?: boolean;
}

const AOSWrapper: React.FC<AOSWrapperProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 800,
  offset = 80,
  className,
  once = true,
  easing = 'ease-out-cubic',
  disabled = false,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Skip if animations are disabled
    if (disabled) {
      setIsVisible(true);
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add delay before showing animation
            setTimeout(() => {
              setIsVisible(true);
              if (once) {
                setHasAnimated(true);
                observer.unobserve(element);
              }
            }, delay);
          } else if (!once && !hasAnimated) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: `0px 0px -${offset}px 0px`,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [delay, offset, once, hasAnimated, disabled]);

  // Animation classes mapping
  const getAnimationClasses = () => {
    if (disabled) return '';
    
    const baseClasses = 'transition-all';
    const durationClass = `duration-${Math.min(duration, 1000)}`;
    const easingClass = easing.includes('cubic') ? 'ease-out' : 'ease-in-out';
    
    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0 translate-y-8`;
        case 'fade-down':
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0 -translate-y-8`;
        case 'fade-left':
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0 translate-x-8`;
        case 'fade-right':
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0 -translate-x-8`;
        case 'zoom-in':
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0 scale-95`;
        case 'zoom-out':
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0 scale-105`;
        case 'flip-up':
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0 rotate-x-90`;
        default:
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0`;
      }
    }
    
    return `${baseClasses} ${durationClass} ${easingClass} opacity-100 translate-x-0 translate-y-0 scale-100 rotate-0`;
  };

  return (
    <div
      ref={elementRef}
      className={cn(getAnimationClasses(), className)}
    >
      {children}
    </div>
  );
};

export default AOSWrapper;
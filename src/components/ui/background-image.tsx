import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface BackgroundImageProps {
  src: string;
  fallbackSrc?: string;
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
}

const BackgroundImage: React.FC<BackgroundImageProps> = ({
  src,
  fallbackSrc = '/images/placeholder.svg',
  className,
  children,
  overlay = true,
  overlayOpacity = 0.5,
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
    }
    setIsLoading(false);
  }, [currentSrc, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400">Loading background...</div>
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl mb-2">🖼️</div>
            <div>Background image unavailable</div>
          </div>
        </div>
      )}
      
      {/* Background image */}
      <div
        className={cn(
          "absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500",
          isLoading || hasError ? "opacity-0" : "opacity-100"
        )}
        style={{ backgroundImage: `url(${currentSrc})` }}
      />
      
      {/* Preload image to detect errors */}
      <img
        src={currentSrc}
        alt=""
        className="hidden"
        onError={handleError}
        onLoad={handleLoad}
      />
      
      {/* Overlay */}
      {overlay && !hasError && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default BackgroundImage;
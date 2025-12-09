import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import BackgroundImage from './background-image';

interface VideoWithFallbackProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  fallbackImage: string;
  className?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

const VideoWithFallback: React.FC<VideoWithFallbackProps> = ({
  src,
  fallbackImage,
  className,
  overlayOpacity = 0.3,
  children,
  ...videoProps
}) => {
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoError = useCallback(() => {
    setHasVideoError(true);
    setIsVideoLoaded(false);
  }, []);

  const handleVideoLoad = useCallback(() => {
    setIsVideoLoaded(true);
    setHasVideoError(false);
  }, []);

  if (hasVideoError) {
    return (
      <BackgroundImage
        src={fallbackImage}
        className={className}
        overlay={true}
        overlayOpacity={overlayOpacity}
      >
        {children}
      </BackgroundImage>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Background image shown while video loads */}
      {!isVideoLoaded && (
        <BackgroundImage
          src={fallbackImage}
          className="absolute inset-0"
          overlay={true}
          overlayOpacity={overlayOpacity}
        />
      )}
      
      {/* Video element */}
      <video
        ref={videoRef}
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          isVideoLoaded ? "opacity-70" : "opacity-0"
        )}
        onError={handleVideoError}
        onLoadedData={handleVideoLoad}
        onCanPlay={handleVideoLoad}
        {...videoProps}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default VideoWithFallback;
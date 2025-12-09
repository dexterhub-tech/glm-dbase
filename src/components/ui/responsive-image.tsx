import React from 'react';
import ImageWithFallback from './image-with-fallback';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  onLoad,
  onError,
}) => {
  // Generate responsive image URLs for different screen sizes
  const generateResponsiveUrl = (originalUrl: string, width: number) => {
    // If it's a Cloudinary URL, add transformation parameters
    if (originalUrl.includes('cloudinary.com')) {
      return originalUrl.replace('/upload/', `/upload/w_${width},c_scale,f_auto,q_auto/`);
    }
    
    // If it's an Unsplash URL, add width parameter
    if (originalUrl.includes('unsplash.com')) {
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}w=${width}&fit=crop&auto=format`;
    }
    
    // For other URLs, return as-is
    return originalUrl;
  };

  const srcSet = [
    `${generateResponsiveUrl(src, 400)} 400w`,
    `${generateResponsiveUrl(src, 800)} 800w`,
    `${generateResponsiveUrl(src, 1200)} 1200w`,
    `${generateResponsiveUrl(src, 1600)} 1600w`,
  ].join(', ');

  return (
    <ImageWithFallback
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={cn(
        "transition-opacity duration-300",
        priority && "priority",
        className
      )}
      fallbackSrc={fallbackSrc}
      onLoad={onLoad}
      onError={onError}
      loading={priority ? "eager" : "lazy"}
    />
  );
};

export default ResponsiveImage;
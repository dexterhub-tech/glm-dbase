// Header import removed - Header is rendered in App.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import BackgroundImage from "@/components/ui/background-image";

interface HeroProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  overlay?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

const Hero = ({
  title,
  subtitle,
  backgroundImage = "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1473&q=80",
  overlay = true,
  ctaText,
  ctaLink,
}: HeroProps) => {
  return (
    <div className="relative">{/* Header is already rendered in App.tsx, no need to duplicate */}
      
      <BackgroundImage 
        src={backgroundImage}
        className="h-screen flex items-end justify-start mb-8 overflow-hidden"
        overlay={overlay}
        overlayOpacity={0.5}
      >
        <div className="container max-w-7xl w-full px-4 md:px-6 lg:px-6 pb-16 text-left">
            <p className="text-sm md:text-base text-church-red/70 uppercase tracking-wide mb-2">
            Empowering Lives Through Faith
            </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 drop-shadow-lg leading-tight">
            {title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 drop-shadow max-w-2xl">
            {subtitle}
          </p>
          
          {ctaText && ctaLink && (
            <Link to={ctaLink}>
                <Button 
                size="lg" 
                className="bg-transparent text-white font-medium px-6 py-8 border-2 border-white rounded-none hover:bg-white hover:text-black transition-colors"
                >
                {ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </Link>
          )}
        </div>
      </BackgroundImage>
    </div>
  );
};

export default Hero;
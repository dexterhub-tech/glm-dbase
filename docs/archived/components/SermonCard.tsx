
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Headphones, Video, BookOpen, User } from "lucide-react";
import { Link } from "react-router-dom";
import ImageWithFallback from "@/components/ui/image-with-fallback";

interface SermonCardProps {
  id: string;
  title: string;
  speaker: string;
  date: string;
  image?: string;
  type: "video" | "audio" | "text";
}

const SermonCard = ({ id, title, speaker, date, image, type }: SermonCardProps) => {
  // Get the appropriate icon based on sermon type
  const TypeIcon = () => {
    switch (type) {
      case "video":
        return <Video size={16} className="mr-2 text-church-red" />;
      case "audio":
        return <Headphones size={16} className="mr-2 text-church-blue" />;
      case "text":
        return <BookOpen size={16} className="mr-2 text-church-yellow" />;
      default:
        return <BookOpen size={16} className="mr-2 text-church-yellow" />;
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      {image && (
        <div className="w-full h-48 overflow-hidden">
          <ImageWithFallback 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      )}
      
      <CardContent className="pt-6 pb-2">
        <div className="flex items-center mb-3">
          <TypeIcon />
          <span className="text-sm font-medium text-gray-500 capitalize">{type} Sermon</span>
        </div>
        
        <h3 className="font-serif text-xl font-semibold mb-3 text-gray-900 line-clamp-2">{title}</h3>
        
        <div className="space-y-2 text-gray-600">
          <div className="flex items-center">
            <User size={16} className="mr-2 text-church-blue" />
            <span>{speaker}</span>
          </div>
          
          <div className="flex items-center">
            <Calendar size={16} className="mr-2 text-church-red" />
            <span>{date}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-6">
        <Link to={`/sermons/${id}`} className="w-full">
          <Button 
            variant="outline" 
            className="w-full border-church-red text-church-red hover:bg-church-red hover:text-white"
          >
            Listen Now
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default SermonCard;

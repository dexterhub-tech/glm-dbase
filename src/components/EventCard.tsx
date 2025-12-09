import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ImageWithFallback from "@/components/ui/image-with-fallback";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image?: string;
}

const EventCard = ({ id, title, date, time, location, image }: EventCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-0  rounded-2xl group bg-white">
      {/* Image with gradient overlay */}
      {image && (
        <div className="relative w-full h-56 p-2 overflow-hidden">
          <ImageWithFallback 
            src={image} 
            alt={title} 
            className="w-full h-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" /> */}
        </div>
      )}
      
      {/* Content with minimalist typography */}
      <CardContent className="pt-6 pb-4 ">
        <div className="mb-1 text-sm font-medium text-church-red uppercase tracking-widest">
          Upcoming Event
        </div>
        <h3 className="text-2xl font-bold mb-4 leading-tight text-gray-900">{title}</h3>
        
        <div className="flex items-center justify-between gap-4  text-gray-700">
          <div>
            <p className="text-xs font-medium text-gray-500">Date</p>
            <p className="font-medium text-sm">{date}</p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-gray-500">Time</p>
            <p className="font-medium text-sm">{time}</p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-gray-500">Location</p>
            <p className="font-medium text-sm">{location}</p>
          </div>
        </div>
      </CardContent>
      
      {/* Full-width button */}
      <CardFooter className="p-0 pb-4">
        <Link to={`/events/${id}`} className="w-full">
          <Button 
            className=" mx-6 h-14 rounded bg-black text-white hover:bg-gray-800 text-base font-medium tracking-wide transition-colors duration-300"
          >
            View Event Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
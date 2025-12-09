import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Users, ArrowLeft, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  image_url?: string;
  event_type: 'regular' | 'special' | 'recurring';
  is_recurring: boolean;
  recurrence_pattern?: string;
  max_attendees?: number;
  registration_required: boolean;
  is_published: boolean;
  created_at: string;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('events' as any)
        .select('*')
        .eq('id', eventId)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setEvent(data as unknown as Event);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Event not found or no longer available",
        variant: "destructive",
      });
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description || `Join us for ${event.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Event link copied to clipboard",
        });
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Event link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
        <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or is no longer available.</p>
        <Button onClick={() => navigate('/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative">
          {event.image_url ? (
            <div className="h-96 bg-cover bg-center relative" style={{ backgroundImage: `url(${event.image_url})` }}>
              <div className="absolute inset-0 bg-black/50"></div>
            </div>
          ) : (
            <div className="h-96 bg-gradient-to-r from-blue-600 to-purple-600 relative">
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
          )}

          {/* Back Button */}
          <div className="absolute top-6 left-6">
            <Button
              variant="outline"
              onClick={() => navigate('/events')}
              className="bg-white/90 hover:bg-white text-gray-900 border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>

          {/* Share Button */}
          <div className="absolute top-6 right-6">
            <Button
              variant="outline"
              onClick={handleShare}
              className="bg-white/90 hover:bg-white text-gray-900 border-white/20"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Event Details */}
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={event.event_type === 'special' ? 'default' : 'secondary'}>
                    {event.event_type}
                  </Badge>
                  {event.is_recurring && event.recurrence_pattern && (
                    <Badge variant="outline">
                      Recurring: {event.recurrence_pattern}
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>

                {event.description && (
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed">{event.description}</p>
                  </div>
                )}
              </div>

              {/* Event Information */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Event Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Date</p>
                        <p className="text-gray-600">{formatDate(event.event_date)}</p>
                        {event.end_date && event.end_date !== event.event_date && (
                          <p className="text-gray-600">to {formatDate(event.end_date)}</p>
                        )}
                      </div>
                    </div>

                    {event.event_time && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Time</p>
                          <p className="text-gray-600">
                            {formatTime(event.event_time)}
                            {event.end_time && ` - ${formatTime(event.end_time)}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-gray-600">{event.location}</p>
                        </div>
                      </div>
                    )}

                    {event.max_attendees && (
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Capacity</p>
                          <p className="text-gray-600">Maximum {event.max_attendees} attendees</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Flyer Card */}
              {event.image_url && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Event Flyer</h3>
                    <div className="relative">
                      <img
                        src={event.image_url}
                        alt={`${event.title} flyer`}
                        className="w-full h-auto max-w-[288px] mx-auto rounded-lg shadow-lg border border-gray-200"
                        style={{ aspectRatio: '1/1' }} // 4x4 inches square aspect ratio
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (event.image_url) {
                              window.open(event.image_url, '_blank');
                            }
                          }}
                        >
                          View Full Size
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (event.image_url) {
                              const link = document.createElement('a');
                              link.href = event.image_url;
                              link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flyer.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              toast({
                                title: "Download Started",
                                description: "Event flyer is being downloaded",
                              });
                            }
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Registration Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Join This Event</h3>
                  {event.registration_required ? (
                    <div className="space-y-4">
                      <p className="text-gray-600">Registration is required for this event.</p>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          toast({
                            title: "Registration",
                            description: "Please contact the church office to register for this event.",
                          });
                        }}
                      >
                        Register Now
                      </Button>
                      <p className="text-xs text-gray-500">
                        Contact the church office for registration details.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600">No registration required. Just show up!</p>
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          // Create calendar event
                          const startDate = new Date(`${event.event_date}T${event.event_time || '00:00'}`);
                          const endDate = event.end_date && event.end_time
                            ? new Date(`${event.end_date}T${event.end_time}`)
                            : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

                          const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`;

                          window.open(calendarUrl, '_blank');
                        }}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Add to Calendar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Questions?</h3>
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      For more information about this event, please contact us:
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span> (123) 456-7890
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Email:</span> info@gospellabour.org
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigate('/contact')}
                    >
                      Contact Us
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventDetail;
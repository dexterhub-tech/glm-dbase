
import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import EventCard from "@/components/EventCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  image_url?: string;
  event_type: 'regular' | 'special' | 'recurring';
}

const Events = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [specialEvents, setSpecialEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events' as any)
        .select('*')
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) throw error;

      const events = (data || []) as unknown as Event[];
      
      // Separate events by type
      const upcoming = events.filter(event => 
        event.event_type === 'regular' || event.event_type === 'recurring'
      );
      const special = events.filter(event => 
        event.event_type === 'special'
      );

      setUpcomingEvents(upcoming);
      setSpecialEvents(special);
    } catch (error) {
      console.error('Error fetching events:', error);
      // Fallback to empty arrays if there's an error
      setUpcomingEvents([]);
      setSpecialEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatEventForCard = (event: Event) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
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

    return {
      id: event.id,
      title: event.title,
      date: formatDate(event.event_date),
      time: formatTime(event.event_time),
      location: event.location || '',
      image: event.image_url || "https://images.unsplash.com/photo-1507036066871-b7e8032b3dea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1032&q=80"
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero
          title="Events Calendar"
          subtitle="Join us for worship, fellowship, and community outreach"
          backgroundImage="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80"
        />

        {/* Events Tabs */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="upcoming" className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList>
                  <TabsTrigger value="upcoming" className="text-lg px-6">Upcoming Events</TabsTrigger>
                  <TabsTrigger value="special" className="text-lg px-6">Special Events</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="upcoming">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingEvents.map((event) => {
                      const cardData = formatEventForCard(event);
                      return (
                        <EventCard
                          key={event.id}
                          id={cardData.id}
                          title={cardData.title}
                          date={cardData.date}
                          time={cardData.time}
                          location={cardData.location}
                          image={cardData.image}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No upcoming events scheduled at this time.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="special">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : specialEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {specialEvents.map((event) => {
                      const cardData = formatEventForCard(event);
                      return (
                        <EventCard
                          key={event.id}
                          id={cardData.id}
                          title={cardData.title}
                          date={cardData.date}
                          time={cardData.time}
                          location={cardData.location}
                          image={cardData.image}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No special events scheduled at this time.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Calendar Info */}
        <section className="py-16 bg-church-yellow/10">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-6 text-center">Event Information</h2>
            <div className="prose prose-lg max-w-none">
              <p>
                Our church calendar is always full of opportunities to connect, grow, and serve. From regular weekly services to special events and outreach programs, there's something for everyone at Gospel Labour Ministry.
              </p>
              <p>
                Most events are open to the public unless otherwise noted. For specific information about an event, please contact the church office at (123) 456-7890 or email us at info@gospellabour.org.
              </p>
              <h3>Planning Your Visit</h3>
              <p>
                When attending an event at Gospel Labour Ministry for the first time, we recommend arriving 15 minutes early. Our welcome team will be happy to help you find your way around and answer any questions you might have.
              </p>
              <h3>Volunteer Opportunities</h3>
              <p>
                Many of our events rely on the support of volunteers. If you're interested in serving at any of our events, please let us know by filling out the volunteer form on our contact page.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Events;

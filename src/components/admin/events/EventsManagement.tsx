import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import EventForm from "@/components/admin/events/EventForm";
import DeleteEventDialog from "@/components/admin/events/DeleteEventDialog";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const EventsManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      // Direct table access with type assertion
      const { data, error } = await supabase
        .from('events' as any)
        .select('*')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      setEvents((data || []) as unknown as Event[]);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setDeletingEvent(event);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEvent(null);
    fetchEvents();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEvent) return;

    try {
      const { error } = await supabase
        .from('events' as any)
        .delete()
        .eq('id', deletingEvent.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      
      setDeletingEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

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
  
  const filteredEvents = () => {
    if (activeTab === "all") return events;
    if (activeTab === "published") return events.filter(event => event.is_published);
    if (activeTab === "drafts") return events.filter(event => !event.is_published);
    if (activeTab === "special") return events.filter(event => event.event_type === "special");
    if (activeTab === "regular") return events.filter(event => event.event_type === "regular");
    if (activeTab === "recurring") return events.filter(event => event.is_recurring);
    return events;
  };

  const getEventTypeColor = (type: string) => {
    switch(type) {
      case 'special': return "bg-primary text-primary-foreground";
      case 'regular': return "bg-secondary text-secondary-foreground";
      case 'recurring': return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 mt-4">
          <h1 className="text-3xl font-sans font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground">Create and manage church events and activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchEvents}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={handleCreateEvent} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 text-center mb-4">
                Get started by creating your first event
              </p>
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg font-sans">{event.title}</CardTitle>
                      <Badge variant={event.event_type === 'special' ? 'default' : 'secondary'}>
                        {event.event_type}
                      </Badge>
                      {!event.is_published && (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-gray-600 text-sm">{event.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEvent(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(event)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                  {event.event_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{formatTime(event.event_time)}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.max_attendees && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>Max: {event.max_attendees}</span>
                    </div>
                  )}
                </div>
                {event.is_recurring && event.recurrence_pattern && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Recurring: {event.recurrence_pattern}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showForm && (
        <EventForm
          event={editingEvent}
          onClose={handleFormClose}
        />
      )}

      {deletingEvent && (
        <DeleteEventDialog
          event={deletingEvent}
          onClose={() => setDeletingEvent(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default EventsManagement;
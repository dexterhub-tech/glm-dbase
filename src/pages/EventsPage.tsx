import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data for now
const events = [
    {
        id: 1,
        title: "Sunday Service",
        date: "2024-05-19",
        time: "09:00 AM",
        location: "Main Auditorium",
        category: "Service",
        status: "Upcoming"
    },
    {
        id: 2,
        title: "Mid-week Service",
        date: "2024-05-22",
        time: "06:00 PM",
        location: "Main Auditorium",
        category: "Service",
        status: "Upcoming"
    },
    {
        id: 3,
        title: "Youth Summit",
        date: "2024-06-01",
        time: "10:00 AM",
        location: "Youth Hall",
        category: "Special",
        status: "Planning"
    }
];

export default function EventsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-serif">Events</h1>
                    <p className="text-slate-500 mt-1">Manage church services and upcoming events.</p>
                </div>
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search events..."
                        className="pl-9 bg-white rounded-xl border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                    <Card key={event.id} className="border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white group cursor-pointer hover:-translate-y-1">
                        <div className="h-32 bg-gradient-to-r from-primary/80 to-primary/40 relative">
                            <Badge className="absolute top-4 right-4 bg-white/90 text-slate-900 hover:bg-white inset-ring-1 inset-ring-slate-200">
                                {event.category}
                            </Badge>
                        </div>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span className="font-serif text-xl">{event.title}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-primary" />
                                <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span>{event.location}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-slate-50 p-4">
                            <div className="flex items-center justify-between w-full">
                                <span className={`text-xs px-2 py-1 rounded-full ${event.status === 'Upcoming' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {event.status}
                                </span>
                                <Button variant="ghost" size="sm" className="hover:text-primary">View Details</Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MapPin, Users, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const centers = [
    {
        id: 1,
        name: "Lekki Center",
        leader: "Pastor Emmanuel",
        address: "123 Admiralty Way, Lekki Phase 1",
        members: 45,
        meetingDay: "Tuesday 6:00 PM"
    },
    {
        id: 2,
        name: "Ikeja Center",
        leader: "Pastor David",
        address: "45 Allen Avenue, Ikeja",
        members: 32,
        meetingDay: "Wednesday 6:00 PM"
    },
    {
        id: 3,
        name: "Yaba Center",
        leader: "Deacon Sarah",
        address: "University Road, Yaba",
        members: 58,
        meetingDay: "Thursday 6:00 PM"
    }
];

export default function AuxanoCentersPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-serif">Auxano Centers</h1>
                    <p className="text-slate-500 mt-1">Manage fellowship centers and cell groups.</p>
                </div>
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Center
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search centers..."
                        className="pl-9 bg-white rounded-xl border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {centers.map((center) => (
                    <Card key={center.id} className="border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl bg-white hover:-translate-y-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="font-serif text-xl text-slate-800">{center.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3 text-sm text-slate-600">
                                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>{center.address}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Users className="w-4 h-4 text-primary shrink-0" />
                                <div className="flex justify-between w-full">
                                    <span>Leader: {center.leader}</span>
                                    <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded-full">{center.members} Members</span>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-2">
                                <Button variant="outline" className="flex-1 rounded-lg border-slate-200 hover:bg-slate-50">View Details</Button>
                                <Button className="flex-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800">Assign Members</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, PlayCircle, Music, FileAudio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const messages = [
    {
        id: 1,
        title: "The Power of Faith",
        preacher: "Pastor John Doe",
        date: "2024-05-19",
        duration: "1:15:30",
        type: "Audio"
    },
    {
        id: 2,
        title: "Walking in Dominion",
        preacher: "Pastor Jane Doe",
        date: "2024-05-12",
        duration: "58:20",
        type: "Audio"
    },
    {
        id: 3,
        title: "Grace Abounds",
        preacher: "Bishop Smith",
        date: "2024-05-05",
        duration: "1:02:15",
        type: "Video"
    }
];

export default function MessagesPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-serif">Messages</h1>
                    <p className="text-slate-500 mt-1">Upload and manage sermon archives.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white hover:bg-slate-50 rounded-xl shadow-sm">
                        Create Playlist
                    </Button>
                    <Button className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Message
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-slate-200/50 p-1 rounded-xl mb-6">
                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">All Messages</TabsTrigger>
                    <TabsTrigger value="audio" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Audio</TabsTrigger>
                    <TabsTrigger value="video" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Video</TabsTrigger>
                    <TabsTrigger value="series" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Series</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search messages..."
                                className="pl-9 bg-white rounded-xl border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {messages.map((msg) => (
                            <Card key={msg.id} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden bg-white">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                        {msg.type === 'Video' ? <PlayCircle className="text-primary w-6 h-6" /> : <Music className="text-primary w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 truncate">{msg.title}</h3>
                                        <p className="text-sm text-slate-500">{msg.preacher} • {new Date(msg.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-sm font-medium text-slate-500 tabular-nums hidden md:block">
                                        {msg.duration}
                                    </div>
                                    <Button variant="ghost" size="sm" className="ml-auto">Manage</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

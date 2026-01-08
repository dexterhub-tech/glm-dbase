import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, PlayCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const recentMessages = [
    {
        id: 1,
        title: "The Power of Faith",
        preacher: "Pastor John Doe",
        date: "2024-05-19",
        type: "Audio"
    },
    {
        id: 2,
        title: "Walking in Dominion",
        preacher: "Pastor Jane Doe",
        date: "2024-05-12",
        type: "Audio"
    },
    {
        id: 3,
        title: "Grace Abounds",
        preacher: "Bishop Smith",
        date: "2024-05-05",
        type: "Video"
    }
];

export function RecentMessages() {
    return (
        <Card className="w-full border-none shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-slate-100/50">
                <CardTitle className="text-lg font-bold font-serif  flex justify-between items-center">
                    Recent Uploads
                    <Button variant="ghost" size="sm" className="text-xs text-primary font-sans h-auto py-1 px-2">View All</Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    {recentMessages.map((msg) => (
                        <div key={msg.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${msg.type === 'Video' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                {msg.type === 'Video' ? <PlayCircle className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary transition-colors">{msg.title}</p>
                                <p className="text-xs text-slate-500 truncate">{msg.preacher}</p>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(msg.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

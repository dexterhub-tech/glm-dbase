import { Sidebar } from "./components/layout/Sidebar";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <main className="md:ml-64 min-h-screen">
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

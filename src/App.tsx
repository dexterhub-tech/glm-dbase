import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MembersPage from "./pages/MembersPage";
import AddMemberPage from "./pages/AddMemberPage";
import EditMemberPage from "./pages/EditMemberPage";
import MessagesPage from "./pages/MessagesPage";
import EventsPage from "./pages/EventsPage";
import AuxanoCentersPage from "./pages/AuxanoCentersPage";
import AuxanoCenterDetailsPage from "./pages/AuxanoCenterDetailsPage";
import DiscipleshipPage from "./pages/DiscipleshipPage";
import CreateUserPage from "./pages/CreateUserPage";
import UsersPage from "./pages/UsersPage";
import AppLayout from "./components/layout/AppLayout";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return <>{children}</>;
};

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route
                                path="/*"
                                element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <Routes>
                                                <Route path="/" element={<Dashboard />} />
                                                <Route path="/members" element={<MembersPage />} />
                                                <Route path="/members/add" element={<AddMemberPage />} />
                                                <Route path="/members/edit/:id" element={<EditMemberPage />} />
                                                <Route path="/messages" element={<MessagesPage />} />
                                                <Route path="/events" element={<EventsPage />} />
                                                <Route path="/auxano-centers" element={<AuxanoCentersPage />} />
                                                <Route path="/auxano-centers/:id" element={<AuxanoCenterDetailsPage />} />
                                                <Route path="/discipleship" element={<DiscipleshipPage />} />
                                                <Route path="/create-user" element={<CreateUserPage />} />
                                                <Route path="/users" element={<UsersPage />} />
                                            </Routes>
                                        </AppLayout>
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </BrowserRouter>
                    <Toaster />
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;

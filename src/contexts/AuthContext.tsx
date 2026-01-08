import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { User } from '@/types/member';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    register: (email: string, password: string, full_name: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get('/auth/profile');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile();
        } else {
            setIsLoading(false);
        }
    }, [fetchProfile]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;
            localStorage.setItem('token', token);
            setUser(userData);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, password: string, full_name: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/register', { email, password, full_name });
            const { token, user: userData } = response.data;
            localStorage.setItem('token', token);
            setUser(userData);
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

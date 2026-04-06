import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: 'http://localhost:8000/api/', // Default for local dev
    });

    // Add interceptor to attach token
    api.interceptors.request.use((config) => {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    useEffect(() => {
        // Decode JWT or fetch user profile on load if token exists
        // Simplification for this implementation demo
        if (token) {
            setUser({ isAuthenticated: true });
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await api.post('token/', { email, password });
            const { access, refresh } = response.data;
            localStorage.setItem('token', access);
            localStorage.setItem('refreshToken', refresh);
            setToken(access);
            setUser({ email, isAuthenticated: true });
            return true;
        } catch (error) {
            console.error("Login completely failed", error);
            return false;
        }
    };

    const register = async (email, password, firstName, lastName, yearOfStudy, faculty, programme, courses) => {
        try {
            await api.post('users/', { 
                email, 
                password,
                first_name: firstName,
                last_name: lastName,
                year_of_study: yearOfStudy ? parseInt(yearOfStudy) : null,
                faculty, 
                programme, 
                courses 
            });
            return await login(email, password);
        } catch (error) {
            console.error("Registration failed", error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, api, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

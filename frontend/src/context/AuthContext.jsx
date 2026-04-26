import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null); // Memory only! No localStorage.
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL || '/api/', // Use relative path to route through Vite proxy in dev
        withCredentials: true, // Send HttpOnly cookies for CSRF and Refresh Tokens
        xsrfCookieName: 'csrftoken',
        xsrfHeaderName: 'X-CSRFToken',
    });


    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, token = null) => {
        failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        failedQueue = [];
    };

    api.interceptors.request.use((config) => {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }
        return config;
    });

    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            
            if (error.response && error.response.status === 401 && !originalRequest._retry) {
                // If the failed request was a token generation or a token refresh, do NOT intercept it
                if (originalRequest.url.includes('auth/token/refresh/') || originalRequest.url.endsWith('auth/token/')) {
                    setToken(null);
                    setUser(null);
                    return Promise.reject(error);
                }

                if (isRefreshing) {
                    return new Promise(function(resolve, reject) {
                        failedQueue.push({ resolve, reject });
                    }).then(token => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return api(originalRequest);
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const response = await api.post('auth/token/refresh/');
                    const newAccessToken = response.data.access;
                    setToken(newAccessToken);
                    const parsed = parseJwt(newAccessToken) || {};
                    setUser(prev => ({ ...prev, ...parsed, isAuthenticated: true }));
                    
                    processQueue(null, newAccessToken);
                    originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                    return api(originalRequest);
                } catch (err) {
                    processQueue(err, null);
                    setToken(null);
                    setUser(null);
                    return Promise.reject(err);
                } finally {
                    isRefreshing = false;
                }
            }
            return Promise.reject(error);
        }
    );

    useEffect(() => {
        const attemptRestoreBaseSession = async () => {
            try {
                // Without a token, try silent refresh boot strap
                // Allow some time for CSRF cookie to settle on cross-origin mounts
                await new Promise(r => setTimeout(r, 50));
                
                const res = await api.post('auth/token/refresh/');
                if (res.data.access) {
                    setToken(res.data.access);
                    const parsed = parseJwt(res.data.access) || {};
                    setUser({ ...parsed, isAuthenticated: true });
                }
            } catch (err) {
                console.log("No active session found.");
            } finally {
                setLoading(false);
            }
        };

        if (!token && loading) {
            attemptRestoreBaseSession();
        } else {
            setLoading(false);
        }
    }, [token, loading]);

    const login = async (email, password) => {
        try {
            const response = await api.post('auth/token/', { email, password });
            const { access } = response.data; // refresh token resides exclusively in the browser's HttpOnly cookie vault
            setToken(access);
            const parsed = parseJwt(access) || {};
            setUser({ email, ...parsed, isAuthenticated: true });
            return true;
        } catch (error) {
            console.error("Login completely failed", error);
            throw error;
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
            return true;
        } catch (error) {
            console.error("Registration failed", error);
            // Re-throw or capture to display detailed form errors
            throw error; 
        }
    };

    const logout = async () => {
        try {
            await api.post('auth/logout/');
        } catch (err) { }
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

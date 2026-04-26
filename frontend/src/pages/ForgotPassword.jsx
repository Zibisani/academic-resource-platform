import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        
        setStatus('loading');
        setMessage('');
        
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';
            await axios.post(`${apiBase}auth/password-reset/request/`, { email });
            setStatus('success');
            setMessage("If an account exists with that email, we've sent you a password reset link.");
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.detail || "Failed to process request. Please try again later.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-8">
            <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden flex flex-col relative">
                
                {status === 'success' ? (
                    <div className="p-8 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h3 className="font-semibold tracking-tight text-2xl text-foreground mb-2">Check your inbox</h3>
                        <p className="text-muted-foreground leading-relaxed mb-8">
                            {message}
                        </p>
                        <Link to="/login" className="inline-flex justify-center items-center w-full bg-primary text-primary-foreground font-medium rounded-md px-4 py-2 hover:bg-primary/90 transition-colors h-10">
                            Return to login
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="px-6 pb-4 pt-8 flex flex-col space-y-1.5 text-center">
                            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                                <Mail className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold tracking-tight text-2xl">Forgot password?</h3>
                            <p className="text-sm text-muted-foreground">
                                No worries, we've got you covered. Enter your email and we'll send you reset instructions.
                            </p>
                        </div>
                        
                        <div className="p-6 pt-0 mt-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {status === 'error' && (
                                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">
                                        {message}
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none" htmlFor="email">
                                        University Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="student@ub.ac.bw"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2 disabled:opacity-50"
                                >
                                    {status === 'loading' ? (
                                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Reset Password <Send className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </button>
                            </form>
                            
                            <div className="mt-6 text-center">
                                <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to log in
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;

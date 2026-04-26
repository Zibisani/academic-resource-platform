import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');
    
    // Quick validation
    const hasMinLength = password.length >= 10;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const isValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSymbol;
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token || !email) {
            setStatus('error');
            setMessage('Invalid verification link. Parameters missing.');
            return;
        }
        
        if (!isValid) {
            setStatus('error');
            setMessage('Password does not meet the complexity requirements.');
            return;
        }
        
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }
        
        setStatus('loading');
        setMessage('');
        
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';
            await axios.post(`${apiBase}auth/password-reset/confirm/`, { 
                email,
                token,
                password 
            });
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.detail || "Failed to reset password. The link might be expired.");
        }
    };

    if (!token || !email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md bg-card p-6 rounded-xl border border-border shadow-sm text-center">
                    <h3 className="text-destructive font-semibold mb-2">Invalid Reset Link</h3>
                    <p className="text-muted-foreground text-sm mb-4">This link is invalid or missing necessary identification.</p>
                    <Link to="/forgot-password" className="text-primary hover:underline font-medium text-sm">
                        Request a new link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-8">
            <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden flex flex-col relative">
                
                {status === 'success' ? (
                    <div className="p-8 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6 text-success">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="font-semibold tracking-tight text-2xl text-foreground mb-2">Password Reset</h3>
                        <p className="text-muted-foreground leading-relaxed mb-8">
                            Your password has been successfully reset. You can now use your new password to log in.
                        </p>
                        <Link to="/login" className="inline-flex justify-center items-center w-full bg-primary text-primary-foreground font-medium rounded-md px-4 py-2 hover:bg-primary/90 transition-colors h-10">
                            Continue to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="px-6 pb-4 pt-8 flex flex-col space-y-1.5 text-center">
                            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                                <KeyRound className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold tracking-tight text-2xl">Create new password</h3>
                            <p className="text-sm text-muted-foreground">
                                Your new password must be unique and complex to keep your account secure.
                            </p>
                        </div>
                        
                        <div className="p-6 pt-0 mt-2">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {status === 'error' && (
                                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">
                                        {message}
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none" htmlFor="password">
                                        New Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                                        Confirm Password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                
                                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2 border border-border">
                                    <p className="font-semibold text-foreground">Password must contain:</p>
                                    <ul className="space-y-1 text-muted-foreground">
                                        <li className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-success' : 'bg-muted-foreground/30'}`}></div>
                                            At least 10 characters
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${hasUpper && hasLower ? 'bg-success' : 'bg-muted-foreground/30'}`}></div>
                                            Uppercase and lowercase letters
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-success' : 'bg-muted-foreground/30'}`}></div>
                                            At least one number
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${hasSymbol ? 'bg-success' : 'bg-muted-foreground/30'}`}></div>
                                            At least one special symbol
                                        </li>
                                    </ul>
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || !isValid || !password || password !== confirmPassword}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-4 disabled:opacity-50"
                                >
                                    {status === 'loading' ? (
                                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;

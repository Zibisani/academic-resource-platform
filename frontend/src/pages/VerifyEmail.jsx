import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const token = searchParams.get('token');
    
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                // Using standard axios since auth is not required
                const response = await axios.post('http://localhost:8000/api/users/verify-email/', {
                    user_id: id,
                    token: token
                });
                
                setStatus('success');
                setMessage(response.data.status || 'Email successfully verified!');
                
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Verification failed. Link may be invalid or expired.');
            }
        };

        verify();
    }, [id, token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full bg-card shadow-lg rounded-2xl p-8 border border-border text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                        <h2 className="text-xl font-semibold text-foreground">Verifying your email...</h2>
                        <p className="text-muted-foreground mt-2">Please wait while we validate your credentials securely.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 text-success mb-4" />
                        <h2 className="text-xl font-semibold text-foreground">Verification Complete!</h2>
                        <p className="text-muted-foreground mt-2">{message}</p>
                        <p className="text-sm mt-4 text-muted-foreground">Redirecting to login...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-destructive mb-4" />
                        <h2 className="text-xl font-semibold text-foreground">Verification Failed</h2>
                        <p className="text-muted-foreground mt-2">{message}</p>
                        <Link to="/login" className="mt-6 w-full inline-flex justify-center flex bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors">
                            Return to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Register = () => {
    useDocumentTitle('Create Account');
    const [formData, setFormData] = useState({
        email: '', password: '', confirmPassword: '', first_name: '', last_name: '', 
        year_of_study: '', faculty: '', programme: '', courses: []
    });
    
    const [faculties, setFaculties] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [courses, setCourses] = useState([]);
    
    const [error, setError] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const { register, api } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('faculties/').then(res => setFaculties(res.data.results || res.data || [])).catch(console.error);
    }, [api]);

    useEffect(() => {
        if (formData.faculty) {
            api.get(`programmes/?faculty_id=${formData.faculty}`).then(res => setProgrammes(res.data.results || res.data || [])).catch(console.error);
        } else {
            setProgrammes([]);
        }
        setFormData(prev => ({...prev, programme: '', courses: []}));
    }, [formData.faculty, api]);

    useEffect(() => {
        if (formData.programme) {
            api.get(`courses/?programme_id=${formData.programme}`).then(res => setCourses(res.data.results || res.data || [])).catch(console.error);
        } else {
            setCourses([]);
        }
        setFormData(prev => ({...prev, courses: []}));
    }, [formData.programme, api]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCourseChange = (e) => {
        const value = parseInt(e.target.value);
        if (e.target.checked) {
            // Add course to array
            setFormData({ ...formData, courses: [...formData.courses, value] });
        } else {
            // Remove course from array
            setFormData({ ...formData, courses: formData.courses.filter(id => id !== value) });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match.");
        }
        if (formData.courses.length === 0) {
            return setError("Please select at least one course.");
        }

        try {
            await register(
                formData.email,
                formData.password,
                formData.first_name,
                formData.last_name,
                formData.year_of_study,
                formData.faculty,
                formData.programme,
                formData.courses
            );
            setIsRegistered(true);
        } catch (err) {
            if (err.response?.data) {
                // Backend typically returns field-specific validation errors as an object mapping arrays
                if (typeof err.response.data === 'object' && !err.response.data.detail) {
                    setError(err.response.data);
                } else {
                    setError({ form: err.response.data.detail || 'Registration failed. Please check your inputs and try again.' });
                }
            } else {
                setError({ form: 'Network error. Please try again later.' });
            }
        }
    };

    const InputDesign = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background py-10 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-lg bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden flex flex-col relative">
                
                {isRegistered ? (
                    <div className="p-8 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </div>
                        <h3 className="font-semibold tracking-tight text-2xl text-foreground mb-2">Verification Email Sent!</h3>
                        <p className="text-muted-foreground leading-relaxed mb-8">
                            We've sent a verification link to <span className="font-semibold text-foreground">{formData.email}</span>.<br />
                            Please check your inbox and click the link to activate your account.
                        </p>
                        <Link to="/" className="inline-flex justify-center w-full bg-primary text-primary-foreground font-medium rounded-md px-4 py-2 hover:bg-primary/90 transition-colors">
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="px-6 pb-4 pt-8 flex flex-col space-y-1.5 text-center">
                            <h3 className="font-semibold tracking-tight text-2xl">Create an account</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                All fields below are mandatory
                            </p>
                        </div>

                        <div className="p-6 pt-0">
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">
                                        <ul className="list-disc list-inside space-y-1">
                                            {Object.entries(error).map(([field, messages]) => {
                                                const msgs = Array.isArray(messages) ? messages : [messages];
                                                return msgs.map((msg, i) => (
                                                    <li key={`${field}-${i}`}>
                                                        {field !== 'form' ? <span className="capitalize font-semibold mr-1">{field.replace('_', ' ')}:</span> : null} 
                                                        {msg}
                                                    </li>
                                                ));
                                            })}
                                        </ul>
                                    </div>
                                )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">First Name</label>
                                <input name="first_name" type="text" required className={InputDesign} placeholder="John" onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Last Name</label>
                                <input name="last_name" type="text" required className={InputDesign} placeholder="Doe" onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">University Email</label>
                            <input name="email" type="email" required className={InputDesign} placeholder="john.doe@ub.ac.bw" onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                                <input name="password" type="password" required className={InputDesign} placeholder="••••••••" onChange={handleChange} />
                                <p className="text-xs text-muted-foreground">Must be at least 10 chars with uppercase, lowercase, numbers & symbols.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Confirm Password</label>
                                <input name="confirmPassword" type="password" required className={InputDesign} placeholder="••••••••" onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Year of Study</label>
                                    <select name="year_of_study" required className={InputDesign} onChange={handleChange} value={formData.year_of_study}>
                                        <option value="" disabled>Select Year</option>
                                        {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Faculty</label>
                                    <select name="faculty" required className={InputDesign} onChange={handleChange} value={formData.faculty}>
                                        <option value="" disabled>Select Faculty</option>
                                        {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Programme</label>
                                <select name="programme" required disabled={!formData.faculty} className={InputDesign} onChange={handleChange} value={formData.programme}>
                                    <option value="" disabled>Select Programme</option>
                                    {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-medium leading-none">Enrolled Courses (Select multiple)</label>
                                <div className="h-32 overflow-y-auto border border-input rounded-md bg-transparent p-2 space-y-1 mt-1">
                                    {!formData.programme ? (
                                        <span className="text-sm text-muted-foreground p-2">Select a programme first.</span>
                                    ) : courses.length === 0 ? (
                                        <span className="text-sm text-muted-foreground p-2">No courses found.</span>
                                    ) : (
                                        courses.map(c => (
                                            <div key={c.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted rounded">
                                                <input 
                                                    type="checkbox" 
                                                    id={`course-${c.id}`} 
                                                    value={c.id} 
                                                    onChange={handleCourseChange}
                                                    checked={formData.courses.includes(c.id)}
                                                    className="h-4 w-4 rounded border-primary text-primary shadow focus:ring-1 focus:ring-ring"
                                                />
                                                <label htmlFor={`course-${c.id}`} className="text-sm cursor-pointer select-none">
                                                    <span className="font-semibold">{c.code}</span> - {c.name}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-4"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Verify Account
                        </button>
                    </form>

                    <div className="mt-5 text-center text-sm">
                        Already have an account?{" "}
                        <Link to="/login" className="underline underline-offset-4 hover:text-primary transition-colors">
                            Sign in
                        </Link>
                    </div>
                </div>
                </>
                )}
            </div>
        </div>
    );
};

export default Register;

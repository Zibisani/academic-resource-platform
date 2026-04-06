import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState('');
    const [error, setError] = useState('');
    
    const [faculties, setFaculties] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [courses, setCourses] = useState([]);

    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [selectedProgramme, setSelectedProgramme] = useState('');
    const [selectedCourses, setSelectedCourses] = useState([]);

    const { register, api } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:8000/api/faculties/')
            .then(res => setFaculties(res.data.results || res.data || []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedFaculty) {
            axios.get(`http://localhost:8000/api/programmes/?faculty_id=${selectedFaculty}`)
                .then(res => setProgrammes(res.data.results || res.data || []))
                .catch(console.error);
        } else {
            setProgrammes([]);
        }
    }, [selectedFaculty]);

    useEffect(() => {
        if (selectedProgramme) {
            axios.get(`http://localhost:8000/api/courses/?programme_id=${selectedProgramme}`)
                .then(res => setCourses(res.data.results || res.data || []))
                .catch(console.error);
        } else {
            setCourses([]);
        }
    }, [selectedProgramme]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirm) {
            setError("Passwords don't match.");
            return;
        }

        if (!email.toLowerCase().endsWith('@ub.ac.bw')) {
            setError("You must use a valid university email (@ub.ac.bw)");
            return;
        }

        const success = await register(email, password, firstName, lastName, yearOfStudy, selectedFaculty, selectedProgramme, selectedCourses);
        if (success) {
            navigate('/dashboard');
        } else {
            setError('Registration failed. Try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-900">
                        Create an account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                name="firstName"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                name="lastName"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="University Email address (@ub.ac.bw)"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                name="confirm"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Confirm Password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700">Academic Information</h3>
                        <select required value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                            <option value="">Select Year of Study</option>
                            <option value="1">Year 1</option>
                            <option value="2">Year 2</option>
                            <option value="3">Year 3</option>
                            <option value="4">Year 4</option>
                            <option value="5">Year 5 (or higher)</option>
                        </select>
                        <select required value={selectedFaculty} onChange={(e) => {
                            setSelectedFaculty(e.target.value);
                            setSelectedProgramme('');
                            setSelectedCourses([]);
                        }} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                            <option value="">Select Faculty</option>
                            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <select required value={selectedProgramme} onChange={(e) => {
                            setSelectedProgramme(e.target.value);
                            setSelectedCourses([]);
                        }} disabled={!selectedFaculty} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 sm:text-sm">
                            <option value="">Select Programme</option>
                            {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select multiple required value={selectedCourses} onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value);
                            setSelectedCourses(values);
                        }} disabled={!selectedProgramme} className="relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 sm:text-sm h-32">
                            {courses.map(c => <option key={c.id} value={c.id} className="p-1">[{c.code}] {c.name}</option>)}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple courses.</p>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            Register
                        </button>
                    </div>
                    <div className="text-center mt-4">
                        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                            Already have an account? Sign in.
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;

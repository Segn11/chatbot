import React, { useState } from 'react';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        // Simulate login logic here (you can call your login function from context)
        if (!email || !password) {
            setError('Both fields are required!');
        } else {
            setError('');
            // Perform login (You can replace this with real login logic)
            console.log('Logging in with:', email, password);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen px-4 no-scrollbar">
            <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Sign in to Chatgpt</h2>
                <form onSubmit={handleLogin}>
                <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Display error message if any */}
                    {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

                    <button
                        type="submit"
                        className="w-full p-3 bg-black text-white rounded-md hover:bg-gray-800 transition duration-300 ease-in-out"
                    >
                        Sign up
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                         have an account?{' '}
                        <a href="/login" className="text-blue-500 hover:underline">Login</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;

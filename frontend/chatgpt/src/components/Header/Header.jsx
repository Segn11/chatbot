import React, { useState } from 'react';
import Logo from '../logo/Logo';
import { BiMenuAltLeft } from 'react-icons/bi';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, isLoggedIn, login, logout, } = useAuth(); // Get authData from context

    return (
        <div className="w-full flex items-center justify-between py-2 ">
            {/* Logo: visible on md and larger screens */}
            <div className="hidden md:block">
                <Logo />
            </div>

            {/* Menu icon: visible on sm screens */}
            <div className="block md:hidden">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="text-2xl text-gray-800"
                >
                    <BiMenuAltLeft />
                </button>
            </div>

            {/* Button container */}
            <div className="flex gap-x-2 items-center text-sm justify-center">
                {/* Conditionally render buttons */}
                {isLoggedIn ? (
                    // If logged in, show Logout button
                    <>
                        <Link to={"/chat"}>
                            <button className="text-slate-800 border px-2 rounded-md py-1">
                                Go to chat
                            </button>
                        </Link>
                        <Link to={"/"}>
                            <button
                                onClick={logout}
                                className="px-2 bg-black rounded-md py-1 text-white">
                                Logout
                            </button>
                        </Link>


                    </>

                ) : (
                    // If not logged in, show Login and Sign-up buttons
                    <>
                        <Link to={"/login"}>
                            <button
                                onClick={login}
                                className="bg-slate-800 px-2 rounded-md py-1 text-white">
                                Login
                            </button>
                        </Link>
                        <Link to={"/signup"}>
                            <button className="border px-2 rounded-md py-1 text-slate-800">
                                Sign up
                            </button>
                        </Link>
                    </>
                )}
            </div>

            {/* Mobile menu with sliding animation */}
            <div
                className={`fixed top-0 left-0 h-full bg-white w-64 p-4 transition-transform transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'
                    } shadow-lg md:hidden z-50`}
            >
                <button
                    onClick={() => setMenuOpen(false)}
                    className="text-2xl text-gray-800 mb-4"
                >
                    <BiMenuAltLeft />
                </button>
                <button className="block py-2">Home</button>
                <button className="block py-2">About</button>
                <button className="block py-2">Contact</button>
            </div>
        </div>
    );
};

export default Header;

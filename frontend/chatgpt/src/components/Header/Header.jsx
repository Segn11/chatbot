import React, { useState } from "react";
import Logo from "../logo/Logo";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { BiMenuAltLeft, BiX } from "react-icons/bi";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <header className="w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#171717]/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation & Actions */}
        <div className="hidden md:flex items-center gap-x-4">
          <ThemeToggle />

          {isLoggedIn ? (
            <>
              <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                {user?.name}
              </span>
              <Link to="/chat">
                <button className="px-4 py-2 text-sm font-medium rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition shadow-sm">
                  Open Chat
                </button>
              </Link>
              <button
                onClick={logout}
                className="px-3.5 py-1.5 text-sm font-medium rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition">
                  Log in
                </button>
              </Link>
              <Link to="/signup">
                <button className="px-4 py-2 text-sm font-medium rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition shadow-sm">
                  Sign up
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-x-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-2xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            aria-label="Toggle menu"
          >
            {menuOpen ? <BiX /> : <BiMenuAltLeft />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-zinc-900 p-6 shadow-2xl flex flex-col justify-between border-l border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <Logo />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-2xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  <BiX />
                </button>
              </div>

              {isLoggedIn ? (
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Signed in as</p>
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/chat"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full py-2.5 text-center font-medium rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  >
                    Open Chat
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full py-2.5 text-center font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full py-2.5 text-center font-medium rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {isLoggedIn && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full py-2.5 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

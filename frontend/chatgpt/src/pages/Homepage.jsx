import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  RiSparklingFill,
  RiShieldCheckLine,
  RiSpeedUpLine,
  RiChatSmile3Line,
} from "react-icons/ri";
import { IoArrowForward } from "react-icons/io5";

const Homepage = () => {
  const { isLoggedIn, user } = useAuth();

  const samplePrompts = [
    "🚀 Explain quantum computing in 3 simple bullet points",
    "💻 Write a React hook to fetch and cache API data",
    "✍️ Draft a polite rejection email for an offer",
    "🎨 Brainstorm 5 naming ideas for an AI startup",
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center max-w-5xl mx-auto px-4">
      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 text-xs font-semibold tracking-wide text-zinc-800 dark:text-zinc-200 uppercase bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm">
        <RiSparklingFill className="text-emerald-500 text-sm" />
        Next-Gen Conversational AI
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl leading-[1.1] mb-6">
        Smarter Conversations. Faster Answers.{" "}
        <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
          Limitless Possibilities.
        </span>
      </h1>

      {/* Subheading */}
      <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-10 leading-relaxed font-normal">
        Your personal AI companion for coding, brainstorming, summarizing, and writing.
        Built with high-performance real-time streaming and persistent database sync.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
        {isLoggedIn ? (
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-base bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition shadow-lg shadow-zinc-900/10 dark:shadow-none"
          >
            <span>Continue as {user?.name}</span>
            <IoArrowForward />
          </Link>
        ) : (
          <>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-base bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition shadow-lg shadow-zinc-900/10 dark:shadow-none"
            >
              <span>Get Started Free</span>
              <IoArrowForward />
            </Link>
            <Link
              to="/login"
              className="px-7 py-3.5 rounded-full font-medium text-base border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Log In
            </Link>
          </>
        )}
      </div>

      {/* Sample Prompts Preview */}
      <div className="w-full max-w-3xl mb-16 p-6 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-sm text-left">
        <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
          Try asking things like:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {samplePrompts.map((prompt, index) => (
            <Link
              key={index}
              to={isLoggedIn ? "/chat" : "/signup"}
              className="p-3 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition shadow-sm truncate block"
            >
              {prompt}
            </Link>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1b1b1b] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-4">
            <RiSpeedUpLine />
          </div>
          <h3 className="font-semibold text-base text-zinc-900 dark:text-white mb-1.5">
            Real-Time Speed
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-normal">
            Low latency interactions with smooth response generation, ready for instant replies.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#1b1b1b] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl mb-4">
            <RiChatSmile3Line />
          </div>
          <h3 className="font-semibold text-base text-zinc-900 dark:text-white mb-1.5">
            Cloud MongoDB Sync
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-normal">
            Your conversations are automatically backed up to your MongoDB Atlas database.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#1b1b1b] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl mb-4">
            <RiShieldCheckLine />
          </div>
          <h3 className="font-semibold text-base text-zinc-900 dark:text-white mb-1.5">
            Secure Authentication
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-normal">
            Protected with bcrypt password hashing and signed HTTP-only JWT cookies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Homepage;

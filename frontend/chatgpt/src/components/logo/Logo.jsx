import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/chatbot-logo.svg";

const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="relative">
        <img
          src={logo}
          alt="Chatbot Logo"
          className="w-8 h-8 rounded-xl object-contain group-hover:scale-105 transition duration-200"
        />
      </div>
      <div className="flex items-center gap-1.5 font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
        <span>Chatbot</span>
      </div>
    </Link>
  );
};

export default Logo;

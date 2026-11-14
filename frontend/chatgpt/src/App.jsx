import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import Notfound from "./pages/Notfound";
import Login from "./pages/Login";
import Header from "./components/Header/Header";

const App = () => {
  const location = useLocation();
  const isChatRoute = location.pathname === "/chat";

  return (
    <div className="min-h-screen bg-white dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      {/* Show top header on non-chat pages, or seamless in chat */}
      {!isChatRoute && <Header />}

      <main className={`flex-1 flex flex-col ${!isChatRoute ? "px-4 sm:px-8 max-w-7xl mx-auto w-full" : "h-screen overflow-hidden"}`}>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Notfound />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

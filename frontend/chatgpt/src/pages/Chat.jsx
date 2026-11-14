import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  sendChatRequest,
  getUserChats,
  deleteUserChats,
} from "../helpers/api-communicator";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import botLogo from "../assets/chatbot-logo.svg";

// Icons
import {
  IoSend,
  IoSunnyOutline,
  IoMoonOutline,
  IoCopyOutline,
  IoCheckmark,
} from "react-icons/io5";
import {
  RiSideBarLine,
  RiAddLine,
  RiDeleteBinLine,
  RiLogoutBoxRLine,
} from "react-icons/ri";

const Chat = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const { user, isLoggedIn, loading: authLoading, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const sampleSuggestions = [
    { title: "Explain a concept", desc: "How do neural networks learn?" },
    { title: "Debug JavaScript", desc: "Find why my Promise doesn't resolve" },
    { title: "Write an email", desc: "Draft a polite follow-up after an interview" },
    { title: "Brainstorm ideas", desc: "Give me 5 unique side project ideas" },
  ];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, loading]);

  // Auth protection & chat retrieval
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
      return;
    }

    if (isLoggedIn) {
      getUserChats()
        .then((data) => {
          if (data?.chats) {
            setChatMessages(data.chats);
          }
        })
        .catch((err) => {
          console.error("Failed to load chats:", err);
        })
        .finally(() => {
          setInitialLoading(false);
        });
    }
  }, [isLoggedIn, authLoading, navigate]);

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleSendMessage = async (customMessage) => {
    const messageContent = (customMessage || input).trim();
    if (!messageContent || loading) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const optimisticUserMessage = { role: "user", content: messageContent };
    setChatMessages((prev) => [...prev, optimisticUserMessage]);
    setLoading(true);

    try {
      const data = await sendChatRequest(messageContent);
      if (data?.chats) {
        setChatMessages(data.chats);
      }
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    if (chatMessages.length === 0) return;
    if (!window.confirm("Clear all messages in this conversation?")) return;

    try {
      toast.loading("Clearing chat...", { id: "clear" });
      await deleteUserChats();
      setChatMessages([]);
      toast.success("Conversation cleared", { id: "clear" });
    } catch (error) {
      toast.error("Failed to clear chat", { id: "clear" });
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Copied to clipboard!");
  };

  if (authLoading || initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-[#212121]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Loading your conversation...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#212121] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* ===================== SIDEBAR ===================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 sm:static sm:z-0 flex flex-col bg-[#f9f9f9] dark:bg-[#171717] border-r border-zinc-200/80 dark:border-zinc-800/80 transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "w-64 sm:w-64 translate-x-0"
            : "-translate-x-full sm:w-0 sm:border-r-0 sm:overflow-hidden"
        }`}
      >
        <div className="p-3 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 min-w-[256px]">
          {/* New Chat Button */}
          <button
            onClick={handleClearChat}
            className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shadow-sm text-zinc-800 dark:text-zinc-200"
          >
            <RiAddLine className="text-lg text-indigo-500" />
            <span>New chat</span>
          </button>

          {/* Close Sidebar Toggle (Mobile / Desktop) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 ml-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <RiSideBarLine className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Content (Chat History / Recent) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 min-w-[256px]">
          <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-1">
            Current Session
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/90 text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer">
            <div className="flex items-center gap-2 truncate">
              <img src={botLogo} alt="Bot" className="w-4 h-4 object-contain shrink-0" />
              <span className="truncate">
                {chatMessages.length > 0
                  ? chatMessages[0].content.slice(0, 22) + "..."
                  : "New Conversation"}
              </span>
            </div>
            {chatMessages.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearChat();
                }}
                title="Clear conversation"
                className="text-zinc-400 hover:text-red-500 p-1 rounded"
              >
                <RiDeleteBinLine className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User Footer & Theme Toggle */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/50 min-w-[256px] space-y-2">
          {/* Theme Toggle Pill */}
          <div className="flex items-center justify-between px-2 py-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-medium">Appearance</span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              title="Toggle Light / Dark mode"
            >
              {isDark ? (
                <>
                  <IoSunnyOutline className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <IoMoonOutline className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs uppercase shrink-0">
                {user?.name ? user.name.slice(0, 2) : "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition"
            >
              <RiLogoutBoxRLine className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ===================== MAIN CHAT AREA ===================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#212121]">
        {/* Top Navbar */}
        <header className="h-14 px-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-white/70 dark:bg-[#212121]/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-label="Toggle sidebar"
            >
              <RiSideBarLine className="w-5 h-5" />
            </button>

            {/* Model Badge with Logo */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80">
              <img src={botLogo} alt="Logo" className="w-4 h-4 object-contain" />
              <span>Multi-Model AI</span>
            </div>
          </div>

          {/* Right Action Icons: Home link, Theme Toggle & Logout */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Home
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition border border-zinc-200/60 dark:border-zinc-700/60"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <IoSunnyOutline className="w-4 h-4 text-amber-400" />
              ) : (
                <IoMoonOutline className="w-4 h-4 text-zinc-700" />
              )}
            </button>

            <button
              onClick={logout}
              className="p-2 text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition border border-zinc-200/60 dark:border-zinc-700/60"
              title="Logout"
              aria-label="Logout"
            >
              <RiLogoutBoxRLine className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
          {chatMessages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12">
              <img src={botLogo} alt="Chatbot" className="w-16 h-16 object-contain mb-4 drop-shadow-md" />

              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                What can I help with today?
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
                Ask questions, explore ideas, generate code, or draft content.
              </p>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {sampleSuggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(item.desc)}
                    className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition text-left group"
                  >
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 mb-1 group-hover:text-indigo-500 transition">
                      {item.title}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Render Messages */
            <div className="max-w-3xl mx-auto space-y-6">
              {chatMessages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3.5 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    {isUser ? (
                      <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold shrink-0">
                        {user?.name ? user.name.slice(0, 1).toUpperCase() : "U"}
                      </div>
                    ) : (
                      <img
                        src={botLogo}
                        alt="AI"
                        className="w-8 h-8 rounded-xl object-contain shrink-0 shadow-sm"
                      />
                    )}

                    {/* Message Bubble & Content */}
                    <div
                      className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? "bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 rounded-tr-sm"
                          : "bg-zinc-100/90 dark:bg-[#1a1a1a] text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 rounded-tl-sm"
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="prose dark:prose-invert max-w-none text-sm break-words">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}

                      {/* Copy message button */}
                      {!isUser && (
                        <div className="mt-2 flex items-center justify-end border-t border-zinc-200/50 dark:border-zinc-800 pt-1.5 text-xs text-zinc-400">
                          <button
                            onClick={() => copyToClipboard(msg.content, index)}
                            className="inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition py-0.5 px-1.5 rounded"
                            title="Copy message"
                          >
                            {copiedIndex === index ? (
                              <>
                                <IoCheckmark className="text-emerald-500 w-3.5 h-3.5" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <IoCopyOutline className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pulsing loading state */}
              {loading && (
                <div className="flex items-start gap-3.5">
                  <img
                    src={botLogo}
                    alt="AI"
                    className="w-8 h-8 rounded-xl object-contain shrink-0 animate-pulse"
                  />
                  <div className="bg-zinc-100 dark:bg-[#1a1a1a] border border-zinc-200/80 dark:border-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse"></span>
                    <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse [animation-delay:200ms]"></span>
                    <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse [animation-delay:400ms]"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input Dock */}
        <div className="p-4 md:px-8 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#212121]/80 backdrop-blur-md shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end bg-zinc-100 dark:bg-[#181818] border border-zinc-300/80 dark:border-zinc-700/80 rounded-2xl shadow-sm focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition duration-150 p-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Chatbot... (Shift + Enter for new line)"
                disabled={loading}
                className="w-full bg-transparent px-3 py-1.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none resize-none max-h-48 overflow-y-auto leading-relaxed"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || loading}
                className="p-2 ml-1 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition shrink-0"
                aria-label="Send message"
              >
                <IoSend className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500 mt-2">
              Chatbot may produce inaccurate information about people, places, or facts.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;

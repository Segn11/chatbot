import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  sendChatRequest,
  getConversations,
  getConversation,
  renameConversation,
  deleteConversation,
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
  RiMessage3Line,
  RiEdit2Line,
  RiCheckLine,
  RiCloseLine,
} from "react-icons/ri";

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Inline rename state
  const [editingConvId, setEditingConvId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

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

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, loading]);

  // Load user conversations on mount
  const loadConversations = async (autoSelectFirst = true) => {
    try {
      const data = await getConversations();
      const list = data?.conversations || [];
      setConversations(list);

      if (autoSelectFirst && list.length > 0) {
        const latest = list[0];
        setActiveConversationId(latest._id);
        const convData = await getConversation(latest._id);
        setChatMessages(convData?.chats || []);
      } else if (list.length === 0) {
        setActiveConversationId(null);
        setChatMessages([]);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      // Fallback: try legacy getUserChats
      try {
        const fallback = await getUserChats();
        if (fallback?.chats?.length > 0) {
          setChatMessages(fallback.chats);
        }
      } catch (e) {
        console.error("Fallback chat retrieval failed:", e);
      }
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
      return;
    }

    if (isLoggedIn) {
      loadConversations(true);
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

  // Select an existing conversation from the sidebar
  const handleSelectConversation = async (convId) => {
    if (convId === activeConversationId || loading) return;

    setActiveConversationId(convId);
    setLoading(true);
    try {
      const data = await getConversation(convId);
      setChatMessages(data?.chats || []);
    } catch (error) {
      toast.error(error.message || "Failed to load conversation");
    } finally {
      setLoading(false);
    }

    // On mobile, close sidebar drawer
    if (window.innerWidth < 640) {
      setIsSidebarOpen(false);
    }
  };

  // Start a fresh conversation
  const handleNewChat = () => {
    setActiveConversationId(null);
    setChatMessages([]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    if (window.innerWidth < 640) {
      setIsSidebarOpen(false);
    }
  };

  // Send a message (continue active conversation or start a new one)
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
      const isNewChat = !activeConversationId;
      const data = await sendChatRequest(messageContent, activeConversationId);

      if (data?.chats) {
        setChatMessages(data.chats);
      }

      // If this was a new conversation, set the newly generated ID
      if (isNewChat && data?.conversationId) {
        setActiveConversationId(data.conversationId);
      }

      // Refresh conversations list in background to update titles and ordering
      const convListRes = await getConversations();
      if (convListRes?.conversations) {
        setConversations(convListRes.conversations);
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

  // Start inline renaming
  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingConvId(conv._id);
    setEditingTitle(conv.title || "New Chat");
  };

  // Save renamed conversation
  const handleSaveRename = async (convId, e) => {
    e?.stopPropagation();
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      toast.error("Conversation title cannot be empty");
      return;
    }

    try {
      await renameConversation(convId, trimmed);
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, title: trimmed } : c))
      );
      setEditingConvId(null);
      toast.success("Conversation renamed");
    } catch (error) {
      toast.error(error.message || "Failed to rename conversation");
    }
  };

  // Cancel inline renaming
  const handleCancelRename = (e) => {
    e?.stopPropagation();
    setEditingConvId(null);
    setEditingTitle("");
  };

  // Delete a specific conversation
  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;

    try {
      toast.loading("Deleting conversation...", { id: "delete-conv" });
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));

      // If the currently active conversation was deleted, reset to New Chat
      if (activeConversationId === convId) {
        setActiveConversationId(null);
        setChatMessages([]);
      }

      toast.success("Conversation deleted", { id: "delete-conv" });
    } catch (error) {
      toast.error(error.message || "Failed to delete conversation", { id: "delete-conv" });
    }
  };

  // Clear all conversations
  const handleClearAllHistory = async () => {
    if (conversations.length === 0 && chatMessages.length === 0) return;
    if (!window.confirm("Clear all conversations and chat history? This cannot be undone.")) return;

    try {
      toast.loading("Clearing all history...", { id: "clear-all" });
      await deleteUserChats();
      setConversations([]);
      setActiveConversationId(null);
      setChatMessages([]);
      toast.success("All chat history cleared", { id: "clear-all" });
    } catch (error) {
      toast.error("Failed to clear chat history", { id: "clear-all" });
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
            Loading conversations...
          </span>
        </div>
      </div>
    );
  }

  const currentTitle =
    conversations.find((c) => c._id === activeConversationId)?.title ||
    (chatMessages.length > 0 ? "Conversation" : "New Chat");

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#212121] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* ===================== SIDEBAR ===================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 sm:static sm:z-0 flex flex-col bg-[#f9f9f9] dark:bg-[#171717] border-r border-zinc-200/80 dark:border-zinc-800/80 transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "w-72 sm:w-72 translate-x-0"
            : "-translate-x-full sm:w-0 sm:border-r-0 sm:overflow-hidden"
        }`}
      >
        {/* Top Action Bar (New Chat + Sidebar Toggle) */}
        <div className="p-3 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 min-w-[288px]">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shadow-sm text-zinc-800 dark:text-zinc-200"
          >
            <RiAddLine className="text-lg text-indigo-500" />
            <span>New chat</span>
          </button>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 ml-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <RiSideBarLine className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-w-[288px] custom-scrollbar">
          <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            <span>Conversations</span>
            {conversations.length > 0 && (
              <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full text-zinc-500 dark:text-zinc-400 font-mono">
                {conversations.length}
              </span>
            )}
          </div>

          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
              No previous conversations.<br />Start your first chat above!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv._id === activeConversationId;
              const isEditing = conv._id === editingConvId;

              if (isEditing) {
                return (
                  <div
                    key={conv._id}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 p-1.5 rounded-xl bg-zinc-200/90 dark:bg-zinc-800 text-sm"
                  >
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(conv._id, e);
                        if (e.key === "Escape") handleCancelRename(e);
                      }}
                      autoFocus
                      maxLength={100}
                      className="flex-1 bg-white dark:bg-zinc-900 px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={(e) => handleSaveRename(conv._id, e)}
                      title="Save"
                      className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      <RiCheckLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelRename}
                      title="Cancel"
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <RiCloseLine className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv._id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-zinc-200/90 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                    <RiMessage3Line
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                      }`}
                    />
                    <span className="truncate text-xs sm:text-sm" title={conv.title}>
                      {conv.title || "New Chat"}
                    </span>
                  </div>

                  {/* Actions: Rename & Delete (visible on hover / active) */}
                  <div
                    className={`flex items-center gap-1 shrink-0 ${
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    } transition-opacity duration-150`}
                  >
                    <button
                      onClick={(e) => handleStartRename(conv, e)}
                      title="Rename conversation"
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-300/50 dark:hover:bg-zinc-700 transition"
                    >
                      <RiEdit2Line className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv._id, e)}
                      title="Delete conversation"
                      className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-zinc-300/50 dark:hover:bg-zinc-700 transition"
                    >
                      <RiDeleteBinLine className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Clear All History Button */}
        {conversations.length > 0 && (
          <div className="px-3 py-2 border-t border-zinc-200/60 dark:border-zinc-800/60 min-w-[288px]">
            <button
              onClick={handleClearAllHistory}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <RiDeleteBinLine className="w-3.5 h-3.5" />
              <span>Clear all conversations</span>
            </button>
          </div>
        )}

        {/* User Footer & Theme Toggle */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/50 min-w-[288px] space-y-2">
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

            {/* Conversation Title & Model Badge */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80">
                <img src={botLogo} alt="Logo" className="w-4 h-4 object-contain" />
                <span className="truncate max-w-[120px] sm:max-w-[180px]" title={currentTitle}>
                  {currentTitle}
                </span>
              </div>
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
            /* Empty State / Welcome Hero */
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

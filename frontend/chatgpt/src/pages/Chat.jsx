import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { sendChatRequest } from "../helpers/api-communicator";

const Chat = () => {


  const inputRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState(["Chat 1", "Chat 2"]);

  const { user } = useAuth();

  const handleSendMessage = async () => {
    const content = inputRef.current?.value?.trim();

    if (!content) return; // Avoid sending empty messages

    // Clear the input field
    inputRef.current.value = "";

    const newMessage = { role: "user", content };
    setChatMessages((prev) => [...prev, newMessage]);

    try {
      const chatData = await sendChatRequest(content);
      if (chatData?.chats) {
        setChatMessages((prev) => [...prev, ...chatData.chats]);
      } else {
        console.error("Chat data is invalid or empty.");
      }
    } catch (error) {
      console.error("Error handling the chat response:", error);
    }
  };


  return (
    <div className="flex h-80vh bg-gray-100 border-t">
      {/* Sidebar */}
      <div className="w-1/4 border-r text-black p-4 flex flex-col space-y-6 md:w-1/5">
        {/* Profile Section */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gray-600"></div>
          <div>
            <h3 className="text-lg font-semibold">{user?.name}</h3>
            <p className="text-sm text-gray-400">Active now</p>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm uppercase font-semibold mb-2">Chat History</h4>
          <ul className="space-y-2">
            {chatHistory.map((chat, index) => (
              <li
                key={index}
                className="p-2 rounded-lg bg-gray-300 hover:bg-gray-200 cursor-pointer"
              >
                {chat}
              </li>
            ))}
          </ul>
        </div>

        {/* Add New Chat */}
        <button className="w-full py-2 bg-slate-900 hover:bg-blue-600 rounded-lg text-white font-semibold">
          New Chat
        </button>
      </div>

      {/* Chat Area */}
      <div className="w-full flex-1 flex flex-col ">
        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {chatMessages.length === 0 ? (
            <p className="text-center text-gray-500">Start a conversation...</p>
          ) : (
            chatMessages.map((msg, index) => (
              <div key={index} className="flex items-start">
                {/* Role */}
                <div className="w-24 text-sm font-semibold text-gray-600">
                  {msg.role === "user" ? "User" : "Assistant"}
                </div>
                {/* Content */}
                <div
                  className={`flex-1 ${msg.role === "user" ? "bg-blue-100" : "bg-gray-200"
                    } p-3 rounded-lg max-w-lg`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>


        {/* Input Box */}
        <div className="p-4 border-t border-gray-300">
          <div className="flex space-x-4">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 p-3 border rounded-lg focus:outline-none"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

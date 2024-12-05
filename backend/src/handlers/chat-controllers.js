import dotenv from 'dotenv';
import https from 'https'; // Import https for custom agent
import crypto from 'crypto'; // Import crypto for SSL options
import OpenAI from 'openai'; // Import OpenAI SDK
import User from "../models/User.js"; // Import User model

dotenv.config(); // Load environment variables

// Configure OpenAI SDK with custom HTTPS agent
const agent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: false, // Temporarily set to false for debugging; enable after ensuring no certificate issues
    secureOptions:
        crypto.constants.SSL_OP_NO_TLSv1 |
        crypto.constants.SSL_OP_NO_TLSv1_1 |
        crypto.constants.SSL_OP_NO_RENEGOTIATION,
});

const openai = new OpenAI({
    apiKey: process.env.GROK_API_KEY, // Your Grok API key
    baseURL: "https://api.grok.ai/v1", // Grok API base URL
    defaultOptions: {
        timeout: 5000, // Optional: Adjust timeout as needed
        agent, // Use the custom HTTPS agent
    },
});

// Generate Chat Completion Controller
export const generateChatCompletion = async (req, res) => {
    try {
        const { message } = req.body; // Extract user's message from request body
        const user = await User.findById(res.locals.jwtData.id); // Get user data using JWT

        if (!user) {
            return res.status(401).json({ message: "User not registered or Token malfunctioned" });
        }

        // Prepare chat history
        const chats = user.chats.map(({ role, content }) => ({
            role,
            content,
        }));
        chats.push({ role: "user", content: message });

        // Make API call to Grok
        const completion = await openai.chat.completions.create({
            model: "grok-advanced", // Replace with actual model name if different
            messages: chats,
        });

        // Extract AI's response from the API response
        if (completion.choices && completion.choices.length > 0) {
            const aiMessage = completion.choices[0].message.content;

            // Save AI's response to user's chat history
            user.chats.push({ role: "assistant", content: aiMessage });
            await user.save();

            // Return updated chat history to the client
            return res.status(200).json({ chats: user.chats });
        } else {
            return res.status(400).json({ message: "Chat data is invalid or empty." });
        }
    } catch (error) {
        console.error("Error generating chat completion:", error);

        // Handle errors and send appropriate response
        return res.status(500).json({
            message: "Something went wrong!",
            error: error.message,
            details: error, // Optional: Add more error details for debugging
        });
    }
};
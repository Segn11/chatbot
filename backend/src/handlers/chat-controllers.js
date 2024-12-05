import User from "../models/User.js";
import dotenv from 'dotenv'; // Import dotenv to load environment variables
import { OpenAI } from 'openai'; // Import OpenAI directly

// Load environment variables from .env file
dotenv.config();

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Use your OpenAI API key
});

export const generateChatCompletion = async (req, res) => {
    try {
        const { message } = req.body; // Get the user message from request body
        const user = await User.findById(res.locals.jwtData.id); // Find user by ID

        if (!user) {
            return res.status(401).json({ message: "User not registered or Token malfunctioned" });
        }

        // Prepare chat history as an array of message objects
        const chats = user.chats.map(({ role, content }) => ({
            role,
            content, // Ensure this is the correct structure
        }));

        // Add current user message as the last entry
        chats.push({
            role: "user",
            content: message, // Directly use the message
        });

        // Log the prepared chats for debugging
        console.log("Prepared chat data for API:", JSON.stringify(chats, null, 2));

        // Call the OpenAI chat completion API
        const chatResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Replace with your desired model
            messages: chats, // Pass the array of messages
        });

        // Log the API response for debugging
        console.log("Received chat response:", JSON.stringify(chatResponse.data, null, 2));

        if (chatResponse.choices && chatResponse.choices.length > 0) {
            const aiMessage = chatResponse.choices[0].message.content; // Extract AI's response text
            user.chats.push({ role: "assistant", content: aiMessage }); // Add AI message to user's chat history
            await user.save(); // Save updated chat history to the database
            return res.status(200).json({ chats: user.chats }); // Respond with updated chats
        } else {
            console.error("Chat data is invalid or empty.");
            return res.status(400).json({ message: "Chat data is invalid or empty." });
        }
    } catch (error) {
        console.error("Error generating chat completion:", error);
        return res.status(500).json({ message: "Something went wrong!", error: error.message });
    }
};

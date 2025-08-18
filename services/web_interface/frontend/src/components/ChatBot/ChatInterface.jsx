import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import './ChatInterface.css';

// A simple component to render each chat message
const ChatMessage = ({ message, onSuggestionClick }) => (
    <div className={`chat-message-wrapper chat-message-${message.sender}`}>
        <div className="chat-message">
            <p>{message.text}</p>
            {message.suggestions && message.suggestions.length > 0 && (
                <div className="suggestions">
                    {message.suggestions.map((suggestion, index) => (
                        <button key={index} onClick={() => onSuggestionClick(suggestion)} className="suggestion-chip">
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>
);

// A simple typing indicator
const TypingIndicator = () => <div className="typing-indicator"><span></span><span></span><span></span></div>;

export function ChatInterface({ userId, isVisible }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // The WebSocket URL for the chatbot agent. Port 8012 is mapped in docker-compose.
    // In a real production environment, this would point to the gateway URL.
    const CHATBOT_URL = `ws://${window.location.hostname}:8012/api/v1/chat/ws/${userId}`;
    const { sendMessage, lastMessage, readyState } = useWebSocket(isVisible ? CHATBOT_URL : null);

    // Scroll to the bottom of the message list when new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle incoming messages from the WebSocket
    useEffect(() => {
        if (lastMessage !== null) {
            try {
                const chatMessage = JSON.parse(lastMessage.data);
                if (chatMessage.text) {
                     setMessages(prev => [...prev, {
                        id: chatMessage.message_id || Date.now(),
                        text: chatMessage.text,
                        sender: 'bot',
                        timestamp: chatMessage.timestamp,
                        suggestions: chatMessage.suggestions || []
                    }]);
                }
            } catch (e) {
                console.error("Failed to parse incoming message:", e);
            }
            setIsTyping(false);
        }
    }, [lastMessage]);

    const handleSendMessage = (text) => {
        if (!text.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: text,
            sender: 'user',
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        sendMessage(JSON.stringify({
            type: 'user_message',
            text: text,
            timestamp: new Date().toISOString()
        }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSendMessage(inputMessage);
        setInputMessage('');
    };

    const handleSuggestionClick = (suggestion) => {
        handleSendMessage(suggestion);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>FluxRevenue Assistant</h3>
            </div>
            <div className="chat-messages">
                {messages.map(message => (
                    <ChatMessage key={message.id} message={message} onSuggestionClick={handleSuggestionClick} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-area">
                <form onSubmit={handleFormSubmit}>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask FluxRevenue..."
                        disabled={readyState !== WebSocket.OPEN}
                    />
                    <button type="submit" disabled={readyState !== WebSocket.OPEN}>
                        Send
                    </button>
                </form>
                 <div className="connection-status">
                    {readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected'}
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook to manage WebSocket connections.
 * @param {string} url The WebSocket URL to connect to.
 * @returns {{sendMessage: function, lastMessage: MessageEvent | null, readyState: number}}
 */
export const useWebSocket = (url) => {
    const [lastMessage, setLastMessage] = useState(null);
    const [readyState, setReadyState] = useState(WebSocket.CONNECTING);
    const ws = useRef(null);

    useEffect(() => {
        if (!url) {
            return;
        }

        ws.current = new WebSocket(url);
        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setReadyState(WebSocket.OPEN);
        };
        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
            setReadyState(WebSocket.CLOSED);
        };
        ws.current.onmessage = (event) => {
            setLastMessage(event);
        };
        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setReadyState(WebSocket.CLOSED); // Consider a specific error state
        };

        // Cleanup function to close the WebSocket connection on component unmount
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [url]);

    const sendMessage = (message) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(message);
        } else {
            console.error('WebSocket is not connected.');
        }
    };

    return { sendMessage, lastMessage, readyState };
};

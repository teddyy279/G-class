import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * useWebSocket - Hook kết nối STOMP over SockJS.
 * @param {string} topic - STOMP topic to subscribe (e.g. /topic/comments.{id})
 * @param {function} onMessage - Callback khi nhận message
 * @param {boolean} enabled - Chỉ kết nối khi true
 */
export default function useWebSocket(topic, onMessage, enabled = true) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!enabled || !topic) return;

    const token = localStorage.getItem('accessToken');
    const wsUrl = `${import.meta.env.VITE_API_BASE_URL}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            onMessage(data);
          } catch (e) {
            console.error('WebSocket message parse error:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [topic, enabled]);
}

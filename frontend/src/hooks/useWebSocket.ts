import { useEffect, useRef } from 'react';

export function useWebSocket(url: string, onMessage: (message: any) => void) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket connecté');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('❌ Erreur de parsing message WebSocket:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('❌ Erreur WebSocket:', err);
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket déconnecté');
    };

    return () => {
      socket.close();
    };
  }, [url, onMessage]);
}

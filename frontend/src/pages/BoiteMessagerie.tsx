import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';

interface Message {
  id: string;
  content: string;
  from: { fullName: string };
  to: { fullName: string };
  createdAt: string;
}

const BoiteMessagerie: React.FC = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const API_URL = process.env.REACT_APP_API_URL;
  const WS_URL = process.env.REACT_APP_API_WS;

  // Fonction de traitement des messages reçus via WebSocket
  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'NEW_MESSAGE') {
      setMessages((prev) => [data.message, ...prev]);
    }
  };

  useWebSocket(`${WS_URL}/ws/messages/${user?.id}`, handleWebSocketMessage);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_URL}/messages/recus`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages', error);
      }
    };

    if (token && user) {
      fetchMessages();
    }
  }, [token, user]);

  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded p-4">
      <h2 className="text-xl font-bold mb-4">Messagerie</h2>
      {messages.length === 0 ? (
        <p>Aucun message.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((msg) => (
            <li key={msg.id} className="border-b pb-2">
              <div className="text-sm text-gray-500">
                De : {msg.from.fullName} • {new Date(msg.createdAt).toLocaleString()}
              </div>
              <div className="text-gray-800">{msg.content}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BoiteMessagerie;

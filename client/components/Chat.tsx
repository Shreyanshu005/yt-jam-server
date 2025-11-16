import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  username: string;
  currentUserId: string;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, username, currentUserId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Chat</h3>
        <p className="text-xs text-gray-400">Talk with viewers</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.userId === currentUserId ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  msg.userId === currentUserId
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold">
                    {msg.userId === currentUserId ? 'You' : msg.username}
                  </span>
                  <span className="text-xs opacity-70">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to send • {inputMessage.length}/500
        </p>
      </div>
    </div>
  );
};

export default Chat;

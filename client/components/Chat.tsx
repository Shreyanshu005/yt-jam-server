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
    <div className="flex flex-col h-full glass-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">💬 Chat</h3>
        <p className="text-[10px] text-gray-600 mt-0.5">Talk with everyone</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 ? (
          <div className="text-center text-gray-700 text-[11px] mt-8">
            <div className="text-2xl mb-2">💬</div>
            No messages yet
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.userId === currentUserId ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-xl px-3 py-2 ${
                  msg.userId === currentUserId
                    ? 'bg-gradient-to-br from-red-500/80 to-pink-600/80 text-white'
                    : 'bg-white/[0.04] text-gray-200 border border-white/[0.04]'
                }`}
              >
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold opacity-80">
                    {msg.userId === currentUserId ? 'You' : msg.username}
                  </span>
                  <span className="text-[9px] opacity-40 font-mono">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-xs break-words leading-relaxed">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.04]">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-xl px-3.5 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/10 text-xs transition-all"
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className="px-4 py-2 rounded-xl font-semibold transition-all text-xs bg-gradient-to-r from-red-500/80 to-pink-600/80 hover:from-red-500 hover:to-pink-600 disabled:opacity-20 disabled:cursor-not-allowed text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

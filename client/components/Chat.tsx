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
  isPookie?: boolean;
}

const EMOJI_CATEGORIES = [
  { name: '❤️', emojis: ['❤️', '💖', '💕', '💗', '💓', '💞', '💘', '🩷', '🥰', '😘', '😍', '🤗', '💋', '🫶', '💑', '💌'] },
  { name: '😊', emojis: ['😊', '😂', '🤣', '😭', '🥺', '😢', '🙈', '🙉', '😏', '😉', '🤭', '😋', '🥹', '😇', '🫣', '😜'] },
  { name: '🎵', emojis: ['🎵', '🎶', '🎧', '🎤', '🎷', '🎸', '🎹', '🥁', '🔊', '🔥', '⚡', '✨', '💫', '🌟', '🪩', '🎀'] },
  { name: '👋', emojis: ['👋', '👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '💪', '🫡', '🤟', '🖤', '💅', '🤙', '👑', '🦋'] },
];

const STICKERS = [
  { emoji: '🐻', label: 'Bear Hug' },
  { emoji: '🦋', label: 'Butterfly' },
  { emoji: '🌸', label: 'Blossom' },
  { emoji: '🎀', label: 'Ribbon' },
  { emoji: '🧸', label: 'Teddy' },
  { emoji: '🌈', label: 'Rainbow' },
  { emoji: '🍰', label: 'Cake' },
  { emoji: '🦄', label: 'Unicorn' },
  { emoji: '🐱', label: 'Kitty' },
  { emoji: '💐', label: 'Bouquet' },
  { emoji: '🍓', label: 'Berry' },
  { emoji: '🧁', label: 'Cupcake' },
];

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, username, currentUserId, isPookie = false }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'emoji' | 'sticker'>('emoji');
  const [activeCategory, setActiveCategory] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;
        
        if (file.size > 2 * 1024 * 1024) {
          alert('Sticker is too large. Please use a smaller one (under 2MB).');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          if (base64String) {
            onSendMessage(base64String);
            setShowEmojiPicker(false);
          }
        };
        reader.readAsDataURL(file);
        break; 
      }
    }
  };

  const addEmoji = (emoji: string) => {
    setInputMessage(prev => prev + emoji);
  };

  const sendSticker = (sticker: string) => {
    onSendMessage(sticker);
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if a message is a sticker (single emoji, 1-2 chars or emoji with variation selector)
  const isSticker = (msg: string) => {
    const chars = Array.from(msg);
    return chars.length === 1 && msg.length <= 4;
  };

  return (
    <div className="flex flex-col h-full glass-card">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isPookie ? 'border-pink-400/10' : 'border-white/[0.04]'}`}>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${isPookie ? 'text-pink-300' : 'text-gray-400'}`}>
          {isPookie ? '💌 Love Notes' : '💬 Chat'}
        </h3>
        <p className={`text-[10px] mt-0.5 ${isPookie ? 'text-pink-300/50' : 'text-gray-600'}`}>
          {isPookie ? 'Send cute messages~' : 'Talk with everyone'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 ? (
          <div className={`text-center text-[11px] mt-8 ${isPookie ? 'text-pink-300/40' : 'text-gray-700'}`}>
            <div className="text-2xl mb-2">{isPookie ? '💌' : '💬'}</div>
            {isPookie ? 'Send the first love note~ 💕' : 'No messages yet'}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.userId === currentUserId ? 'items-end' : 'items-start'}`}
            >
              {isSticker(msg.message) ? (
                /* Sticker message — big emoji */
                <div className="text-center py-1">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`text-[10px] font-semibold ${isPookie ? 'text-pink-300/70' : 'opacity-60'}`}>
                      {msg.userId === currentUserId ? 'You' : msg.username}
                    </span>
                    <span className={`text-[9px] font-mono ${isPookie ? 'text-pink-300/30' : 'opacity-40'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="text-5xl leading-none py-1 drop-shadow-lg">{msg.message}</div>
                </div>
              ) : msg.message.startsWith('data:image/') ? (
                /* Native mobile sticker / pasted image */
                <div className={`py-1 ${msg.userId === currentUserId ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-baseline gap-2 mb-0.5 ${msg.userId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] font-semibold ${isPookie ? 'text-pink-300/70' : 'opacity-60'}`}>
                      {msg.userId === currentUserId ? 'You' : msg.username}
                    </span>
                    <span className={`text-[9px] font-mono ${isPookie ? 'text-pink-300/30' : 'opacity-40'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <img 
                    src={msg.message} 
                    alt="Pasted sticker" 
                    className="max-w-[140px] max-h-[140px] rounded-lg shadow-sm object-contain bg-transparent inline-block" 
                  />
                </div>
              ) : (
                /* Regular message */
                <div
                  className={`max-w-[82%] rounded-xl px-3 py-2 ${
                    msg.userId === currentUserId
                      ? isPookie
                        ? 'bg-gradient-to-br from-pink-500/80 to-fuchsia-600/80 text-white'
                        : 'bg-gradient-to-br from-red-500/80 to-pink-600/80 text-white'
                      : isPookie
                        ? 'bg-pink-900/20 text-pink-100 border border-pink-400/10'
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
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className={`border-t mx-2 mb-1 rounded-xl overflow-hidden animate-[fadeSlideIn_0.2s_ease-out] ${isPookie ? 'bg-[rgba(50,8,35,0.95)] border-pink-400/15' : 'bg-[rgb(18,18,30)] border-white/[0.06]'}`}>
          {/* Tabs */}
          <div className={`flex border-b ${isPookie ? 'border-pink-400/10' : 'border-white/[0.04]'}`}>
            <button
              onClick={() => setActiveTab('emoji')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${activeTab === 'emoji' ? (isPookie ? 'text-pink-300 border-b-2 border-pink-400' : 'text-white border-b-2 border-red-500') : (isPookie ? 'text-pink-400/40' : 'text-gray-600')}`}
            >
              😊 Emojis
            </button>
            <button
              onClick={() => setActiveTab('sticker')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${activeTab === 'sticker' ? (isPookie ? 'text-pink-300 border-b-2 border-pink-400' : 'text-white border-b-2 border-red-500') : (isPookie ? 'text-pink-400/40' : 'text-gray-600')}`}
            >
              🧸 Stickers
            </button>
          </div>

          {activeTab === 'emoji' ? (
            <>
              {/* Category tabs */}
              <div className={`flex gap-1 px-2 py-1.5 border-b ${isPookie ? 'border-pink-400/8' : 'border-white/[0.03]'}`}>
                {EMOJI_CATEGORIES.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCategory(i)}
                    className={`text-sm px-2 py-1 rounded-md transition-colors ${i === activeCategory ? (isPookie ? 'bg-pink-500/15' : 'bg-white/[0.06]') : 'hover:bg-white/[0.03]'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {/* Emoji grid */}
              <div className="grid grid-cols-8 gap-0.5 p-2 max-h-[120px] overflow-y-auto">
                {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => addEmoji(emoji)}
                    className="text-lg p-1 rounded-md hover:bg-white/[0.06] active:scale-90 transition-all text-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Sticker grid */
            <div className="grid grid-cols-4 gap-1 p-2 max-h-[140px] overflow-y-auto">
              {STICKERS.map((sticker, i) => (
                <button
                  key={i}
                  onClick={() => sendSticker(sticker.emoji)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all hover:scale-105 active:scale-95 ${isPookie ? 'hover:bg-pink-500/10' : 'hover:bg-white/[0.05]'}`}
                >
                  <span className="text-2xl">{sticker.emoji}</span>
                  <span className={`text-[8px] ${isPookie ? 'text-pink-300/40' : 'text-gray-600'}`}>{sticker.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className={`p-3 border-t ${isPookie ? 'border-pink-400/10' : 'border-white/[0.04]'}`}>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`flex-shrink-0 p-2 rounded-xl transition-all ${
              showEmojiPicker
                ? isPookie ? 'bg-pink-500/15 text-pink-300' : 'bg-white/[0.06] text-white'
                : isPookie ? 'text-pink-400/40 hover:text-pink-300 hover:bg-pink-500/10' : 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.03]'
            }`}
          >
            <span className="text-base">😊</span>
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            placeholder={isPookie ? 'Send a love note or paste a sticker~' : 'Type a message or paste a sticker...'}
            className={`flex-1 border rounded-xl px-3.5 py-2 placeholder-opacity-50 focus:outline-none text-xs transition-all ${
              isPookie
                ? 'bg-pink-900/20 border-pink-400/10 text-pink-100 placeholder-pink-300/30 focus:border-pink-400/30 focus:ring-1 focus:ring-pink-400/10'
                : 'bg-white/[0.03] border-white/[0.05] text-white placeholder-gray-600 focus:border-red-500/30 focus:ring-1 focus:ring-red-500/10'
            }`}
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className={`px-4 py-2 rounded-xl font-semibold transition-all text-xs disabled:opacity-20 disabled:cursor-not-allowed text-white ${
              isPookie
                ? 'bg-gradient-to-r from-pink-500/80 to-fuchsia-600/80 hover:from-pink-500 hover:to-fuchsia-600'
                : 'bg-gradient-to-r from-red-500/80 to-pink-600/80 hover:from-red-500 hover:to-pink-600'
            }`}
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

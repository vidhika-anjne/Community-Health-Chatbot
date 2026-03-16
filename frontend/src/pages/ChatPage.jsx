import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ChatPage = () => {
    const [sessionId] = useState(`session-${Math.random().toString(36).substr(2, 9)}`);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { id: 1, sender: 'BOT', content: "Hello! I'm your Public Health Assistant. How can I help you today? You can ask about symptoms, prevention tips, or vaccine information.", timestamp: new Date() }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    const quickOptions = [
      { label: "Check Symptoms", icon: "🌡️" },
      { label: "Prevention Tips", icon: "🛡️" },
      { label: "Vaccine Guide", icon: "💉" },
      { label: "COVID-19 Info", icon: "🦠" },
      { label: "Health Myths", icon: "🧠" }
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const userMsg = { id: Date.now(), sender: 'USER', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await axios.post('/api/public/chat', { 
                sessionId: sessionId, 
                message: text 
            });

            const fullResponse = response.data.response;
            const botMsgId = Date.now() + 1;
            setMessages(prev => [...prev, { id: botMsgId, sender: 'BOT', content: '', timestamp: new Date() }]);
            setIsTyping(false);

            let currentText = '';
            const words = fullResponse.split(' ');
            for(let i = 0; i < words.length; i++) {
                currentText += (i === 0 ? '' : ' ') + words[i];
                const update = currentText;
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: update } : m));
                await new Promise(resolve => setTimeout(resolve, 20));
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { id: Date.now(), sender: 'BOT', content: "Sorry, I'm having trouble connecting to the health server right now. Please try again later.", timestamp: new Date() }]);
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] bg-transparent">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="bg-blue-600 p-2.5 rounded-2xl shadow-blue-500/20 shadow-lg">
                            <Bot className="text-white" size={24} />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white dark:border-slate-950 rounded-full"></span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white text-lg">HealthAI Assistant</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Always active for your health</p>
                    </div>
                </div>
                <div className="flex gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <ShieldCheck size={14} className="text-green-500" />
                    Verified Content
                  </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-6 px-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-4 max-w-[85%] sm:max-w-[75%] ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`h-10 w-10 flex-shrink-0 rounded-2xl flex items-center justify-center shadow-sm ${
                                  msg.sender === 'USER' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700'
                                }`}>
                                    {msg.sender === 'USER' ? <User size={20} /> : <Bot size={20} />}
                                </div>
                                <div className={`relative px-5 py-4 rounded-3xl shadow-sm ${
                                  msg.sender === 'USER' 
                                  ? 'bg-blue-600 text-white rounded-tr-none' 
                                  : 'bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700 rounded-tl-none'
                                }`}>
                                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    <p className={`text-[10px] mt-2 opacity-40 ${msg.sender === 'USER' ? 'text-right' : ''}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-4 justify-start px-2">
                             <div className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border dark:border-slate-700 shadow-sm">
                                <Bot size={20} className="text-blue-600 animate-pulse" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-3xl rounded-tl-none px-6 py-4 flex gap-1.5 items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
                <div ref={scrollRef} className="h-4" />
            </div>

            {/* Input & Options Area */}
            <div className="mt-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Quick Options */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {quickOptions.map((opt, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSend(opt.label)}
                                className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
                            >
                                <span>{opt.icon}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Text input container */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-15 group-focus-within:opacity-30 transition-opacity"></div>
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="relative flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 pl-6 shadow-xl"
                        >
                            <Sparkles size={20} className="text-blue-500 hidden sm:block" />
                            <input 
                                type="text" 
                                className="flex-1 bg-transparent py-3 text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none"
                                placeholder="Describe symptoms or ask a health question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim()}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
                                  input.trim() 
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md transform active:scale-95' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <span className="hidden sm:inline font-bold">Send</span>
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;

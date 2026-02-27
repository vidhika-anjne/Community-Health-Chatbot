import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, AlertTriangle, ShieldCheck, ChevronRight, MessageSquareDashed } from 'lucide-react';
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

    const quickOptions = ["Symptoms checker", "Prevention tips", "COVID-19", "Myth vs Fact", "Dengue"];

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

            // Simulate token-by-token streaming effect
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
                await new Promise(resolve => setTimeout(resolve, 30)); // Delay between words
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { id: Date.now(), sender: 'BOT', content: "Sorry, I'm having trouble connecting to the health server right now. Please try again later.", timestamp: new Date() }]);
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-2 rounded-xl">
                        <Bot className="text-primary-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">Public Health Bot</h2>
                        <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                        </span>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-4 text-slate-500 text-sm">
                    <span className="flex items-center gap-1"><ShieldCheck size={16} /> Verified Sources</span>
                    <span className="flex items-center gap-1"><AlertTriangle size={16} /> Awareness Only</span>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4">
                <div className="max-w-3xl mx-auto flex flex-col min-h-full">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div 
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'USER' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'USER' ? 'bg-primary-200 text-primary-700' : 'bg-slate-200 text-slate-600'}`}>
                                        {msg.sender === 'USER' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${msg.sender === 'USER' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none'}`}>
                                        <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                                        <span className={`text-[10px] mt-1 block opacity-50 ${msg.sender === 'USER' ? 'text-right' : ''}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {isTyping && (
                        <div className="flex gap-2 items-start opacity-70">
                            <div className="mt-1 h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center h-10">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} className="h-4" />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4 md:p-6 pb-8">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* Quick Options chips */}
                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {quickOptions.map((opt, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSend(opt)}
                                className="px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 hover:bg-primary-50 hover:border-primary-200 whitespace-nowrap transition-colors"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    {/* Disclaimer */}
                    <p className="text-[10px] text-center text-slate-400 italic">
                        Disclaimer: This bot provides general health information. If you're experiencing an emergency, call your local emergency number immediately.
                    </p>

                    {/* Text input */}
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="relative flex items-center gap-2"
                    >
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-inner"
                            placeholder="Type your health question here..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim()}
                            className={`absolute right-2 p-3 rounded-xl transition-all ${input.trim() ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-md' : 'text-slate-300 pointer-events-none'}`}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;

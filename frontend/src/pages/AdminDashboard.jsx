import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, MessageSquare, Users, Plus, Edit, Trash, CheckCircle, Clock, TrendingUp, Lock, ArrowRight, Activity, ShieldCheck, FileUp } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
    const savedAuth = JSON.parse(localStorage.getItem('adminAuth'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!savedAuth);
    const [loginData, setLoginData] = useState(savedAuth || { username: '', password: '' });
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({ totalChats: 0, recentChats: 0, topTopics: [], helpfulStats: 0 });

    const getAuthHeader = () => ({ 'Authorization': 'Basic ' + btoa(loginData.username + ":" + loginData.password) });

    const handleLogin = (e) => {
        e.preventDefault();
        axios.get('/api/admin/stats', { headers: getAuthHeader() })
            .then(res => {
                setStats(res.data);
                setIsAuthenticated(true);
                localStorage.setItem('adminAuth', JSON.stringify(loginData));
            })
            .catch(err => {
                const message = err.response?.status === 401 
                    ? "Invalid credentials. Please check your username and password."
                    : "Server connection failed. Is the backend running on port 8083?";
                alert(message);
                console.error("Login failed:", err);
            });
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setLoginData({ username: '', password: '' });
        localStorage.removeItem('adminAuth');
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800"
                >
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-500/20 mb-6">
                            <Lock className="text-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Admin Portal</h1>
                        <p className="text-slate-500 dark:text-slate-400">Secure access for health personnel.</p>
                        <p className="mt-2 text-[10px] text-slate-400 font-mono">Default: admin / password123</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Identifier</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                                value={loginData.username}
                                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                                placeholder="Username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Access Code</label>
                            <input 
                                type="password" 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                                value={loginData.password}
                                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
                            Authenticate <ArrowRight size={20} />
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">Admin Console</h1>
                    <p className="text-slate-600 dark:text-slate-400">Real-time system monitoring and content management.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border dark:border-slate-700">
                      <Activity className="text-green-500" />
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="px-6 py-3 bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-500 rounded-2xl font-bold border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                    >
                      Sign Out
                    </button>
                </div>
            </header>

            <nav className="flex gap-2 bg-white dark:bg-slate-900 p-2 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 w-fit">
                {[
                  { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
                  { id: 'kb', icon: BookOpen, label: 'Articles' },
                  { id: 'chats', icon: MessageSquare, label: 'Logs' },
                  { id: 'analytics', icon: TrendingUp, label: 'Analytics' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                      activeTab === item.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Conversations', value: stats.totalChats || 0, icon: MessageSquare, color: 'blue' },
                    { label: 'Helpfulness', value: '4.8/5', icon: ShieldCheck, color: 'green' },
                    { label: 'System Load', value: '12%', icon: Activity, color: 'indigo' },
                    { label: 'Verified KB', value: '1,240', icon: BookOpen, color: 'rose' }
                ].map((stat, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between"
                    >
                        <div>
                            <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">{stat.label}</p>
                            <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white">{stat.value}</h4>
                        </div>
                        <div className={`p-4 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                            <stat.icon size={24} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active System Tasks</h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20">
                        <Plus size={18} /> New Entry
                    </button>
                </div>
                <div className="py-20 text-center bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-full inline-flex mb-4 text-slate-300 dark:text-slate-700">
                        <Activity size={48} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Waiting for live stream data...</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

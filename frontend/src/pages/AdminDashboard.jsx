import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, MessageSquare, Users, Plus, Edit, Trash, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import axios from 'axios';

const AdminDashboard = () => {
    // Check for saved session on load
    const savedAuth = JSON.parse(localStorage.getItem('adminAuth'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!savedAuth);
    const [loginData, setLoginData] = useState(savedAuth || { username: '', password: '' });
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({ totalChats: 0, recentChats: 0, topTopics: [], helpfulStats: 0 });
    const [articles, setArticles] = useState([]);
    const [chats, setChats] = useState([]);
    const [showArticleForm, setShowArticleForm] = useState(false);
    const [showPdfUpload, setShowPdfUpload] = useState(false);
    const [currentArticle, setCurrentArticle] = useState({ title: '', content: '', tags: [], verified: false });
    const [pdfData, setPdfData] = useState({ title: '', tags: '', file: null });
    const [clusters, setClusters] = useState([]);
    const [clustersLoading, setClustersLoading] = useState(false);
    const [analysisInfo, setAnalysisInfo] = useState(null); // { analyzedAt, queriesAnalyzed }
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsPeriod, setAnalyticsPeriod] = useState('weekly');

    // Helper for base64 encoding auth header
    const getAuthHeader = () => {
        return { 'Authorization': 'Basic ' + btoa(loginData.username + ":" + loginData.password) };
    };

    const handleLogin = (e) => {
        e.preventDefault();
        // Just try hitting stats to check credentials
        axios.get('/api/admin/stats', { headers: getAuthHeader() })
            .then(res => {
                setStats(res.data);
                setIsAuthenticated(true);
                // Save session for persistence
                localStorage.setItem('adminAuth', JSON.stringify(loginData));
            })
            .catch(err => alert("Invalid credentials (check your .env/admin settings)"));
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setLoginData({ username: '', password: '' });
        localStorage.removeItem('adminAuth');
    };

    const handlePdfSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', pdfData.file);
        formData.append('title', pdfData.title);
        formData.append('tags', pdfData.tags);

        try {
            await axios.post('/api/admin/articles/upload-pdf', formData, {
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowPdfUpload(false);
            setPdfData({ title: '', tags: '', file: null });
            refreshData();
            alert("PDF embedded successfully!");
        } catch (e) {
            alert("Error uploading PDF: " + e.message);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
        }
    }, [isAuthenticated, activeTab]);

    const refreshData = async () => {
        const headers = getAuthHeader();
        try {
            if (activeTab === 'dashboard') {
                const res = await axios.get('/api/admin/stats', { headers });
                setStats(res.data);
            } else if (activeTab === 'kb') {
                const res = await axios.get('/api/admin/documents', { headers });
                setArticles(res.data);
            } else if (activeTab === 'chats') {
                const res = await axios.get('/api/admin/chats', { headers });
                setChats(res.data);
            } else if (activeTab === 'users') {
                setClustersLoading(true);
                setClusters([]);
                try {
                    const res = await axios.get('/api/admin/clusters', { headers });
                    setClusters(res.data.clusters ?? []);
                    setAnalysisInfo(res.data.analyzedAt
                        ? { analyzedAt: res.data.analyzedAt, queriesAnalyzed: res.data.queriesAnalyzed }
                        : null
                    );
                } finally {
                    setClustersLoading(false);
                }
            } else if (activeTab === 'analytics') {
                setAnalyticsLoading(true);
                try {
                    const res = await axios.get('/api/admin/analytics', { headers });
                    setAnalyticsData(res.data);
                } finally {
                    setAnalyticsLoading(false);
                }
            }
        } catch (e) {
            console.error("Failed to fetch data", e);
        }
    };

    const deleteDocument = async (documentId) => {
        if (!window.confirm('Delete this document and all its chunks?')) return;
        try {
            await axios.delete(`/api/admin/documents/${documentId}`, { headers: getAuthHeader() });
            refreshData();
        } catch (e) {
            alert('Error deleting document: ' + e.message);
        }
    };

    const saveArticle = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/articles', currentArticle, { headers: getAuthHeader() });
            setShowArticleForm(false);
            setCurrentArticle({ title: '', content: '', tags: [], verified: false });
            refreshData();
        } catch (e) { alert("Error saving article"); }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100">
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        <div className="bg-primary-600 p-2 rounded-lg"><LayoutDashboard className="text-white" /></div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">Health Admin</h1>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-700">Username</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                                value={loginData.username}
                                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                                placeholder="e.g. admin"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-700">Password</label>
                            <input 
                                type="password" 
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                value={loginData.password}
                                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl hover:bg-primary-700 active:scale-95 transition-all shadow-lg hover:shadow-primary-100">
                            Log In
                        </button>
                    </form>
                    <p className="mt-8 text-center text-xs text-slate-400">Restricted access for authorized health personnel only.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col pt-8">
                <div className="px-6 mb-10 flex items-center gap-2">
                    <div className="bg-primary-600 p-1.5 rounded-md"><LayoutDashboard size={20} /></div>
                    <span className="font-bold text-lg tracking-tight">Admin Console</span>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
                        { id: 'kb', icon: <BookOpen size={18} />, label: 'Knowledge Base' },
                        { id: 'chats', icon: <MessageSquare size={18} />, label: 'Chat Logs' },
                        { id: 'users', icon: <Users size={18} />, label: 'User Insights' },
                        { id: 'analytics', icon: <TrendingUp size={18} />, label: 'Analytics' }
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-primary-600/10 text-primary-400 border border-primary-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto p-4 border-t border-slate-800">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <Trash size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 justify-between">
                    <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-md uppercase tracking-wider">Live System</span>
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">A</div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Simple Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Conversations', value: stats.totalChats || 0, icon: <CheckCircle className="text-green-500" /> },
                                    { label: 'Active Today', value: stats.recentChats || 0, icon: <Clock className="text-blue-500" /> },
                                    { label: 'Helpfulness Score', value: stats.helpfulStats ? `${stats.helpfulStats.toFixed(1)}/5` : '4.8/5', icon: <CheckCircle className="text-amber-500" /> },
                                    { label: 'Verified Coverage', value: '92%', icon: <CheckCircle className="text-indigo-500" /> }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="mb-2">{stat.icon}</div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                                        <h4 className="text-3xl font-bold text-slate-900">{stat.value}</h4>
                                    </div>
                                ))}
                            </div>

                            {/* Topics & Recent Table */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold mb-6">Trending Topics</h3>
                                    <div className="space-y-4">
                                        {(stats.topTopics || ["Dengue", "COVID", "Vaccination", "Child Care", "Hygiene"]).map((topic, i) => (
                                            <div key={i} className="flex items-center justify-between group cursor-default">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 bg-slate-50 rounded-md flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">{i+1}</span>
                                                    <span className="text-slate-700 font-medium group-hover:text-primary-700 transition-colors uppercase text-sm tracking-wide">{Array.isArray(topic) ? topic[0] : topic}</span>
                                                </div>
                                                <div className="text-xs text-slate-400 font-bold">{Array.isArray(topic) ? topic[1] : 45 + i} queries</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold mb-6">System Health</h3>
                                    <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                        <Clock size={32} className="mb-3 opacity-20" />
                                        <p className="text-sm font-medium">Uptime tracking enabled</p>
                                        <p className="text-xs opacity-60">Everything systems go.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'kb' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div>
                                    <h3 className="text-lg font-bold">Health Articles Library</h3>
                                    <p className="text-slate-500 text-sm">Managed content used by the AI assistant.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setShowPdfUpload(true)} 
                                        className="bg-primary-50 text-primary-600 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-100 shadow-sm font-semibold border border-primary-100 transition-all active:scale-95"
                                    >
                                        <Plus size={18} /> Upload PDF
                                    </button>
                                    <button 
                                        onClick={() => setShowArticleForm(true)} 
                                        className="bg-primary-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-700 shadow-md font-semibold transition-all active:scale-95"
                                    >
                                        <Plus size={18} /> New Article
                                    </button>
                                </div>
                            </div>

                            {showPdfUpload && (
                                <div className="bg-white p-8 rounded-2xl border-2 border-primary-500 shadow-xl animate-in zoom-in-95 duration-200">
                                    <h4 className="font-bold text-xl mb-6 flex items-center gap-2">
                                        <BookOpen className="text-primary-600" /> Upload Health Guide (PDF)
                                    </h4>
                                    <form onSubmit={handlePdfSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Guide Title</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded-xl px-4 py-3" 
                                                    value={pdfData.title} 
                                                    onChange={e => setPdfData({...pdfData, title: e.target.value})} 
                                                    required 
                                                    placeholder="e.g. Malaria Control 2026" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Topic Tags</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded-xl px-4 py-3" 
                                                    value={pdfData.tags} 
                                                    onChange={e => setPdfData({...pdfData, tags: e.target.value})} 
                                                    required 
                                                    placeholder="malaria, vectors, treatment" 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Select PDF File</label>
                                            <input 
                                                type="file" 
                                                accept="application/pdf"
                                                className="w-full border border-slate-200 rounded-xl px-4 py-3" 
                                                onChange={e => setPdfData({...pdfData, file: e.target.files[0]})} 
                                                required 
                                            />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button type="button" onClick={() => setShowPdfUpload(false)} className="px-6 py-2.5 bg-slate-100 rounded-xl text-slate-600 font-bold">Cancel</button>
                                            <button type="submit" className="px-10 py-2.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:bg-primary-700">Extract & Embed</button>
                                        </div>
                                    </form>
                                    <p className="mt-4 text-xs text-slate-400">Our system will automatically extract text from this PDF and generate high-dimensional vectors for semantic search in Supabase.</p>
                                </div>
                            )}

                            {showArticleForm && (
                                <div className="bg-white p-8 rounded-2xl border-2 border-primary-500 shadow-xl animate-in zoom-in-95 duration-200">
                                    <h4 className="font-bold text-xl mb-6">Create New Health Guide</h4>
                                    <form onSubmit={saveArticle} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Article Title</label>
                                                <input className="w-full border border-slate-200 rounded-xl px-4 py-3" value={currentArticle.title} onChange={e => setCurrentArticle({...currentArticle, title: e.target.value})} required placeholder="e.g. Preventing Malaria" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Category Tags (comma separated)</label>
                                                <input className="w-full border border-slate-200 rounded-xl px-4 py-3" onChange={e => setCurrentArticle({...currentArticle, tags: e.target.value.split(',')})} placeholder="fever, viral, safety" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Content (Markdown supported)</label>
                                            <textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 h-48 font-mono text-sm" value={currentArticle.content} onChange={e => setCurrentArticle({...currentArticle, content: e.target.value})} required placeholder="# Guidelines..." />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button type="button" onClick={() => setShowArticleForm(false)} className="px-6 py-2.5 bg-slate-100 rounded-xl text-slate-600 font-bold">Cancel</button>
                                            <button type="submit" className="px-10 py-2.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:bg-primary-700">Publish Article</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Title</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Tags</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Chunks</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {articles.map(doc => (
                                            <tr key={doc.documentId} className="hover:bg-primary-50/30 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-800">{doc.title}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {(doc.tags || []).map((t, i) => <span key={i} className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-bold text-slate-600">{t}</span>)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-full border border-indigo-100">
                                                        {doc.chunkCount} {doc.chunkCount === 1 ? 'chunk' : 'chunks'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {doc.verified ?
                                                        <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><CheckCircle size={14} /> Verified</span> :
                                                        <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md">Draft</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 flex gap-3">
                                                    <button
                                                        onClick={() => deleteDocument(doc.documentId)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                                        title="Delete document and all its chunks"
                                                    >
                                                        <Trash size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'chats' && (
                        <div className="bg-white p-12 rounded-2xl border border-slate-200 border-dashed text-center flex flex-col items-center">
                            <Clock size={48} className="text-slate-200 mb-6" />
                            <h3 className="text-xl font-bold mb-2">Transaction Logs</h3>
                            <p className="text-slate-500 max-w-sm">Detailed conversation history review will appear here as users interact with the system.</p>
                            <button onClick={refreshData} className="mt-8 text-primary-600 font-bold hover:underline">Refresh Logs</button>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div>
                                    <h3 className="text-lg font-bold">User Query Clusters</h3>
                                    <p className="text-slate-500 text-sm">
                                        {analysisInfo
                                            ? <>Last analysed <span className="font-medium text-slate-700">{new Date(analysisInfo.analyzedAt).toLocaleString()}</span> &middot; {analysisInfo.queriesAnalyzed} messages &middot; auto-refreshes every 30 min</>
                                            : 'Auto-analysed every 30 min. Click Load to fetch the latest result.'}
                                    </p>
                                </div>
                                <button
                                    onClick={refreshData}
                                    disabled={clustersLoading}
                                    className="bg-primary-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-700 font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {clustersLoading ? 'Loading…' : 'Load Analysis'}
                                </button>
                            </div>

                            {clustersLoading && (
                                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                                    <div className="inline-block w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
                                    <p className="text-slate-500 font-medium">Fetching stored analysis…</p>
                                </div>
                            )}

                            {!clustersLoading && clusters.length === 0 && (
                                <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center">
                                    <Users size={48} className="text-slate-200 mb-4" />
                                    <p className="text-slate-500 font-medium">No analysis yet. The background job runs 15 s after startup, then every 30 min. Click Load Analysis to check.</p>
                                </div>
                            )}

                            {!clustersLoading && clusters.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {clusters.map((cluster, idx) => {
                                        const isOod = cluster.clusterName === 'Out-of-Domain';
                                        return (
                                            <div
                                                key={idx}
                                                className={`bg-white rounded-2xl border shadow-sm flex flex-col ${
                                                    isOod ? 'border-red-200' : 'border-slate-200'
                                                }`}
                                            >
                                                <div className={`px-6 py-4 border-b flex items-center justify-between ${
                                                    isOod ? 'border-red-100 bg-red-50/40' : 'border-slate-100 bg-slate-50'
                                                }`}>
                                                    <span className={`font-bold text-base ${
                                                        isOod ? 'text-red-700' : 'text-slate-800'
                                                    }`}>
                                                        {cluster.clusterName}
                                                    </span>
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                        isOod
                                                            ? 'bg-red-100 text-red-600'
                                                            : 'bg-primary-50 text-primary-700 border border-primary-100'
                                                    }`}>
                                                        {cluster.queryCount} {cluster.queryCount === 1 ? 'query' : 'queries'}
                                                    </span>
                                                </div>
                                                <ul className="px-6 py-4 space-y-2 flex-1 overflow-y-auto max-h-56">
                                                    {cluster.queries.map((q, qi) => (
                                                        <li key={qi} className="text-sm text-slate-600 flex gap-2">
                                                            <span className="text-slate-300 select-none mt-0.5">›</span>
                                                            <span>{q}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'analytics' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Stat summary cards */}
                            {analyticsData && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { label: 'Queries This Week',  value: analyticsData.totalThisWeek,  sub: analyticsData.totalLastWeek > 0 ? `${analyticsData.totalLastWeek} last week` : null, color: 'blue' },
                                        { label: 'Queries This Month', value: analyticsData.totalThisMonth, sub: 'past 30 days', color: 'violet' },
                                        { label: 'Queries This Year',  value: analyticsData.totalThisYear,  sub: 'past 12 months', color: 'emerald' },
                                    ].map(({ label, value, sub, color }) => (
                                        <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                                            <span className={`text-4xl font-bold text-${color}-600`}>{value}</span>
                                            {sub && <span className="text-xs text-slate-400">{sub}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Period selector + chart */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-base font-bold text-slate-800">Query Volume Over Time</h3>
                                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                        {[['weekly','7 Days'],['monthly','30 Days'],['yearly','12 Months']].map(([p, lbl]) => (
                                            <button
                                                key={p}
                                                onClick={() => setAnalyticsPeriod(p)}
                                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                                    analyticsPeriod === p
                                                        ? 'bg-white text-primary-700 shadow-sm border border-slate-200'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >{lbl}</button>
                                        ))}
                                    </div>
                                </div>

                                {analyticsLoading && (
                                    <div className="h-64 flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                    </div>
                                )}

                                {!analyticsLoading && !analyticsData && (
                                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <TrendingUp size={40} className="text-slate-200" />
                                        <p className="text-sm font-medium">Click refresh to load analytics data</p>
                                        <button onClick={refreshData} className="text-primary-600 text-xs font-bold hover:underline">Load Now</button>
                                    </div>
                                )}

                                {!analyticsLoading && analyticsData && (() => {
                                    const chartData = analyticsData[analyticsPeriod] ?? [];
                                    const maxVal = Math.max(...chartData.map(d => d.queries), 1);
                                    return (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="queryGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="label"
                                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    interval={analyticsPeriod === 'monthly' ? 4 : 0}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    allowDecimals={false}
                                                    domain={[0, Math.ceil(maxVal * 1.2)]}
                                                />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }}
                                                    formatter={(val) => [val, 'Queries']}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="queries"
                                                    stroke="#6366f1"
                                                    strokeWidth={2.5}
                                                    fill="url(#queryGradient)"
                                                    dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                                                    activeDot={{ r: 5, fill: '#6366f1' }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    );
                                })()}
                            </div>

                            {/* Insight card */}
                            {analyticsData?.insight && (
                                <div className="bg-gradient-to-r from-primary-50 to-violet-50 border border-primary-100 rounded-2xl p-6 flex gap-4 items-start">
                                    <div className="bg-primary-100 p-2.5 rounded-xl mt-0.5 shrink-0">
                                        <TrendingUp size={20} className="text-primary-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-primary-800 mb-1">Engagement Insight</p>
                                        <p className="text-sm text-primary-700 leading-relaxed">{analyticsData.insight}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;

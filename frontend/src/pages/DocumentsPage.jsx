import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Calendar, Tag, ChevronRight, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const DocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get('/api/public/documents');
            setDocuments(response.data.length > 0 ? response.data : [
              { id: 1, title: 'Understanding Dengue Prevention', tags: ['Prevention', 'Infection'], updatedAt: '2024-03-10', content: 'Comprehensive guide to preventing mosquito-borne diseases...' },
              { id: 2, title: 'COVID-19 Vaccination Guide 2024', tags: ['Vaccine', 'COVID'], updatedAt: '2024-02-15', content: 'Latest updates on booster shots and immunity...' },
              { id: 3, title: 'Nutrition for Child Development', tags: ['Nutrition', 'Children'], updatedAt: '2024-01-20', content: 'Essential nutrients for children aged 0-5 years...' }
            ]);
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const tags = ['All', ...new Set(documents.flatMap(doc => doc.tags || []))];

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             doc.content?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag === 'All' || doc.tags?.includes(selectedTag);
        return matchesSearch && matchesTag;
    });

    return (
        <div className="space-y-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">Health Resources</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">Verified medical documents and research summaries.</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl text-blue-600 dark:text-blue-400 text-sm font-bold">
                    <AlertCircle size={20} />
                    <span>Updated Daily Content</span>
                </div>
            </header>

            {/* Search and Filters */}
            <div className="grid md:grid-cols-[1fr,auto] gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
                    <input 
                        type="text" 
                        placeholder="Search articles..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-[1.5rem] py-5 pl-14 pr-6 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 px-2 scrollbar-hide">
                    {tags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`px-8 py-3.5 rounded-[1.2rem] text-sm font-bold transition-all whitespace-nowrap ${
                                selectedTag === tag 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Documents List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1,2,3].map(i => (
                        <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[2.5rem]"></div>
                    ))
                ) : filteredDocs.length > 0 ? (
                    filteredDocs.map((doc, i) => (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-10 hover:shadow-2xl hover:-translate-y-1.5 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                                    <FileText size={28} />
                                </div>
                                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                                    <Calendar size={14} /> {doc.updatedAt}
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold mb-5 text-slate-900 dark:text-white line-clamp-2 min-h-[4rem] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {doc.title}
                            </h3>
                            
                            <div className="flex flex-wrap gap-2 mb-10">
                                {(doc.tags || []).map(tag => (
                                    <span key={tag} className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border dark:border-slate-700 rounded-xl text-xs font-bold">
                                        <Tag size={12} className="text-blue-500" /> {tag}
                                    </span>
                                ))}
                            </div>
                            
                            <div className="mt-auto flex items-center justify-between pt-8 border-t dark:border-slate-800">
                                <button className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                                    Read Article <ChevronRight size={20} />
                                </button>
                                <button className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-600 transition-all">
                                    <Download size={24} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-24 text-center">
                        <div className="inline-flex p-8 bg-slate-100 dark:bg-slate-800 rounded-[2rem] mb-6">
                            <Search size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No resources match your search</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Try using different keywords or resetting filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentsPage;

import React, { useState } from 'react';
import { 
  Server, Search, Terminal, Database, Code, Globe, Shield, Zap, Info, 
  Activity, Book, Cpu, Layers, Link, Copy, Check, ExternalLink, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MCPPage = () => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('connect');

    const configCode = `{
  "mcpServers": {
    "healthcare-knowledge": {
      "command": "python",
      "args": [
        "-m",
        "healthcare_mcp.server"
      ],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/health_db"
      }
    }
  }
}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(configCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const realTools = [
        { 
            name: 'search_medical_docs', 
            desc: 'Multi-vector similarity search over medical archives. Primary discovery tool for patient context.',
            input: '{ "query": "str", "limit": 5 }',
            output: '{ "results": [...], "score": 0.98 }'
        },
        { 
            name: 'get_medical_reference_ranges', 
            desc: 'Retrieves clinical lab standards and vital sign thresholds for medical validation.',
            input: '{ "test_name": "str" }',
            output: '{ "range": "10-20 mg/dL", "unit": "mg/dL" }'
        },
        { 
            name: 'get_document_sections', 
            desc: 'Extracts structured page content from indexed medical volumes.',
            input: '{ "document_id": "str" }',
            output: '{ "content": "Full text...", "metadata": {...} }'
        },
        { 
            name: 'list_documents', 
            desc: 'Returns a complete catalog of all indexed healthcare documents in the vector library.',
            input: '{ "None" }',
            output: '{ "documents": [{ "id": "1", "title": "Protocol A" }, ...] }'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            {/* Header Section */}
            <div className="text-center space-y-4 pt-10">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest"
                >
                    <Activity size={14} className="animate-pulse" /> Healthcare Knowledge MCP v1.0
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight">
                    Connect your AI to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Medical Intelligence</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                    Bridge your LLM to verified medical documentation and clinical reference data via the Model Context Protocol.
                </p>
                <div className="flex flex-wrap justify-center gap-6 pt-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Check size={18} className="text-green-500" /> Live Endpoint</div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Check size={18} className="text-green-500" /> 4 Core Tools</div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Check size={18} className="text-green-500" /> Model Agnostic</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit mx-auto border dark:border-slate-800">
                {['connect', 'setup', 'tools'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab 
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'connect' && (
                    <motion.div 
                        key="connect"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[3rem] p-8 md:p-12 shadow-xl"
                    >
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold dark:text-white">01_CONNECT</h2>
                                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                                    Our MCP server is deployed and ready for healthcare integration. Connect directly from any MCP-compatible environment—Claude Desktop, Cursor, or your own custom agent.
                                </p>
                                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border dark:border-slate-800 space-y-2">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Local Server Path</p>
                                    <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold break-all">
                                        python -m healthcare_mcp.server
                                    </code>
                                </div>
                            </div>
                            <div className="bg-slate-950 rounded-[2rem] p-8 text-indigo-400 font-mono text-sm relative group">
                                <button 
                                    onClick={handleCopy}
                                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                                <div className="text-slate-500 mb-4 block"># Example MCP Config</div>
                                <pre className="overflow-x-auto">
                                    {configCode}
                                </pre>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'setup' && (
                    <motion.div 
                        key="setup"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        {[
                            { title: 'Claude Desktop', icon: Box, path: 'Settings → MCP → Add' },
                            { title: 'Cursor / Windsurf', icon: Cpu, path: 'Features → MCP → Config' },
                            { title: 'Cline / Agentic', icon: Terminal, path: '.vscode/mcp.json' }
                        ].map((item, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-[2.5rem] hover:border-indigo-500 transition-colors">
                                <item.icon className="text-indigo-500 mb-6" size={32} />
                                <h3 className="text-xl font-bold dark:text-white mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-sm mb-4">Paste the config in:</p>
                                <code className="text-xs font-bold bg-slate-50 dark:bg-black p-2 rounded-lg block dark:text-indigo-300">
                                    {item.path}
                                </code>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'tools' && (
                    <motion.div 
                        key="tools"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {realTools.map((tool, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 border dark:border-slate-800 overflow-hidden rounded-[2.5rem]">
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{tool.name}</h3>
                                            <p className="text-slate-500 dark:text-slate-400">{tool.desc}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 text-[10px] font-black uppercase rounded-full border border-green-100 dark:border-green-800">
                                            Operational
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Input Schema</p>
                                            <pre className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-xs font-mono dark:text-slate-300 border dark:border-slate-800">
                                                {tool.input}
                                            </pre>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Example Output</p>
                                            <pre className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-xs font-mono dark:text-slate-300 border dark:border-slate-800">
                                                {tool.output}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Docs */}
            <div className="text-center pt-12 space-y-6 border-t dark:border-slate-800">
                <p className="text-slate-500 font-medium">Healthcare Knowledge MCP v1.0 • Model Agnostic Infrastructure</p>
                <div className="flex justify-center gap-8 text-sm font-bold text-indigo-600">
                    <a href="#" className="hover:underline flex items-center gap-1">Protocol <ExternalLink size={14} /></a>
                    <a href="#" className="hover:underline flex items-center gap-1">Security <ExternalLink size={14} /></a>
                    <a href="#" className="hover:underline flex items-center gap-1">Raw Config <ExternalLink size={14} /></a>
                </div>
            </div>
        </div>
    );
};

export default MCPPage;

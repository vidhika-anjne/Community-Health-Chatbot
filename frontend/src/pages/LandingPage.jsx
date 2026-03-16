import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MessageCircle, Stethoscope, AlertTriangle, BookOpen, Server, ArrowRight, Heart, Activity, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-8 border border-blue-100 dark:border-blue-800"
          >
            <Activity size={16} />
            <span>AI-Powered Health Awareness</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-slate-900 dark:text-white"
          >
            Your Personal <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Health Companion
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl mb-12 text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto"
          >
            Verified health information, prevention tips, and disease awareness at your fingertips. 
            Empowering communities through accessible medical knowledge.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link 
              to="/chat" 
              className="group relative px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2 overflow-hidden"
            >
              <MessageCircle size={22} />
              <span>Start Chatting</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/documents"
              className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center gap-2"
            >
              <BookOpen size={22} />
              <span>Resources</span>
            </Link>
          </motion.div>
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </section>

      {/* Emergency Disclaimer */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto"
      >
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left transition-colors font-medium">
          <div className="bg-amber-100 dark:bg-amber-800/30 p-3 rounded-2xl">
            <AlertTriangle className="text-amber-600 dark:text-amber-500" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-amber-800 dark:text-amber-400">
              <span className="font-bold">Medical Disclaimer:</span> This is an informational tool for awareness only. For medical emergencies, please consult a qualified doctor or call your local emergency services immediately.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">How we help you</h2>
          <p className="text-slate-600 dark:text-slate-400">Reliable tools to keep your health in check</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              icon: <Stethoscope className="text-blue-600" size={32} />, 
              title: "Disease Awareness", 
              desc: "Identify symptoms and learn about common illnesses like Dengue, Fever, and COVID-19.",
              color: "bg-blue-50 dark:bg-blue-900/20"
            },
            { 
              icon: <Shield className="text-indigo-600" size={32} />, 
              title: "Prevention First", 
              desc: "Get actionable advice on vaccines, hygiene practices, and preventive measures for your family.",
              color: "bg-indigo-50 dark:bg-indigo-900/20"
            },
            { 
              icon: <Heart className="text-rose-600" size={32} />, 
              title: "Health Metrics", 
              desc: "Understand medical reports and normal reference ranges with our AI analysis tools.",
              color: "bg-rose-50 dark:bg-rose-900/20"
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{item.desc}</p>
              <Link 
                to="/chat" 
                className="text-blue-600 dark:text-blue-400 font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all"
              >
                Learn more <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-slate-100 dark:bg-slate-900/50 rounded-[3rem] py-16 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-12 opacity-60 grayscale dark:invert">
          <div className="flex items-center gap-2"><ShieldCheck /> Verified Sources</div>
          <div className="flex items-center gap-2"><Server /> Secure MCP</div>
          <div className="flex items-center gap-2"><Stethoscope /> Medical Accuracy</div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

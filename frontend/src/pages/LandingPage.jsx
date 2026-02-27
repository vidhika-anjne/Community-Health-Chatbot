import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MessageCircle, Info, Stethoscope, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Public Health Assistant
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl mb-10 opacity-90"
          >
            Your 24/7 AI-powered health awareness partner. From prevention tips to disease awareness—reliable info when you need it.
          </motion.p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link 
              to="/chat" 
              className="bg-white text-primary-700 font-bold py-4 px-10 rounded-full text-xl hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              <MessageCircle /> Start Chatting
            </Link>
          </motion.div>
          <p className="mt-8 text-sm opacity-60 flex items-center justify-center gap-2">
            <ShieldCheck size={16} /> Verified sources • 24/7 Availability • Free to use
          </p>
        </div>
      </section>

      {/* Warning/Disclaimer bar */}
      <div className="bg-amber-50 border-y border-amber-200 py-3 px-4 text-center text-amber-800 text-sm font-medium flex items-center justify-center gap-2">
        <AlertTriangle size={18} />
        Not for medical emergencies. This is an awareness tool, not a doctor.
      </div>

      {/* Quick Links Section */}
      <section className="py-20 px-4 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {[
          { icon: <Stethoscope className="text-primary-500" />, title: "Common Diseases", desc: "Learn about symptoms and prevention for common illnesses like Dengue, Fever, and COVID-19." },
          { icon: <ShieldCheck className="text-primary-500" />, title: "Vaccination Info", desc: "Get up-to-date guidance on essential vaccines for all age groups." },
          { icon: <Info className="text-primary-500" />, title: "Emergency Guidance", desc: "Critical indicators for when you should seek immediate professional medical help." }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="mb-4">{item.icon}</div>
            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
            <p className="text-slate-600 mb-6">{item.desc}</p>
            <Link to="/chat" className="text-primary-600 font-semibold hover:underline flex items-center gap-1">
              Learn more <Info size={14} />
            </Link>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-slate-900 text-slate-400 text-center text-sm">
        <div className="mb-4 flex justify-center gap-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/chat" className="hover:text-white transition-colors">Chatbot</Link>
          <Link to="/admin" className="hover:text-white transition-colors">Admin Portal</Link>
        </div>
        <p>&copy; 2026 Community Health Initiative. All rights reserved.</p>
        <p className="mt-2 text-xs italic opacity-50">Disclaimer: Information provided is for education purposes only.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

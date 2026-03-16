import React from 'react';
import Navbar from './Navbar';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {children}
      </motion.main>
      <footer className="mt-auto border-t py-8 text-center text-slate-500 dark:text-slate-400 dark:border-slate-800">
        <p>&copy; {new Date().getFullYear()} Community Health Information. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;

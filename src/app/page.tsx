"use client";

import { useState } from "react";
import PriceForm from "@/components/PriceForm";
import Dashboard from "@/components/Dashboard";
import { motion } from "framer-motion";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <header className="text-center space-y-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent"
        >
          Monitoramento de Preços de Mercado - Abradigue
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-zinc-500 max-w-2xl mx-auto"
        >
          Sistema de inteligência de mercado para monitoramento de preços de implementos rodoviários.
        </motion.p>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-8">
          <PriceForm onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
        </div>

        {/* Right Column: Dashboard */}
        <div className="lg:col-span-7">
          <Dashboard refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </main>
  );
}
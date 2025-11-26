"use client";

import { useState, useEffect } from "react";
import PriceForm from "@/components/PriceForm";
import Dashboard from "@/components/Dashboard";
import RecentRecordsTable from "@/components/RecentRecordsTable";
import { motion } from "framer-motion";
import Image from "next/image";
import { PriceEntry, getPriceEntries } from "@/lib/firebase";
import { Loader2, LogOut, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [entries, setEntries] = useState<PriceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    const data = await getPriceEntries();
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <header className="py-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Image
              src="/logo.jpg"
              alt="Abradigue Logo"
              width={120}
              height={50}
              className="h-auto w-auto object-contain"
            />
          </motion.div>
          <div className="text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-black tracking-tight text-zinc-800"
            >
              Monitoramento de Preços de Mercado - Abradigue
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-zinc-500 mt-2"
            >
              Sistema de inteligência de mercado para monitoramento de preços de implementos rodoviários.
            </motion.p>

            {user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center md:justify-start gap-4 pt-4"
              >
                <div className="text-zinc-600">
                  Olá, <span className="font-bold text-zinc-900">{user.username}</span>
                </div>
                <div className="h-4 w-px bg-zinc-300" />
                <Link
                  href="/change-password"
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-[#FACC15] transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  Trocar Senha
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      {authLoading || (loading && entries.length === 0) ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form */}
            <div className="lg:col-span-5 space-y-8">
              <PriceForm onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
            </div>

            {/* Right Column: Dashboard (Stats + Chart) */}
            <div className="lg:col-span-7">
              <Dashboard entries={entries} />
            </div>
          </div>

          {/* Bottom Row: Recent Records Table */}
          <div className="mt-8">
            <RecentRecordsTable entries={entries} onDelete={() => setRefreshTrigger(prev => prev + 1)} />
          </div>
        </>
      )}
    </main>
  );
}
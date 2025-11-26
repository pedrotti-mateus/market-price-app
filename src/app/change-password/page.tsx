"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ChangePasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    if (!user) {
        if (typeof window !== 'undefined') router.push("/login");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        if (newPassword.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            await changePassword(user.id, newPassword);
            setSuccess(true);
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } catch (err) {
            setError("Erro ao alterar senha. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-zinc-200"
            >
                <div className="mb-6">
                    <Link href="/" className="text-zinc-500 hover:text-zinc-800 flex items-center gap-2 text-sm mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao Portal
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-800">Alterar Senha</h1>
                    <p className="text-zinc-500 text-sm mt-2">Defina uma nova senha para sua conta</p>
                </div>

                {success ? (
                    <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-center">
                        <p className="font-medium">Senha alterada com sucesso!</p>
                        <p className="text-sm mt-1">Redirecionando...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                                Nova Senha
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-[#FACC15] focus:border-transparent outline-none transition-all"
                                placeholder="Digite a nova senha"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                                Confirmar Nova Senha
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-[#FACC15] focus:border-transparent outline-none transition-all"
                                placeholder="Confirme a nova senha"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-4 rounded-xl font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Alterar Senha"
                            )}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}

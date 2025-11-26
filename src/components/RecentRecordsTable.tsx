"use client";

import { useState } from "react";
import { PriceEntry, deletePriceEntry } from "@/lib/firebase";
import { Loader2, Trash2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";

interface RecentRecordsTableProps {
    entries: PriceEntry[];
    onDelete: () => void;
}

export default function RecentRecordsTable({ entries, onDelete }: RecentRecordsTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este registro?")) return;
        setDeletingId(id);
        try {
            await deletePriceEntry(id);
            onDelete();
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Erro ao excluir registro.");
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (date: any) => {
        if (!date) return "-";
        // Handle Firebase Timestamp
        if (date instanceof Timestamp) {
            return date.toDate().toLocaleDateString("pt-BR");
        }
        // Handle ISO string (mock db) or Date object
        const d = new Date(date);
        return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-200">
                <h3 className="text-lg font-bold text-zinc-800">Registros Recentes</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 text-zinc-500">
                        <tr>
                            <th className="px-6 py-4 font-medium">Data</th>
                            <th className="px-6 py-4 font-medium">Distribuidor</th>
                            <th className="px-6 py-4 font-medium">Produto</th>
                            <th className="px-6 py-4 font-medium">Guerra</th>
                            <th className="px-6 py-4 font-medium">Randon</th>
                            <th className="px-6 py-4 font-medium">Facchini</th>
                            <th className="px-6 py-4 font-medium">Librelato</th>
                            <th className="px-6 py-4 font-medium">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {entries.slice(0, 10).map((entry, i) => (
                            <tr key={i} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 text-zinc-500">
                                    {formatDate(entry.createdAt)}
                                </td>
                                <td className="px-6 py-4 font-medium">{entry.distributor}</td>
                                <td className="px-6 py-4 text-zinc-500">{entry.product}</td>
                                <td className="px-6 py-4 text-[#D32F2F] font-medium">
                                    {entry.prices.Guerra ? `R$ ${entry.prices.Guerra.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {entry.prices.Randon ? `R$ ${entry.prices.Randon.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {entry.prices.Facchini ? `R$ ${entry.prices.Facchini.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {entry.prices.Librelato ? `R$ ${entry.prices.Librelato.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => entry.id && handleDelete(entry.id)}
                                        disabled={deletingId === entry.id}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir registro"
                                    >
                                        {deletingId === entry.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

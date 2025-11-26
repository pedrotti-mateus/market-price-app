"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { PriceEntry, getPriceEntries, deletePriceEntry } from "@/lib/firebase";
import { BRANDS } from "@/data/constants";
import { TrendingUp, DollarSign, Package, Download, Filter } from "lucide-react";
import * as XLSX from 'xlsx';

export default function Dashboard({ entries }: { entries: PriceEntry[] }) {
    const [selectedFamily, setSelectedFamily] = useState<string>("Todas");

    const handleExport = () => {
        const dataToExport = entries.map(e => {
            let dateStr = "-";
            if (e.createdAt) {
                // Handle Firebase Timestamp or Date/String
                const date = e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
                dateStr = date.toLocaleDateString("pt-BR");
            }

            return {
                Data: dateStr,
                Distribuidor: e.distributor,
                Produto: e.product,
                Família: e.family,
                Guerra: e.prices.Guerra || 0,
                Randon: e.prices.Randon || 0,
                Facchini: e.prices.Facchini || 0,
                Librelato: e.prices.Librelato || 0,
                Truckvan: e.prices.Truckvan || 0,
                Outros: e.prices.Outros || 0,
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Preços");
        XLSX.writeFile(wb, "monitoramento_precos.xlsx");
    };

    // Calculate Average Prices by Family
    const familyStats = entries.reduce((acc, entry) => {
        if (!acc[entry.family]) {
            acc[entry.family] = {
                family: entry.family,
                count: 0,
                totals: { Guerra: 0, Randon: 0, Facchini: 0, Librelato: 0, Truckvan: 0, Outros: 0 },
            };
        }

        acc[entry.family].count += 1;
        BRANDS.forEach((brand) => {
            if (entry.prices[brand]) {
                acc[entry.family].totals[brand] = (acc[entry.family].totals[brand] || 0) + entry.prices[brand];
            }
        });
        return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(familyStats).map((stat: any) => {
        const item: any = { name: stat.family };
        BRANDS.forEach((brand) => {
            // Simple average (sum / count of entries that had this brand)
            // Note: ideally we track count per brand, but for simplicity using entry count
            // This is an approximation if not all brands are filled every time.
            // Let's refine:
            const brandCount = entries.filter(e => e.family === stat.family && e.prices[brand]).length;
            item[brand] = brandCount ? Math.round(stat.totals[brand] / brandCount) : 0;
        });
        return item;
    });

    const families = ["Todas", ...new Set(entries.map(e => e.family))];

    const filteredChartData = selectedFamily === "Todas"
        ? chartData
        : chartData.filter(item => item.name === selectedFamily);

    if (entries.length === 0) {
        return (
            <div className="text-center p-12 text-zinc-500">
                Nenhum dado coletado ainda.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">Total de Registros</p>
                            <h3 className="text-2xl font-bold">{entries.length}</h3>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">Famílias Monitoradas</p>
                            <h3 className="text-2xl font-bold">{chartData.length}</h3>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">Última Atualização</p>
                            <h3 className="text-lg font-bold">
                                {new Date().toLocaleDateString()}
                            </h3>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200"
            >
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-lg font-bold">Média de Preços por Família</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <select
                                value={selectedFamily}
                                onChange={(e) => setSelectedFamily(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none appearance-none"
                            >
                                {families.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Exportar Excel
                        </button>
                    </div>
                </div>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#33333320" />
                            <XAxis dataKey="name" stroke="#888" fontSize={12} tickMargin={10} />
                            <YAxis
                                stroke="#888"
                                fontSize={12}
                                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(value: number) => [`R$ ${value.toLocaleString()}`, '']}
                            />
                            <Legend />
                            <Bar dataKey="Guerra" fill="#FACC15" name="Guerra" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Randon" fill="#000000" name="Randon" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Facchini" fill="#DC2626" name="Facchini" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Librelato" fill="#2563EB" name="Librelato" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Truckvan" fill="#F97316" name="Truckvan" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Outros" fill="#9333EA" name="Outros" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

        </div>
    );
}

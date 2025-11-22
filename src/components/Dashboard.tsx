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
import { PriceEntry, getPriceEntries } from "@/lib/firebase";
import { BRANDS } from "@/data/constants";
import { Loader2, TrendingUp, DollarSign, Package } from "lucide-react";

export default function Dashboard({ refreshTrigger }: { refreshTrigger: number }) {
    const [entries, setEntries] = useState<PriceEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getPriceEntries();
            setEntries(data);
            setLoading(false);
        };
        fetchData();
    }, [refreshTrigger]);

    // Calculate Average Prices by Family
    const familyStats = entries.reduce((acc, entry) => {
        if (!acc[entry.family]) {
            acc[entry.family] = {
                family: entry.family,
                count: 0,
                totals: { Guerra: 0, Randon: 0, Facchini: 0, Librelato: 0 },
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

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

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
                    className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800"
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
                    className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800"
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
                    className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800"
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
                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800"
            >
                <h3 className="text-lg font-bold mb-6">Média de Preços por Família</h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Recent Entries Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-bold">Registros Recentes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Distribuidor</th>
                                <th className="px-6 py-4 font-medium">Produto</th>
                                <th className="px-6 py-4 font-medium">Guerra</th>
                                <th className="px-6 py-4 font-medium">Randon</th>
                                <th className="px-6 py-4 font-medium">Facchini</th>
                                <th className="px-6 py-4 font-medium">Librelato</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {entries.slice(0, 10).map((entry, i) => (
                                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium">{entry.distributor}</td>
                                    <td className="px-6 py-4 text-zinc-500">{entry.product}</td>
                                    <td className="px-6 py-4 text-blue-600 font-medium">
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

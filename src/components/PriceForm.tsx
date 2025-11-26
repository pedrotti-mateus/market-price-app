"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DISTRIBUTORS, PRODUCTS, BRANDS, Product } from "@/data/constants";
import { addPriceEntry } from "@/lib/firebase";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import Image from "next/image";

export default function PriceForm({ onSuccess }: { onSuccess?: () => void }) {
    const [distributor, setDistributor] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const formatCurrency = (value: string) => {
        const digits = value.replace(/\D/g, "");
        if (!digits) return "";
        const number = parseInt(digits) / 100;
        return number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handlePriceChange = (brand: string, value: string) => {
        const formatted = formatCurrency(value);
        setPrices({ ...prices, [brand]: formatted });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!distributor || !selectedProduct) return;

        setLoading(true);
        try {
            // Convert formatted string prices to numbers
            const numericPrices: Record<string, number> = {};
            Object.entries(prices).forEach(([brand, price]) => {
                if (price) {
                    // Remove thousands separators and replace decimal comma with dot
                    const rawValue = price.replace(/\./g, "").replace(",", ".");
                    numericPrices[brand] = parseFloat(rawValue);
                }
            });

            await addPriceEntry({
                distributor,
                product: selectedProduct.name,
                family: selectedProduct.family,
                prices: numericPrices,
            });

            setSuccess(true);
            setPrices({});
            setSelectedProduct(null);
            // Keep distributor selected for convenience
            setTimeout(() => setSuccess(false), 3000);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar dados. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-zinc-200 p-8"
        >
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-zinc-800">
                    Coleta de Preços
                </h2>
                <p className="text-zinc-500">
                    Insira os valores praticados no mercado.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Distributor Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">
                        Distribuidor
                    </label>
                    <div className="relative">
                        <select
                            required
                            value={distributor}
                            onChange={(e) => setDistributor(e.target.value)}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FACC15] outline-none appearance-none transition-all"
                        >
                            <option value="">Selecione um distribuidor...</option>
                            {DISTRIBUTORS.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                </div>

                {/* Product Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">
                        Produto / Modelo
                    </label>
                    <div className="relative">
                        <select
                            required
                            value={selectedProduct?.name || ""}
                            onChange={(e) => {
                                const prod = PRODUCTS.find((p) => p.name === e.target.value);
                                setSelectedProduct(prod || null);
                            }}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FACC15] outline-none appearance-none transition-all"
                        >
                            <option value="">Selecione um produto...</option>
                            {PRODUCTS.map((p) => (
                                <option key={p.name} value={p.name}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                </div>

                {/* Price Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {BRANDS.map((brand) => (
                        <div key={brand} className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                {brand}
                                {brand === "Guerra" && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">
                                        Sua Marca
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="0,00"
                                    value={prices[brand] || ""}
                                    onChange={(e) => handlePriceChange(brand, e.target.value)}
                                    className={cn(
                                        "w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 outline-none transition-all font-medium",
                                        brand === "Guerra"
                                            ? "focus:ring-[#FACC15] border-yellow-400"
                                            : "focus:ring-[#FACC15]"
                                    )}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !distributor || !selectedProduct}
                    className={cn(
                        "w-full p-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2",
                        success
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-[#FACC15] hover:bg-[#EAB308] text-black hover:shadow-yellow-500/25 hover:scale-[1.02] active:scale-[0.98]"
                    )}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : success ? (
                        <>
                            <Check className="w-5 h-5" /> Salvo com Sucesso!
                        </>
                    ) : (
                        "Salvar Preços"
                    )}
                </button>
            </form>
        </motion.div>
    );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DISTRIBUTORS, PRODUCTS, BRANDS, Product } from "@/data/constants";
import { addPriceEntry, uploadEvidence } from "@/lib/firebase";
import { Check, ChevronDown, Loader2, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

import Image from "next/image";

import { useAuth } from "@/context/AuthContext";

export default function PriceForm({ onSuccess }: { onSuccess?: () => void }) {
    const { user } = useAuth();
    const distributor = user?.username || "";
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [evidenceFiles, setEvidenceFiles] = useState<Record<string, File>>({});
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

    const handleFileChange = (brand: string, file: File | null) => {
        if (file) {
            setEvidenceFiles({ ...evidenceFiles, [brand]: file });
        } else {
            const newFiles = { ...evidenceFiles };
            delete newFiles[brand];
            setEvidenceFiles(newFiles);
        }
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

            // Upload evidence files
            const evidenceUrls: Record<string, string> = {};
            for (const [brand, file] of Object.entries(evidenceFiles)) {
                const url = await uploadEvidence(file);
                evidenceUrls[brand] = url;
            }

            await addPriceEntry({
                distributor,
                product: selectedProduct.name,
                family: selectedProduct.family,
                prices: numericPrices,
                evidence: evidenceUrls,
            });

            setSuccess(true);
            setPrices({});
            setEvidenceFiles({});
            setSelectedProduct(null);
            // Keep distributor selected for convenience
            setTimeout(() => setSuccess(false), 3000);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            const msg = error?.message || "Erro desconhecido";
            alert(`Erro ao salvar dados: ${msg}. Tente novamente.`);
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
                        <input
                            type="text"
                            value={distributor}
                            disabled
                            className="w-full p-3 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-500 font-medium cursor-not-allowed"
                        />
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
                            <div className="relative flex gap-2">
                                <input
                                    type="text"
                                    placeholder="0,00"
                                    value={prices[brand] || ""}
                                    onChange={(e) => handlePriceChange(brand, e.target.value)}
                                    className={cn(
                                        "flex-1 min-w-0 p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 outline-none transition-all font-medium",
                                        brand === "Guerra"
                                            ? "focus:ring-[#FACC15] border-yellow-400"
                                            : "focus:ring-[#FACC15]"
                                    )}
                                />
                                <div className="relative flex-shrink-0">
                                    <input
                                        type="file"
                                        id={`file-${brand}`}
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => handleFileChange(brand, e.target.files?.[0] || null)}
                                    />
                                    <label
                                        htmlFor={`file-${brand}`}
                                        className={cn(
                                            "h-full aspect-square flex items-center justify-center rounded-xl border border-zinc-200 cursor-pointer transition-colors",
                                            evidenceFiles[brand]
                                                ? "bg-green-50 border-green-200 text-green-600"
                                                : "bg-zinc-50 hover:bg-zinc-100 text-zinc-400"
                                        )}
                                        title={evidenceFiles[brand] ? evidenceFiles[brand].name : "Anexar evidência"}
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </label>
                                    {evidenceFiles[brand] && (
                                        <button
                                            type="button"
                                            onClick={() => handleFileChange(brand, null)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
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

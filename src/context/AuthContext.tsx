"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, login as firebaseLogin, seedUsers } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => false,
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Initialize: Seed users and check for persisted session
        const init = async () => {
            await seedUsers();

            // Simple session persistence using localStorage
            const storedUser = localStorage.getItem("market_price_user");
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Failed to parse stored user", e);
                    localStorage.removeItem("market_price_user");
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    const login = async (username: string, password: string) => {
        const user = await firebaseLogin(username, password);
        if (user) {
            setUser(user);
            localStorage.setItem("market_price_user", JSON.stringify(user));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("market_price_user");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

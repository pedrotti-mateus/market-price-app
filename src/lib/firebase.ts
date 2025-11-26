import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, Timestamp, where, setDoc, doc, updateDoc } from "firebase/firestore";

// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface PriceEntry {
    id?: string;
    distributor: string;
    product: string;
    family: string;
    prices: {
        [key: string]: number; // Brand -> Price
    };
    createdAt: any;
}

// MOCK STORE for demo purposes if no Firebase config is present
const MOCK_STORAGE_KEY = "market_prices_mock_db";

const isMock = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_USE_MOCK_DB === 'true';

export async function addPriceEntry(entry: Omit<PriceEntry, "id" | "createdAt">) {
    if (isMock) {
        console.log("Using Mock DB for addPriceEntry");
        const existing = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || "[]");
        const newEntry = {
            ...entry,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
        };
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify([newEntry, ...existing]));
        return newEntry;
    }

    try {
        const docRef = await addDoc(collection(db, "prices"), {
            ...entry,
            createdAt: Timestamp.now(),
        });
        return { id: docRef.id, ...entry };
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

export async function getPriceEntries(): Promise<PriceEntry[]> {
    if (isMock) {
        console.log("Using Mock DB for getPriceEntries");
        if (typeof window === 'undefined') return [];
        const data = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || "[]");
        return data;
    }

    try {
        const q = query(collection(db, "prices"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as PriceEntry[];
    } catch (e) {
        console.error("Error getting documents: ", e);
        return [];
    }
}

export async function deletePriceEntry(id: string) {
    if (isMock) {
        console.log("Using Mock DB for deletePriceEntry");
        const existing = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || "[]");
        const filtered = existing.filter((e: any) => e.id !== id);
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(filtered));
        return;
    }

    try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "prices", id));
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw e;
    }
}

// --- AUTHENTICATION ---

export interface User {
    id: string;
    username: string; // Distributor Name or "ADMIN"
    password?: string; // In a real app, hash this!
    role: "ADMIN" | "DISTRIBUTOR";
}

const USERS_COLLECTION = "users";
const MOCK_USERS_KEY = "market_prices_users_db";

import { DISTRIBUTORS } from "@/data/constants";

export async function seedUsers() {
    // Check if users exist, if not, create them
    const defaultPassword = "123456";

    const usersToSeed: User[] = [
        { id: "admin", username: "ADMIN", role: "ADMIN", password: defaultPassword },
        ...DISTRIBUTORS.map(d => ({
            id: d.toLowerCase().replace(/\s+/g, '-'),
            username: d,
            role: "DISTRIBUTOR" as const,
            password: defaultPassword
        }))
    ];

    if (isMock) {
        const existing = localStorage.getItem(MOCK_USERS_KEY);
        if (!existing) {
            console.log("Seeding Mock Users...");
            localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(usersToSeed));
        }
        return;
    }

    // Firebase seeding (check one user to see if we need to seed)
    try {
        const q = query(collection(db, USERS_COLLECTION), where("username", "==", "ADMIN"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("Seeding Firebase Users...");
            for (const user of usersToSeed) {
                // Use username as ID for simplicity in this specific use case or generate one
                await setDoc(doc(db, USERS_COLLECTION, user.id), user);
            }
        }
    } catch (e) {
        console.error("Error seeding users:", e);
    }
}

export async function login(username: string, password: string): Promise<User | null> {
    if (isMock) {
        const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            const { password, ...safeUser } = user;
            return safeUser as User;
        }
        return null;
    }

    try {
        const q = query(collection(db, USERS_COLLECTION), where("username", "==", username));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const userDoc = snapshot.docs[0].data() as User;
        if (userDoc.password === password) {
            const { password, ...safeUser } = userDoc;
            return { ...safeUser, id: snapshot.docs[0].id };
        }
        return null;
    } catch (e) {
        console.error("Login error:", e);
        return null;
    }
}

export async function changePassword(userId: string, newPassword: string) {
    if (isMock) {
        const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
        const updatedUsers = users.map(u => u.id === userId ? { ...u, password: newPassword } : u);
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(updatedUsers));
        return;
    }

    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, { password: newPassword });
    } catch (e) {
        console.error("Change password error:", e);
        throw e;
    }
}

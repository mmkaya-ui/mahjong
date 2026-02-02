'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import { REWARD_DATA, RewardItem } from '@/data/rewards';

export interface UnlockedItem extends RewardItem {
    unlockedAt: number;
}

interface UnlockedItemsContextType {
    unlockedItems: UnlockedItem[];
    unlockItem: () => UnlockedItem;
    isItemUnlocked: (id: string) => boolean;
    clearProgress: () => void;
}

const UnlockedItemsContext = createContext<UnlockedItemsContextType | undefined>(undefined);

const STORAGE_KEY = 'mahjong_unlocked_items_v2'; // New key for new data structure

export function UnlockedItemsProvider({ children }: { children: React.ReactNode }) {
    const [unlockedItems, setUnlockedItems] = useState<UnlockedItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setUnlockedItems(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse unlocked items", e);
            }
        }
    }, []);

    const clearProgress = () => {
        setUnlockedItems([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const unlockItem = (): UnlockedItem => {
        // Pick a random item from REWARD_DATA that isn't already unlocked?
        // Or just random? User wants 200+ trophies. Duplicates?
        // Let's try to find a new one if possible, else random.

        const unlockedIds = new Set(unlockedItems.map(i => i.id));
        const available = REWARD_DATA.filter(i => !unlockedIds.has(i.id));

        let selected: RewardItem;

        if (available.length > 0) {
            selected = available[Math.floor(Math.random() * available.length)];
        } else {
            // All unlocked! Just pick random.
            selected = REWARD_DATA[Math.floor(Math.random() * REWARD_DATA.length)];
        }

        const newItem: UnlockedItem = {
            ...selected,
            unlockedAt: Date.now(),
        };

        // If duplicate (when all are unlocked), don't duplicate state?
        // If we strictly want unique trophies, check ID.
        if (!unlockedIds.has(selected.id)) {
            const updated = [...unlockedItems, newItem];
            setUnlockedItems(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }

        return newItem;
    };

    const isItemUnlocked = (id: string) => {
        return unlockedItems.some(item => item.id === id);
    };

    return (
        <UnlockedItemsContext.Provider value={{ unlockedItems, unlockItem, isItemUnlocked, clearProgress }}>
            {children}
        </UnlockedItemsContext.Provider>
    );
}

export function useUnlockedItems() {
    const context = useContext(UnlockedItemsContext);
    if (context === undefined) {
        throw new Error('useUnlockedItems must be used within a UnlockedItemsProvider');
    }
    return context;
}

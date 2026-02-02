'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UnlockableItemType = 'car' | 'plane' | 'train' | 'ship';

export interface UnlockedItem {
    id: string;
    type: UnlockableItemType;
    name: string;
    unlockedAt: number;
}

interface UnlockedItemsContextType {
    unlockedItems: UnlockedItem[];
    unlockItem: (type: UnlockableItemType) => UnlockedItem;
    isItemUnlocked: (id: string) => boolean;
}

const UnlockedItemsContext = createContext<UnlockedItemsContextType | undefined>(undefined);

const STORAGE_KEY = 'mahjong_unlocked_items';

const AVAILABLE_ITEMS: { type: UnlockableItemType; names: string[] }[] = [
    { type: 'car', names: ['Speedster XR', 'Classic 50s', 'Rally Beast', 'City Hopper'] },
    { type: 'plane', names: ['Sky Eagle', 'Jet Stream', 'Biplane Classic', 'Stealth Wing'] },
    { type: 'train', names: ['Steam Giant', 'Bullet Express', 'Cargo Hauler', 'Metro Zoom'] },
];

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

    const unlockItem = (type: UnlockableItemType): UnlockedItem => {
        // Find a random name for this type
        const category = AVAILABLE_ITEMS.find(c => c.type === type);
        const name = category
            ? category.names[Math.floor(Math.random() * category.names.length)]
            : 'Unknown Artifact';

        const newItem: UnlockedItem = {
            id: crypto.randomUUID(),
            type,
            name,
            unlockedAt: Date.now(),
        };

        const updated = [...unlockedItems, newItem];
        setUnlockedItems(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        return newItem;
    };

    const isItemUnlocked = (id: string) => {
        return unlockedItems.some(item => item.id === id);
    };

    return (
        <UnlockedItemsContext.Provider value={{ unlockedItems, unlockItem, isItemUnlocked }}>
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

'use client';

import React, { useState } from 'react';
import { useUnlockedItems } from '@/context/UnlockedItemsContext';
import { ItemViewer } from './ItemViewer';
import { X } from 'lucide-react';

interface RewardsMenuProps {
    onClose: () => void;
}

export default function RewardsMenu({ onClose }: RewardsMenuProps) {
    const { unlockedItems } = useUnlockedItems();
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    const activeItem = unlockedItems.find(i => i.id === selectedItem);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 3000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            color: 'white'
        }}>
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                }}
            >
                <X size={32} />
            </button>

            {activeItem ? (
                <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>{activeItem.name}</h2>
                    <ItemViewer type={activeItem.type} />
                    <button
                        onClick={() => setSelectedItem(null)}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: 'white',
                            color: 'black',
                            border: 'none',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Back to Collection
                    </button>
                    <p style={{ marginTop: '10px', opacity: 0.7 }}>
                        Drag to rotate • Pinch to zoom
                    </p>
                </div>
            ) : (
                <div style={{ width: '100%', maxWidth: '800px' }}>
                    <h2 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '40px' }}>Unlocked Treasures</h2>
                    {unlockedItems.length === 0 ? (
                        <p style={{ textAlign: 'center', fontSize: '1.2rem', opacity: 0.6 }}>
                            No treasures found yet. Keep playing to find Gift Boxes!
                        </p>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                            gap: '20px'
                        }}>
                            {unlockedItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItem(item.id)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        padding: '15px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        backdropFilter: 'blur(10px)',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ fontSize: '30px', marginBottom: '10px' }}>
                                        {item.type === 'car' && '🚗'}
                                        {item.type === 'plane' && '✈️'}
                                        {item.type === 'train' && '🚂'}
                                        {item.type === 'ship' && '🚢'}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { useUnlockedItems } from '@/context/UnlockedItemsContext';
import { X } from 'lucide-react';

interface RewardsMenuProps {
    onClose: () => void;
}

const { unlockedItems, clearProgress } = useUnlockedItems();
const [selectedItem, setSelectedItem] = useState<string | null>(null);

const activeItem = unlockedItems.find(i => i.id === selectedItem);

const handleReset = () => {
    if (confirm('Are you sure you want to delete all your trophies? This cannot be undone.')) {
        clearProgress();
    }
};

return (
    <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
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
            <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{activeItem.name}</h2>
                <p style={{ color: '#aaa', marginBottom: '30px' }}>{activeItem.category}</p>

                <div style={{
                    fontSize: '10rem',
                    margin: '40px 0',
                    filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.2))',
                    animation: 'float 6s ease-in-out infinite'
                }}>
                    {activeItem.icon}
                </div>

                <button
                    onClick={() => setSelectedItem(null)}
                    style={{
                        marginTop: '20px',
                        padding: '12px 30px',
                        background: 'white',
                        color: 'black',
                        border: 'none',
                        borderRadius: '30px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1.1rem'
                    }}
                >
                    Back to Collection
                </button>
                <style jsx>{`
                        @keyframes float {
                            0% { transform: translateY(0px); }
                            50% { transform: translateY(-20px); }
                            100% { transform: translateY(0px); }
                        }
                    `}</style>
            </div>
        ) : (
            <div style={{ width: '100%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '10px' }}>Unlocked Treasures</h2>
                <p style={{ textAlign: 'center', marginBottom: '30px', opacity: 0.7 }}>
                    Collection: {unlockedItems.length} items
                </p>

                {unlockedItems.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <p style={{ fontSize: '1.5rem', opacity: 0.5, marginBottom: '20px' }}>🔐</p>
                        <p style={{ textAlign: 'center', fontSize: '1.2rem', opacity: 0.6 }}>
                            No treasures found yet. Keep playing to find Gift Boxes!
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                        gap: '15px',
                        overflowY: 'auto',
                        padding: '10px',
                        alignContent: 'start'
                    }}>
                        {unlockedItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item.id)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '16px',
                                    padding: '15px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }}
                            >
                                <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                                    {item.icon}
                                </div>
                                <span style={{
                                    fontSize: '0.85rem',
                                    textAlign: 'center',
                                    fontWeight: '500',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%'
                                }}>
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Controls */}
                <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    {unlockedItems.length > 0 && (
                        <button
                            onClick={handleReset}
                            style={{
                                background: 'none',
                                border: '1px solid rgba(255,100,100,0.5)',
                                color: 'rgba(255,100,100,0.8)',
                                padding: '8px 15px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,0,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                            Reset Collection
                        </button>
                    )}
                </div>
            </div>
        )}
    </div>
);
}

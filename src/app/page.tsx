'use client';

import React, { useState } from 'react';
import { LanguageProvider } from '@/context/LanguageContext';
import { AudioProvider } from '@/context/AudioContext';
import { GameProvider } from '@/context/GameContext';
import Board from '@/components/Game/Board';
import Controls from '@/components/UI/Controls';
import SoundSanctuary from '@/components/UI/SoundSanctuary';

function GameApp() {
  const [showSoundSettings, setShowSoundSettings] = useState(false);

  return (
    <div className="game-wrapper">
      <header className="game-header">
        <h1>Zen Mahjong</h1>
      </header>

      <main className="game-board-area">
        <Board />
      </main>

      <Controls onOpenSound={() => setShowSoundSettings(true)} />

      {showSoundSettings && (
        <SoundSanctuary onClose={() => setShowSoundSettings(false)} />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <AudioProvider>
        <GameProvider>
          <GameApp />
        </GameProvider>
      </AudioProvider>
    </LanguageProvider>
  );
}

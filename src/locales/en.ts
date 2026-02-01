import { Translations } from '@/types';

export const en: Translations = {
    game: {
        start: 'Start',
        shuffle: 'Shuffle',
        hint: 'Hint',
        paused: 'Paused',
        won: 'Congratulations! You Won.',
        gameOver: 'Game Over',
        score: 'Score',
    },
    settings: {
        title: 'Settings',
        soundSanctuary: 'Sound Sanctuary',
        language: 'Language',
        back: 'Back',
    },
    sounds: {
        healing: 'Healing (528Hz)',
        nature: 'Nature (432Hz)',
        off: 'Off',
    },
    help: {
        title: 'How to Play',
        goal: 'Goal',
        goalDesc: 'Match all pairs to clear the board.',
        rules: 'Rules',
        rulesDesc: 'A tile can only be picked if it has no tile on top AND has a free space on either its left or right side.',
        modes: 'Game Modes',
        modesDesc: 'ZEN: Guaranteed solvable (Strategy). REAL: True randomness (Luck).',
        controls: 'Controls',
        controlsDesc: 'Use Shuffle if stuck. Use Hint to find a match.',
        close: 'Understood'
    }
};

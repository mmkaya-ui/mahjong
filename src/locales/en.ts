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
        noMoves: 'No moves available! Try Shuffle.',
        tryAgain: 'Try Again',
        changeDifficulty: 'Change Difficulty',
        changeMode: 'Change Game Mode',
    },
    settings: {
        title: 'Settings',
        soundSanctuary: 'Sound Sanctuary',
        language: 'Language',
        back: 'Back',
        playAudio: 'start audio',
        pauseAudio: 'pause audio',
        healingFrequencies: 'Healing Frequencies',
        natureMixer: 'Nature Mixer',
        masterVolume: 'Master Volume',
    },
    sounds: {
        healing: 'Healing (528Hz)',
        nature: 'Nature (432Hz)',
        off: 'Off',
        rain: 'Rain',
        birds: 'Birds',
        waves: 'Waves',
        frequencies: {
            off: 'Off',
            f396: '396Hz (Grounding)',
            f432: '432Hz (Nature)',
            f528: '528Hz (Healing)',
            f639: '639Hz (Connections)',
            f741: 'Awakening Intuition',
            f852: '852Hz (Intuition)',
        },
    },
    difficulties: {
        easy: 'EASY',
        normal: 'NORMAL',
        hard: 'HARD',
    },
    modes: {
        zen: 'ZEN',
        realism: 'REAL',
        hardcore: 'HARDCORE',
        maximum: 'MAXIMUM',
    },
    help: {
        title: 'How to Play',
        goal: 'Goal',
        goalDesc: 'Match all pairs to clear the board.',
        rules: 'Rules',
        rulesDesc: 'A tile can only be picked if it has no tile on top AND has a free space on either its left or right side. NOTE: Flowers and Seasons match any of their kind.',
        modes: 'Game Modes',
        modesDesc: 'ZEN: Guaranteed solvable (Strategy). REAL: True randomness (Luck).',
        controls: 'Controls',
        controlsDesc: 'Use Shuffle if stuck. Use Hint to find a match.',
        close: 'Understood'
    },
    rewards: {
        title: 'Unlocked Treasures',
        tapToOpen: 'Tap to Open!',
        unlocked: 'Unlocked!',
        back: 'Back to Collection',
        reset: 'Reset Collection',
        resetConfirm: 'Are you sure you want to delete all your trophies? This cannot be undone.',
        noRewards: 'No treasures found yet. Keep playing to find Gift Boxes!',
        awesome: 'Awesome!',
        collection: 'Collection'
    }
};

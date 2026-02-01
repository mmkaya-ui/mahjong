import { Translations } from '@/types';

export const de: Translations = {
    game: {
        start: 'Starten',
        shuffle: 'Mischen',
        hint: 'Hinweis',
        paused: 'Pausiert',
        won: 'Herzlichen Glückwunsch!',
        gameOver: 'Spiel Vorbei',
        score: 'Punktzahl',
    },
    settings: {
        title: 'Einstellungen',
        soundSanctuary: 'Klangheiligtum',
        language: 'Sprache',
        back: 'Zurück',
        playAudio: 'audio starten',
        pauseAudio: 'audio pausieren',
        healingFrequencies: 'Heilfrequenzen',
        natureMixer: 'Natur-Mixer',
        masterVolume: 'Gesamtlautstärke',
    },
    sounds: {
        healing: 'Heilung (528Hz)',
        nature: 'Natur (432Hz)',
        off: 'Aus',
        rain: 'Regen',
        birds: 'Vögel',
        waves: 'Wellen',
        frequencies: {
            off: 'Aus',
            f396: '396Hz (Erdung)',
            f432: '432Hz (Natur)',
            f528: '528Hz (Heilung)',
            f639: '639Hz (Verbindung)',
            f741: 'Intuition Erwecken',
            f852: '852Hz (Intuition)',
        },
    },
    difficulties: {
        easy: 'EINFACH',
        normal: 'NORMAL',
        hard: 'SCHWER',
    },
    modes: {
        zen: 'ZEN',
        realism: 'ECHT',
    },
    help: {
        title: 'Spielanleitung',
        goal: 'Ziel',
        goalDesc: 'Kombiniere alle Paare, um das Brett zu leeren.',
        rules: 'Regeln',
        rulesDesc: 'Ein Stein ist frei, wenn kein Stein darüber liegt UND eine Seite (links oder rechts) frei ist.',
        modes: 'Spielmodi',
        modesDesc: 'ZEN: Lösbar (Strategie). ECHT: Zufall (Glück).',
        controls: 'Steuerung',
        controlsDesc: 'Nutze Mischen beiblockaden. Nutze Hinweis für Hilfe.',
        close: 'Verstanden'
    }
};

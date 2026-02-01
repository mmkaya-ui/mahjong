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
    },
    sounds: {
        healing: 'Heilung (528Hz)',
        nature: 'Natur (432Hz)',
        off: 'Aus',
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

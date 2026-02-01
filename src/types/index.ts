export type Language = 'tr' | 'en' | 'de';

export interface Translations {
    game: {
        start: string;
        shuffle: string;
        hint: string;
        paused: string;
        won: string;
        gameOver: string;
        score: string;
    };
    settings: {
        title: string;
        soundSanctuary: string;
        language: string;
        back: string;
    };
    sounds: {
        healing: string;
        nature: string;
        off: string;
    };
    help: {
        title: string;
        goal: string;
        goalDesc: string;
        rules: string;
        rulesDesc: string;
        modes: string;
        modesDesc: string;
        controls: string;
        controlsDesc: string;
        close: string;
    };
}

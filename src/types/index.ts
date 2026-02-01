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
        noMoves: string;
        tryAgain: string;
    };
    sounds: {
        healing: string;
        nature: string;
        off: string;
        rain: string;
        birds: string;
        waves: string;
        frequencies: {
            off: string;
            f396: string;
            f432: string;
            f528: string;
            f639: string;
            f741: string;
            f852: string;
        };
    };
    difficulties: {
        easy: string;
        normal: string;
        hard: string;
    };
    modes: {
        zen: string;
        realism: string;
        hardcore: string;
        maximum: string;
    };
    settings: {
        title: string;
        soundSanctuary: string;
        language: string;
        back: string;
        playAudio: string;
        pauseAudio: string;
        healingFrequencies: string;
        natureMixer: string;
        masterVolume: string;
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

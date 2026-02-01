export const AUDIO_CONSTANTS = {
    FREQUENCIES: {
        '396': 396,
        '432': 432,
        '528': 528,
        '639': 639,
        '741': 741,
        '852': 852
    },
    FADE_TIME: 0.2, // seconds
    RAMP_TIME: 1.5, // seconds for drone
    NATURE_RAMP: 2.0, // seconds
    LFO_FREQ: 0.1, // Hz (10s cycle for waves)
    SAMPLE_RATE: 44100 // Standard (though context usually decides)
} as const;

export const GAME_CONSTANTS = {
    SCORE_MATCH: 10,
    HINT_IDLE_MS: 15000,
    HINT_CHECK_INTERVAL: 2000,
    SHUFFLE_PENALTY: 50,
    FREE_SHUFFLES: 3,
    TILE_WIDTH: 74, // Approximate visual width
    TILE_HEIGHT: 102
} as const;

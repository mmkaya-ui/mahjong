import { Translations } from '@/types';

export const tr: Translations = {
    game: {
        start: 'Başla',
        shuffle: 'Karıştır',
        hint: 'İpucu',
        paused: 'Duraklatıldı',
        won: 'Tebrikler! Kazandın.',
        gameOver: 'Oyun Bitti',
        score: 'Puan',
    },
    settings: {
        title: 'Ayarlar',
        soundSanctuary: 'Ses Tapınağı',
        language: 'Dil',
        back: 'Geri',
        playAudio: 'sesi oynat',
        pauseAudio: 'sesi duraklat',
        healingFrequencies: 'Şifa Frekansları',
        natureMixer: 'Doğa Karıştırıcı',
        masterVolume: 'Ana Ses',
    },
    sounds: {
        healing: 'Şifa (528Hz)',
        nature: 'Doğa (432Hz)',
        off: 'Kapalı',
        rain: 'Yağmur',
        birds: 'Kuşlar',
        waves: 'Dalgalar',
        frequencies: {
            off: 'Kapalı',
            f396: '396Hz (Köklenme)',
            f432: '432Hz (Doğa)',
            f528: '528Hz (Şifa)',
            f639: '639Hz (Bağlantı)',
            f741: 'Sezgi Uyandırma',
            f852: '852Hz (Sezgi)',
        },
    },
    difficulties: {
        easy: 'KOLAY',
        normal: 'NORMAL',
        hard: 'ZOR',
    },
    help: {
        title: 'Nasıl Oynanır',
        goal: 'Amaç',
        goalDesc: 'Tahtayı temizlemek için tüm çiftleri eşleştirin.',
        rules: 'Kurallar',
        rulesDesc: 'Bir taş seçilebilmesi için: Üzerinde taş olmamalı VE sağında veya solunda boşluk olmalıdır.',
        modes: 'Oyun Modları',
        modesDesc: 'ZEN: Çözülebilir (Strateji). GERÇEK: Tamamen rastgele (Şans).',
        controls: 'Kontroller',
        controlsDesc: 'Sıkışırsanız Karıştır\'ı kullanın. İpucu için Ampul\'e basın.',
        close: 'Anlaşıldı'
    }
};

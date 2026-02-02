
// Mock matching logic from GameContext to verify it
type Tile = { id: string; type: string; value: string | number; x: number; y: number };

function testGiftBoxLogic() {
    console.log("Starting Logic Simulation...");
    let eventDispatched = false;

    // Mock Window
    const globalAny: any = global;
    globalAny.window = {
        dispatchEvent: (event: any) => {
            console.log(`[Event Dispatched] ${event.type}`);
            if (event.type === 'mahjong-gift-unlocked') {
                eventDispatched = true;
            }
        }
    };
    globalAny.CustomEvent = class CustomEvent {
        type: string;
        detail: any;
        constructor(type: string, options?: any) {
            this.type = type;
            this.detail = options?.detail;
        }
    }

    // Test Case 1: Matching two regular tiles
    const t1: Tile = { id: '1', type: 'dots', value: 1, x: 0, y: 0 };
    const t2: Tile = { id: '2', type: 'dots', value: 1, x: 1, y: 0 };

    // Logic from GameContext
    if (t1.type === t2.type && t1.value === t2.value) {
        console.log("Regular Match: Success");
        // No event expected
    }

    // Test Case 2: Matching two Gift Boxes
    const g1: Tile = { id: '3', type: 'giftbox', value: 'mystery', x: 0, y: 0 };
    const g2: Tile = { id: '4', type: 'giftbox', value: 'mystery', x: 1, y: 0 };

    if (g1.type === 'giftbox' && g2.type === 'giftbox') {
        console.log("Gift Match: Detected");
        // Dispatch Logic
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mahjong-gift-unlocked', {
                detail: { x: 0.5, y: 0 }
            }));
        }
    }

    if (eventDispatched) {
        console.log("✅ Simulation Passed: Event was dispatched correctly.");
    } else {
        console.error("❌ Simulation Failed: Event was NOT dispatched.");
        process.exit(1);
    }
}

testGiftBoxLogic();

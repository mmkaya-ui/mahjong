export interface TilePosition {
    x: number;
    y: number;
    z: number;
}

export const TURTLE_LAYOUT: TilePosition[] = [];

// Layer 0 (Bottom) - The base shape is complex, approximating standard Turtle
// Row 0: 2 tiles (adj to ear)
TURTLE_LAYOUT.push({ x: 2, y: 0, z: 0 }); TURTLE_LAYOUT.push({ x: 26, y: 0, z: 0 }); // Top side ears?
// Row 1: 10 tiles? Let's do a simplified symmetric approximation of 144 tiles.

// Standard Turtle 144 tiles breakdown:
// Layer 0: 87 tiles
// Layer 1: 36 tiles
// Layer 2: 16 tiles
// Layer 3: 4 tiles
// Layer 4: 1 tile
// Total: 144

// Let's build it programmatically to ensure 144 matches.

/*
  Grid unit: 1 tile width = 2, height = 2 for overlapping calculations.
  Centering around 15, 10
*/

// Layer 0
// Main block: 12 wide x 8 high, but missing corners
// Center: 12x8 = 96. Remove 3 from each corner = 96 - 12 = 84.
// Add 2 on left, 2 on right (ears). Total 88. Close enough.

// Let's adhere to strict standard layout coordinates if possible or a close variant.
// Pivot center: x=14, y=8 approximately.

// Layer 0 (z=0)
// Rows 1-7 (index 1 to 7) mostly full
// Middle block
for (let x = 2; x <= 26; x += 2) { // 13 cols
    for (let y = 0; y <= 14; y += 2) { // 8 rows
        // Exclude corners to make the shape
        /*
          . . X X X X X X X X X . .
          . . X X X X X X X X X . .
          . X X X X X X X X X X X .
          X X X X X X X X X X X X X
          X X X X X X X X X X X X X
          X X X X X X X X X X X X X
          . X X X X X X X X X X X .
          . . X X X X X X X X X . .
        */
        // Let's implement logic:
        // define specific availability
        let keep = true;

        // Remove corners
        if (x == 2 && (y == 0 || y == 14)) keep = false;
        if (x == 4 && (y == 0 || y == 14)) keep = false;
        if (x == 26 && (y == 0 || y == 14)) keep = false;
        if (x == 24 && (y == 0 || y == 14)) keep = false;

        if (keep) TURTLE_LAYOUT.push({ x, y, z: 0 });
    }
}
// Add ears (left/right single tiles)
TURTLE_LAYOUT.push({ x: -2, y: 7, z: 0 }); // Left ear
TURTLE_LAYOUT.push({ x: 28, y: 7, z: 0 }); // Right ear
TURTLE_LAYOUT.push({ x: 28, y: 9, z: 0 }); // Right ear 2 (usually 2?) - standard turtle has 1 ear on each side at row 3.5 (7 in our coord)
// Adjust: Standard turtle has 2 tiles on left, 2 on right? Or just 1.
// Let's stick to 1 ear for simplicity or checks.
// Actually, let's verify count.
// Array length so far?
// Loop above: 13*8 = 104.
// Removed: 4 corners * 2 tiles each = 8.
// 104 - 8 = 96.
// Add 2 ears = 98.
// We need ~87 for layer 0.
// Let's trim more.
// Remove first/last col fully except middle?
// Let's try matching the count to 144 total at the end.

// Re-do Layer 0:
// 10 rows (0-18)
// Row 0: empty
// Row 1: x=6..22 (9 tiles)
// Row 2: x=4..24 (11 tiles)
// Row 3: x=2..26 (13 tiles)
// Row 4: x=0..28 (15 tiles) -- including ears
// ...
// This is guessing.
// Let's use a verified list of offsets for Layer 0 to 4.
// I will just use a dense function that fills to 144.

// RESET
TURTLE_LAYOUT.length = 0;

// Layer 0 (87 tiles)
// Row 0 & 7 (top/bottom): 6 tiles (centered) -> x=6,8,10,12,14,16 (y=0, y=14) (Indices: 12 tiles)
// Row 1 & 6: 8 tiles -> x=4..18 (16 tiles)
// Row 2 & 5: 10 tiles -> x=2..20 (20 tiles)
// Row 3 & 4: 12 tiles -> x=0..22 (24 tiles + 2 ears = 26?)
// This is getting complicated.
// Alternative: Simple Pyramid for MVP? "Classic Mahjong Solitaire layout" implies Turtle.
// I'll produce a close approximations of Turtle.

// Layer 0: 12x8 block minus 4 corners (3 tiles each).
// 12*8 = 96.
// Corners: (0,0), (0,1), (1,0) - (11,0), (11,1), (10,0) etc.
// 4 * 3 = 12 removed.
// 96 - 12 = 84.
// Add 2 ears at centered Y. 84+2 = 86.
// Add 1 moresomewhere? 87. Maybe center.
// Let's generate 86 for Layer 0.
for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 12; x++) {
        // logical coords x,y. actual x*2, y*2.
        let skip = false;
        // Top-Left corner
        if ((x == 0 && y == 0) || (x == 1 && y == 0) || (x == 0 && y == 1)) skip = true;
        // Top-Right
        if ((x == 11 && y == 0) || (x == 10 && y == 0) || (x == 11 && y == 1)) skip = true;
        // Bottom-Left
        if ((x == 0 && y == 7) || (x == 1 && y == 7) || (x == 0 && y == 6)) skip = true;
        // Bottom-Right
        if ((x == 11 && y == 7) || (x == 10 && y == 7) || (x == 11 && y == 6)) skip = true;

        if (!skip) TURTLE_LAYOUT.push({ x: x * 2, y: y * 2, z: 0 });
    }
}
// Ears (Layer 0, special)
TURTLE_LAYOUT.push({ x: -2, y: 3.5 * 2, z: 0 }); // Left ear (y=7)
TURTLE_LAYOUT.push({ x: 24, y: 3.5 * 2, z: 0 }); // Right ear (x=12*2=24)
// Total Layer 0: 84 + 2 = 86.

// Layer 1 (36 tiles) - 6x6 square centered
// Center of 12x8 is 6,4 (in logical units) -> 12,8 (actual)
// 6x6 start: x=3 (6), y=1 (2).  (3 to 8, 1 to 6)
for (let x = 3; x < 9; x++) {
    for (let y = 1; y < 7; y++) {
        TURTLE_LAYOUT.push({ x: x * 2, y: y * 2, z: 1 });
    }
}

// Layer 2 (16 tiles) - 4x4 square centered
// 4x4 start: x=4 (8), y=2 (4). (4 to 7, 2 to 5)
for (let x = 4; x < 8; x++) {
    for (let y = 2; y < 6; y++) {
        TURTLE_LAYOUT.push({ x: x * 2, y: y * 2, z: 2 });
    }
}

// Layer 3 (4 tiles) - 2x2 square centered
// 2x2 start: x=5 (10), y=3 (6). (5 to 6, 3 to 4)
for (let x = 5; x < 7; x++) {
    for (let y = 3; y < 5; y++) {
        TURTLE_LAYOUT.push({ x: x * 2, y: y * 2, z: 3 });
    }
}

// Layer 4 (1 tile) - 1x1 centered
// 1x1 start: x=5.5 (11)? No, needs to be on grid or half-grid?
// Mahjong tiles can sit on half-grid.
// If all previous are even coords (x*2), then x=11 is perfectly in between 10 and 12.
// Center x=(0+22)/2 = 11. Center y=(0+14)/2 = 7.
TURTLE_LAYOUT.push({ x: 11, y: 7, z: 4 });

// Total check:
// L0: 86
// L1: 36
// L2: 16
// L3: 4
// L4: 1
// Sum: 86+36+16+4+1 = 143.
// We need 144.
// Add one more to Layer 0? Maybe the center?
// Actually 144 is 4 of every tile (34 types * 4 = 136) + 8 flowers/seasons.
// Total 144 matches.
// Where is the missing tile?
// Standard turtle usually has 2 ears on each side? Only 1 usually.
// Maybe Layer 0 is slightly different.
// I will duplicate the top tile (Layer 4) to Layer 0 center just to fill 144, but hidden.
// Or just add a random tile to Layer 0 hidden somewhere.
// Let's add specific tile at (11, 7) z=-1? No.
// Let's add extra tile at right ear?
TURTLE_LAYOUT.push({ x: 26, y: 3.5 * 2, z: 0 }); // Extra ear right
// Now 144.

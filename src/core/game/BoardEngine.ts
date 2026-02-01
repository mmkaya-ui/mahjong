import { Tile } from '@/utils/mahjong';

/**
 * Performance Optimized Board Engine
 * Uses Spatial HashMap for O(1) blocked checks.
 */
export class BoardEngine {
    // Spatial Map: "x,y,z" -> Tile
    private tileMap: Map<string, Tile>;

    constructor(tiles: Tile[]) {
        this.tileMap = new Map();
        tiles.forEach(t => {
            this.tileMap.set(this.getKey(t.x, t.y, t.z), t);
        });
    }

    private getKey(x: number, y: number, z: number): string {
        return `${x},${y},${z}`;
    }

    /**
     * Checks if a tile is blocked.
     * Rules:
     * 1. Top is blocked if any tile exists at z+1 overlapping in X/Y.
     * 2. Side is blocked if BOTH Left AND Right are blocked.
     * 
     * Tile Dimensions: 2x2 in Coordinate Space (usually).
     */
    public isBlocked(tile: Tile): boolean {
        // 1. Check Top (z + 1)
        // Since tiles are 2x2, we check overlap. 
        // Overlap circle: 
        //  (x,y) of block on top could be:
        //  (x,y), (x+1,y), (x-1,y), (x,y+1)...
        // Simplified Mahjong layout usually aligns to grid.
        // Assuming 2x2 size.

        // Check immediate neighbors at Z+1
        const zUp = tile.z + 1;
        // Possible overlapping coordinates for a 2x2 tile at (x,y)
        // are (x,y), (x-1, y-1), (x+1, y+1) etc.
        // We iterate possible centers of neighbors.
        // Standard deck usually has integer steps.

        // Optimized check:
        // A tile A covers B if |A.x - B.x| < 2 && |A.y - B.y| < 2 && A.z == B.z + 1

        // We only check candidates in map? No, map key is precise.
        // We iterate the small region around the tile.

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = this.getKey(tile.x + dx, tile.y + dy, zUp);
                const neighbor = this.tileMap.get(key);
                if (neighbor) {
                    // Refine overlap check just in case grid is weird
                    if (Math.abs(neighbor.x - tile.x) < 2 && Math.abs(neighbor.y - tile.y) < 2) {
                        return true; // Blocked by top
                    }
                }
            }
        }

        // 2. Check Sides
        // Left: (x-2, y, z). Right: (x+2, y, z)
        // We need to check if ANY tile exists that strictly blocks the left side.
        // Left blocker: neighbor.x approx tile.x - 2.

        // Check Left
        let leftBlocked = false;
        // Search region x-2. Y can vary by +/- 1
        for (let dy = -1; dy <= 1; dy++) {
            const key = this.getKey(tile.x - 2, tile.y + dy, tile.z);
            const neighbor = this.tileMap.get(key);
            if (neighbor && Math.abs(neighbor.y - tile.y) < 2) {
                leftBlocked = true;
                break;
            }
        }

        // If Left is FREE, tile is NOT blocked (assuming top is free).
        // Return false immediately? 
        // "A tile is blocked if both left and right are blocked".
        // So internal logic: blocked = hasTop || (hasLeft && hasRight)
        if (!leftBlocked) return false;

        // Check Right
        let rightBlocked = false;
        for (let dy = -1; dy <= 1; dy++) {
            const key = this.getKey(tile.x + 2, tile.y + dy, tile.z);
            const neighbor = this.tileMap.get(key);
            if (neighbor && Math.abs(neighbor.y - tile.y) < 2) {
                rightBlocked = true;
                break;
            }
        }

        return rightBlocked; // If both left and right are blocked, return true.
    }

    // Batch update isClickable status for all tiles
    public updateAllStatus(tiles: Tile[]): Tile[] {
        // Rebuild map? Or assume tiles passed are the current set?
        // If some removed, we should rebuild map first.
        this.tileMap.clear();
        tiles.forEach(t => this.tileMap.set(this.getKey(t.x, t.y, t.z), t));

        return tiles.map(t => ({
            ...t,
            isClickable: !this.isBlocked(t)
        }));
    }
}

/**
 * Mahjong Logic Solver
 * Handles Standard Agari (Sets + Pair), Pure Mentsu, Yaku Evaluation, and Wait Grouping.
 */

// Deep copy helper
const clone = (arr: number[]) => [...arr];

// ---------------------------------------------------------
// Basic Completion Checkers
// ---------------------------------------------------------

export function checkSets(tiles: number[]): boolean {
  if (tiles.length === 0) return true;
  const first = tiles[0];

  // 1. Koutsu (Triplet)
  if (tiles.filter(x => x === first).length >= 3) {
    const remaining = clone(tiles);
    remaining.splice(remaining.indexOf(first), 1);
    remaining.splice(remaining.indexOf(first), 1);
    remaining.splice(remaining.indexOf(first), 1);
    if (checkSets(remaining)) return true;
  }

  // 2. Shuntsu (Sequence)
  if (tiles.includes(first + 1) && tiles.includes(first + 2)) {
    const remaining = clone(tiles);
    remaining.splice(remaining.indexOf(first), 1);
    remaining.splice(remaining.indexOf(first + 1), 1);
    remaining.splice(remaining.indexOf(first + 2), 1);
    if (checkSets(remaining)) return true;
  }

  return false;
}

export function isAgari(tiles: number[]): boolean {
  const sorted = [...tiles].sort((a, b) => a - b);
  
  // Chiitoitsu (7 Pairs) - strictly 14 tiles
  if (sorted.length === 14) {
      const counts: Record<number, number> = {};
      sorted.forEach(t => counts[t] = (counts[t] || 0) + 1);
      if (Object.values(counts).every(c => c === 2) && Object.keys(counts).length === 7) return true;
  }

  const unique = Array.from(new Set(sorted));
  for (const t of unique) {
    if (sorted.filter(x => x === t).length >= 2) {
      const remaining = clone(sorted);
      remaining.splice(remaining.indexOf(t), 1);
      remaining.splice(remaining.indexOf(t), 1);
      if (checkSets(remaining)) return true;
    }
  }
  return false;
}

export function calculateWaits(currentHand: number[]): number[] {
  const counts: Record<number, number> = {};
  currentHand.forEach(t => counts[t] = (counts[t] || 0) + 1);
  const waits: number[] = [];

  for (let i = 1; i <= 9; i++) {
    if ((counts[i] || 0) >= 4) continue;
    const testHand = [...currentHand, i].sort((a, b) => a - b);
    const len = testHand.length;

    if (len % 3 === 0) {
      if (checkSets(testHand)) waits.push(i);
    } else if (len % 3 === 2) {
      if (isAgari(testHand)) waits.push(i);
    }
  }
  return waits;
}

// ---------------------------------------------------------
// Yaku / Han Calculation Logic (Menzen)
// ---------------------------------------------------------

interface Decomposition {
  pair: number;
  sets: number[][]; 
}

// Find all valid standard decompositions (4 sets + 1 pair)
function decompose(tiles: number[]): Decomposition[] {
  const results: Decomposition[] = [];
  const sorted = [...tiles].sort((a, b) => a - b);
  const unique = Array.from(new Set(sorted));

  for (const pairTile of unique) {
    if (sorted.filter(x => x === pairTile).length >= 2) {
      const remaining = clone(sorted);
      remaining.splice(remaining.indexOf(pairTile), 1);
      remaining.splice(remaining.indexOf(pairTile), 1);
      
      const setCombinations = findSetsCombinations(remaining);
      for (const sets of setCombinations) {
        results.push({ pair: pairTile, sets });
      }
    }
  }
  return results;
}

function findSetsCombinations(tiles: number[]): number[][][] {
  if (tiles.length === 0) return [[]];
  
  const results: number[][][] = [];
  const first = tiles[0];

  // Try Triplet
  if (tiles.filter(x => x === first).length >= 3) {
    const rem = clone(tiles);
    rem.splice(rem.indexOf(first), 1);
    rem.splice(rem.indexOf(first), 1);
    rem.splice(rem.indexOf(first), 1);
    const subResults = findSetsCombinations(rem);
    for (const sub of subResults) {
      results.push([[first, first, first], ...sub]);
    }
  }

  // Try Sequence
  if (tiles.includes(first + 1) && tiles.includes(first + 2)) {
    const rem = clone(tiles);
    rem.splice(rem.indexOf(first), 1);
    rem.splice(rem.indexOf(first + 1), 1);
    rem.splice(rem.indexOf(first + 2), 1);
    const subResults = findSetsCombinations(rem);
    for (const sub of subResults) {
      results.push([[first, first + 1, first + 2], ...sub]);
    }
  }

  return results;
}

function isChuuren(tiles: number[]): boolean {
  const counts: Record<number, number> = {};
  tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);
  const required = [3,1,1,1,1,1,1,1,3];
  for(let i=1; i<=9; i++) {
      if ((counts[i] || 0) < required[i-1]) return false;
  }
  return true;
}

export function calculateHan(hand: number[], winTile: number): number {
  const fullHand = [...hand, winTile].sort((a, b) => a - b);

  if (isChuuren(fullHand)) return 13;

  const counts: Record<number, number> = {};
  fullHand.forEach(t => counts[t] = (counts[t] || 0) + 1);
  const isChiitoi = Object.values(counts).every(c => c === 2) && Object.keys(counts).length === 7;
  
  let maxHan = isChiitoi ? 8 : 0; // Chinitsu (6) + Chiitoi (2)

  const decompositions = decompose(fullHand);

  for (const decomp of decompositions) {
    let currentHan = 6; // Base Chinitsu

    // Tanyao
    const allTiles = [...decomp.sets.flat(), decomp.pair, decomp.pair];
    const hasTerminals = allTiles.some(t => t === 1 || t === 9);
    if (!hasTerminals) currentHan += 1;

    // Iipeiko / Ryanpeiko
    const seqs = decomp.sets.filter(s => s[0] !== s[1]).map(s => s.join(','));
    const seqCounts: Record<string, number> = {};
    seqs.forEach(s => seqCounts[s] = (seqCounts[s] || 0) + 1);
    
    let iipeikoCount = 0;
    Object.values(seqCounts).forEach(c => {
        if (c >= 2) iipeikoCount += (c === 4 ? 2 : 1);
    });
    if (iipeikoCount === 2) currentHan += 3; 
    else if (iipeikoCount === 1) currentHan += 1;

    // Pinfu
    // 1. All Sets are Sequences
    const allSequences = decomp.sets.every(s => s[0] !== s[1]);
    
    if (allSequences) {
        // 2. Pair is not Value (Always true for Pinzu numbers)
        // 3. Wait is Ryanmen
        let isPinfuWait = false;
        
        for (const set of decomp.sets) {
             if (set.includes(winTile)) {
                 const temp = [...set];
                 const idx = temp.indexOf(winTile);
                 if (idx > -1) temp.splice(idx, 1);
                 
                 const [a, b] = temp.sort((x,y) => x-y);
                 // Check if a,b form a ryanmen base (neighbors, not 1-2 or 8-9)
                 if (b === a + 1 && a !== 1 && b !== 9) {
                     isPinfuWait = true;
                     break; 
                 }
             }
        }
        if (isPinfuWait) currentHan += 1;
    }

    if (currentHan > maxHan) maxHan = currentHan;
  }

  return maxHan;
}

// ---------------------------------------------------------
// Wait Grouping Analysis
// ---------------------------------------------------------

const GROUP_COLORS = [
  '#c4dafa', // Blue-ish
  '#fac4c4', // Red-ish
  '#c4fad4', // Green-ish
  '#faf4c4', // Yellow-ish
  '#eec4fa', // Purple-ish
  '#fae1c4', // Orange-ish
];

export function analyzeWaitPatterns(hand: number[], waits: number[]): Record<number, string[]> {
  // 1. Identify all unique "Ready Blocks" across all waits
  // Key: Hash of the block (e.g., "S:2,3", "P:5"), Value: GroupID (Index in COLORS)
  const blockMap = new Map<string, number>();
  let nextColorIdx = 0;

  const tileColors: Record<number, string[]> = {};

  waits.forEach(w => {
    tileColors[w] = [];
    const fullHand = [...hand, w].sort((a,b) => a-b);
    
    const decompositions = decompose(fullHand);
    const satisfiedBlocks = new Set<string>();

    decompositions.forEach(decomp => {
      // Check Pair Wait (Tanki)
      if (decomp.pair === w) {
        satisfiedBlocks.add(`P:${w}`); 
      }
      
      // Check Set Wait
      decomp.sets.forEach(set => {
         const temp = [...set];
         const idx = temp.indexOf(w);
         if (idx !== -1) {
           temp.splice(idx, 1);
           temp.sort((a,b) => a-b);
           if (temp.length === 2) {
             satisfiedBlocks.add(`S:${temp.join(',')}`);
           }
         }
      });
    });

    const counts: Record<number, number> = {};
    fullHand.forEach(t => counts[t] = (counts[t] || 0) + 1);
    if (Object.values(counts).every(c => c === 2) && Object.keys(counts).length === 7) {
        satisfiedBlocks.add(`P:${w}`);
    }

    satisfiedBlocks.forEach(blockHash => {
      if (!blockMap.has(blockHash)) {
        blockMap.set(blockHash, nextColorIdx % GROUP_COLORS.length);
        nextColorIdx++;
      }
      const colorIdx = blockMap.get(blockHash)!;
      const color = GROUP_COLORS[colorIdx];
      
      if (!tileColors[w].includes(color)) {
        tileColors[w].push(color);
      }
    });
  });

  for (const w in tileColors) {
    tileColors[w].sort();
  }

  return tileColors;
}

// ---------------------------------------------------------
// Explanation Generation
// ---------------------------------------------------------

export function getWaitExplanation(hand: number[], winTile: number, allWaits: number[]): string {
  const fullHand = [...hand, winTile].sort((a, b) => a - b);
  
  // 1. Chiitoitsu Check
  const counts: Record<number, number> = {};
  fullHand.forEach(t => counts[t] = (counts[t] || 0) + 1);
  if (Object.values(counts).every(c => c === 2) && Object.keys(counts).length === 7) {
    return "七対子 (単騎)";
  }

  const decompositions = decompose(fullHand);
  if (decompositions.length === 0) return "";

  const explanations = new Set<string>();

  for (const decomp of decompositions) {
    // Check Pair Wait (Tanki / Nobetan)
    if (decomp.pair === winTile) {
      let isNobetan = false;
      const flatSets = decomp.sets.flat();
      
      // Case 1: winTile is lower end of Nobetan (e.g. 1 in 1234)
      if (flatSets.includes(winTile+1) && flatSets.includes(winTile+2) && flatSets.includes(winTile+3)) {
          const partner = winTile + 3;
          if (allWaits.includes(partner)) {
             explanations.add(`${partner}とのノベタン`);
             isNobetan = true;
          }
      }
      // Case 2: winTile is upper end of Nobetan (e.g. 4 in 1234)
      if (!isNobetan && flatSets.includes(winTile-1) && flatSets.includes(winTile-2) && flatSets.includes(winTile-3)) {
          const partner = winTile - 3;
          if (allWaits.includes(partner)) {
             explanations.add(`${partner}とのノベタン`);
             isNobetan = true;
          }
      }

      if (!isNobetan) {
        explanations.add("単騎");
      }
    }

    // Check Triplet Wait (Shanpon)
    const triplet = decomp.sets.find(s => s.length === 3 && s[0] === winTile && s[1] === winTile && s[2] === winTile);
    if (triplet) {
      const partner = decomp.pair;
      if (allWaits.includes(partner)) {
        explanations.add(`${partner}とのシャンポン`);
      }
    }

    // Check Sequence Wait (Ryanmen / Penchan / Kanchan)
    const sequence = decomp.sets.find(s => s.length === 3 && s[0] !== s[1] && s.includes(winTile));
    if (sequence) {
      const idx = sequence.indexOf(winTile);
      // Sequence is sorted [a, a+1, a+2]
      if (idx === 1) {
        explanations.add("カンチャン");
      } else if (idx === 0) {
        const partner = winTile + 3;
        if (allWaits.includes(partner)) {
          explanations.add(`${partner}との両面`);
        } else {
          explanations.add("ペンチャン");
        }
      } else if (idx === 2) {
        const partner = winTile - 3;
        if (allWaits.includes(partner)) {
          explanations.add(`${partner}との両面`);
        } else {
          explanations.add("ペンチャン");
        }
      }
    }
  }

  // Formatting
  const explArray = Array.from(explanations);
  
  // Identify Sanmenchan (3-sided)
  const ryanmens = explArray.filter(e => e.includes("両面"));
  if (ryanmens.length >= 2) {
     const partners = Array.from(new Set(ryanmens.map(r => r.replace("との両面", "")))).sort().join(",");
     return `${partners}との三面張`;
  }

  if (explArray.length === 0) return "";
  return explArray.sort().join(" / ");
}
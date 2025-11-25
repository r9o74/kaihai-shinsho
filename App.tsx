import React, { useState, useEffect } from 'react';
import { PinzuTile } from './components/PinzuTile';
import { calculateWaits, calculateHan, analyzeWaitPatterns, getWaitExplanation } from './utils/mahjongLogic';

// Icons
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
);
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><line x1="12" y1="9" x2="16" y2="13"/><line x1="16" y1="9" x2="12" y2="13"/></svg>
);

export default function App() {
  const [hand, setHand] = useState<number[]>([1, 1, 1, 2, 3, 4, 5, 6, 7, 9, 9, 9]); 
  const [waits, setWaits] = useState<number[]>([]);
  const [waitScores, setWaitScores] = useState<Record<number, number>>({});
  const [waitColors, setWaitColors] = useState<Record<number, string[]>>({});
  
  // Interaction State
  const [selectedWait, setSelectedWait] = useState<number | null>(null);
  const [tooltipText, setTooltipText] = useState<string>("");
  const [tooltipPos, setTooltipPos] = useState<{x:number, y:number} | null>(null);

  const MAX_TILES = 13;

  useEffect(() => {
    setSelectedWait(null);
    setTooltipText("");
    
    if (hand.length === 0) {
      setWaits([]);
      setWaitScores({});
      setWaitColors({});
      return;
    }
    const calculatedWaits = calculateWaits(hand);
    setWaits(calculatedWaits);
    
    const colors = analyzeWaitPatterns(hand, calculatedWaits);
    setWaitColors(colors);

    if (hand.length === 13) {
      const scores: Record<number, number> = {};
      calculatedWaits.forEach(w => {
        scores[w] = calculateHan(hand, w);
      });
      setWaitScores(scores);
    } else {
      setWaitScores({});
    }
  }, [hand]);

  const addTile = (val: number) => {
    if (hand.length < MAX_TILES) {
      const count = hand.filter(t => t === val).length;
      if (count < 4) {
        const newHand = [...hand, val].sort((a, b) => a - b);
        setHand(newHand);
      }
    }
  };

  const removeTile = (index: number) => {
    const newHand = [...hand];
    newHand.splice(index, 1);
    setHand(newHand);
  };

  const clearHand = () => setHand([]);

  const popTile = () => {
    if (hand.length > 0) {
      const newHand = [...hand];
      newHand.pop();
      setHand(newHand);
    }
  };

  const handleWaitClick = (e: React.MouseEvent, val: number) => {
    if (!waits.includes(val)) return;

    if (selectedWait === val) {
      setSelectedWait(null);
      setTooltipText("");
      setTooltipPos(null);
      return;
    }

    const explanation = getWaitExplanation(hand, val, waits);
    setTooltipText(explanation);
    setSelectedWait(val);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 16
    });
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center bg-[#030304] text-slate-200 font-sans overflow-hidden relative selection:bg-white/20 selection:text-white">
      
      {/* Refined Background Ambience */}
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-50 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-40%] left-0 w-full h-[80%] bg-gradient-to-b from-slate-800/20 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full" />
      </div>

      {/* Main Content Area */}
      <main className="z-10 w-full h-full max-w-xl flex flex-col px-4 pt-8 md:pt-12 min-h-0 relative">
        
        {/* HEADER */}
        <header className="flex-none mb-6 md:mb-8 text-center">
          <h1 className="text-xl md:text-2xl font-light tracking-[0.4em] uppercase text-white/90 border-b border-white/10 inline-block pb-2">
            解牌新書
          </h1>
        </header>

        {/* SECTION 1: WAITS */}
        <section className="flex-none w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-lg mb-4 flex flex-col relative overflow-visible z-20 shadow-2xl shadow-black/50">
          <div className="flex-none px-4 py-2 border-b border-white/5 flex justify-between items-center">
            <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-[0.2em] font-medium">聴牌解析</span>
            <span className="text-[10px] md:text-xs text-slate-500 font-mono tracking-wider">{waits.length > 0 ? `${waits.length}面張` : '不聴'}</span>
          </div>
          
          <div className="p-4 w-full">
             <div className="flex flex-row justify-between gap-1 md:gap-2 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => {
                  const isWait = waits.includes(val);
                  const score = waitScores[val];
                  const colors = waitColors[val] || [];
                  const isSelected = selectedWait === val;
                  
                  return (
                    <div 
                      key={val} 
                      className="flex-1 flex flex-col items-center cursor-pointer group select-none"
                      onClick={(e) => handleWaitClick(e, val)}
                    >
                      <div className={`
                         w-full aspect-[3/4] max-w-[44px] transition-all duration-300 ease-out
                         ${isSelected ? 'scale-110 translate-y-[-4px]' : 'scale-100'}
                         ${!isWait ? 'cursor-default' : 'hover:translate-y-[-2px] active:scale-95'}
                      `}>
                        <PinzuTile 
                          value={val} 
                          highlight={isWait} 
                          isGhost={!isWait}
                          colors={colors}
                          className={isSelected ? "ring-[1.5px] ring-white ring-offset-2 ring-offset-[#111]" : ""}
                        />
                      </div>
                      <div className="h-5 mt-2 flex items-center justify-center w-full overflow-visible">
                        {isWait && score !== undefined && (
                          <span className={`
                            text-[10px] font-mono tracking-tight transition-colors duration-300
                            ${isSelected ? 'text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-400'}
                          `}>
                            {score === 13 ? "役満" : `${score}翻`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </section>

        {/* TOOLTIP */}
        {selectedWait && tooltipPos && (
          <div 
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 transition-opacity duration-200"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="bg-[#111]/95 text-slate-200 text-xs px-4 py-2 rounded-md border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap backdrop-blur-md flex flex-col items-center">
              <span className="text-[9px] text-slate-500 uppercase tracking-[0.25em] mb-1">役構成</span>
              <div className="font-medium tracking-wide flex items-center gap-3">
                 <span className="bg-white text-black px-1.5 py-0.5 rounded-[2px] font-mono font-bold text-[11px]">{selectedWait}</span>
                 <span className="text-white/90 text-[11px] md:text-xs">{tooltipText}</span>
              </div>
            </div>
            {/* Minimal Arrow */}
            <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-[#111]/95 border-r border-b border-white/20 transform -translate-x-1/2 rotate-45"></div>
          </div>
        )}

        {/* CONTAINER: HAND + INPUT (Fixed below Waits) */}
        <div className="flex-col flex gap-0 w-full mt-4 md:mt-6 shadow-2xl shadow-black/80">
          
          {/* SECTION 2: CURRENT HAND */}
          <section className="w-full bg-black/40 backdrop-blur-md border-t border-x border-white/10 rounded-t-lg flex flex-col relative pb-6 pt-2 z-10">
             <div className="flex-none px-4 py-2 flex justify-between items-center">
               <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-[0.2em] font-medium">手牌構成</span>
               <span className="text-[10px] md:text-xs text-slate-600 font-mono">{hand.length} / {MAX_TILES}</span>
             </div>
             
             <div className="flex items-center justify-center px-2 mt-1">
               <div className="flex flex-row flex-nowrap justify-center items-center gap-[2px] md:gap-[4px] w-full max-w-[500px]">
                  {Array.from({ length: MAX_TILES }).map((_, i) => {
                     const tile = hand[i];
                     return (
                       <div key={i} className="flex-1 min-w-0 max-w-[38px] aspect-[3/4] relative group">
                          {tile !== undefined ? (
                             <div className="transition-transform duration-200 hover:-translate-y-1 h-full w-full">
                                <PinzuTile value={tile} onClick={() => removeTile(i)} />
                             </div>
                          ) : (
                             <div className="w-full h-full border border-white/5 rounded-[3px] bg-white/[0.02]" />
                          )}
                       </div>
                     );
                  })}
               </div>
             </div>
          </section>

          {/* SECTION 3: INPUT */}
          <section className="w-full bg-[#08080a] border border-white/10 rounded-b-lg p-4 md:p-6 z-10">
             {/* Keypad */}
             <div className="grid grid-cols-9 gap-1 md:gap-2 mb-5">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                     <button
                        key={num}
                        onClick={() => addTile(num)}
                        disabled={hand.length >= MAX_TILES}
                        className="
                          aspect-square 
                          bg-gradient-to-b from-[#1a1a1a] to-[#111]
                          hover:from-[#252525] hover:to-[#1a1a1a]
                          active:from-white active:to-slate-200 active:text-black active:shadow-[0_0_15px_rgba(255,255,255,0.3)]
                          border border-white/10 hover:border-white/30
                          text-slate-300 
                          rounded-[3px] transition-all duration-150 ease-out
                          disabled:opacity-20 disabled:cursor-not-allowed 
                          flex items-center justify-center 
                          font-mono text-lg md:text-xl font-medium
                          shadow-[0_2px_5px_rgba(0,0,0,0.5)]
                        "
                     >
                         {num}
                     </button>
                 ))}
             </div>

             {/* Action Bar */}
             <div className="flex justify-center gap-4 h-11 md:h-12">
                 <button 
                    onClick={popTile}
                    className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-[3px] flex items-center justify-center text-slate-300 transition-all duration-200 uppercase tracking-widest text-[10px]"
                 >
                     <DeleteIcon />
                 </button>
                 <button 
                    onClick={clearHand}
                    className="flex-[0.3] bg-red-900/10 hover:bg-red-500/10 active:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-[3px] flex items-center justify-center transition-all duration-200"
                 >
                     <RefreshIcon />
                 </button>
             </div>
          </section>

        </div>

      </main>
    </div>
  );
}
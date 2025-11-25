import React from 'react';
import { TileProps } from '../types';

interface ExtendedTileProps extends TileProps {
  className?: string;
}

export const PinzuTile: React.FC<ExtendedTileProps> = ({ 
  value, 
  onClick, 
  isGhost, 
  highlight, 
  colors, 
  className 
}) => {
  
  // Generate background style for groups
  const getBackgroundStyle = () => {
    if (isGhost) return undefined;
    if (!colors || colors.length === 0) return undefined;
    
    if (colors.length === 1) {
      return { backgroundColor: colors[0] };
    }

    // Vertical stripes for multiple groups
    const step = 100 / colors.length;
    const gradients = colors.map((color, i) => {
      const start = i * step;
      const end = (i + 1) * step;
      return `${color} ${start}%, ${color} ${end}%`;
    });
    
    return { background: `linear-gradient(to right, ${gradients.join(', ')})` };
  };

  const bgStyle = getBackgroundStyle();
  const hasCustomBg = !!bgStyle;

  return (
    <div 
      onClick={onClick}
      style={{
        ...bgStyle,
        containerType: 'size' // Define this element as a container for query units
      }}
      className={`
        relative h-full w-full rounded-[3px] select-none transition-all duration-300
        flex items-center justify-center overflow-hidden
        border-[0.5px] border-white/10
        ${onClick ? 'cursor-pointer active:scale-95 active:shadow-inner' : ''}
        
        /* State: Ghost (Inactive) */
        ${isGhost 
            ? 'bg-transparent border border-white/5 opacity-20 scale-90 grayscale' 
            : ''
        }
        
        /* State: Active / Highlight */
        ${!isGhost && highlight ? 'shadow-[0_0_25px_rgba(255,255,255,0.15)] scale-100 z-10' : ''}
        ${!isGhost && !highlight ? 'shadow-md' : ''}

        /* Default Ceramic Look (if no custom group color) */
        ${!hasCustomBg && !isGhost 
            ? highlight 
                ? 'bg-gradient-to-br from-white to-slate-100' 
                : 'bg-gradient-to-br from-slate-200 to-slate-300'
            : ''
        }

        ${className || ''}
      `}
    >
      {/* Gloss Overlay */}
      {!isGhost && <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />}

      <span 
        style={{ fontSize: '50cqh' }} // Font size is exactly 50% of Container Query Height
        className={`
        font-mono font-medium 
        leading-none z-10
        ${isGhost ? 'text-white/40' : 'text-slate-900'}
        ${hasCustomBg ? 'mix-blend-multiply opacity-80' : ''}
      `}>
        {value}
      </span>
      
      {/* 3D Edge / Depth */}
      {!isGhost && (
        <div className="absolute inset-x-0 bottom-0 h-[10%] bg-black/10 mix-blend-multiply pointer-events-none rounded-b-[3px]" />
      )}
    </div>
  );
};
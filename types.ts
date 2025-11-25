export interface TileProps {
  value: number; // 1-9
  onClick?: () => void;
  highlight?: boolean;
  isGhost?: boolean;
  colors?: string[]; // Array of hex codes for wait groups
}
import type { AvatarConfig } from "@shared/schema";
import { defaultAvatarConfig } from "@shared/schema";

interface AvatarDisplayProps {
  config?: AvatarConfig | null;
  size?: number;
  className?: string;
  onClick?: () => void;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

function HairSVG({ style, color }: { style: string; color: string }) {
  const dark = darkenColor(color, 30);
  const light = lightenColor(color, 20);
  switch (style) {
    case "short":
      return (
        <g>
          <rect x="8" y="3" width="16" height="3" fill={color} />
          <rect x="7" y="4" width="1" height="4" fill={color} />
          <rect x="24" y="4" width="1" height="4" fill={color} />
          <rect x="8" y="3" width="16" height="1" fill={dark} />
          <rect x="10" y="4" width="3" height="1" fill={light} />
        </g>
      );
    case "long":
      return (
        <g>
          <rect x="8" y="2" width="16" height="4" fill={color} />
          <rect x="6" y="4" width="2" height="14" fill={color} />
          <rect x="24" y="4" width="2" height="14" fill={color} />
          <rect x="8" y="2" width="16" height="1" fill={dark} />
          <rect x="6" y="16" width="2" height="2" fill={dark} />
          <rect x="24" y="16" width="2" height="2" fill={dark} />
          <rect x="10" y="3" width="4" height="1" fill={light} />
        </g>
      );
    case "ponytail":
      return (
        <g>
          <rect x="8" y="3" width="16" height="4" fill={color} />
          <rect x="7" y="5" width="1" height="4" fill={color} />
          <rect x="24" y="5" width="2" height="3" fill={color} />
          <rect x="25" y="7" width="2" height="8" fill={color} />
          <rect x="26" y="9" width="1" height="4" fill={dark} />
          <rect x="8" y="3" width="16" height="1" fill={dark} />
          <rect x="10" y="4" width="3" height="1" fill={light} />
        </g>
      );
    case "spiky":
      return (
        <g>
          <rect x="8" y="4" width="16" height="3" fill={color} />
          <rect x="7" y="5" width="1" height="4" fill={color} />
          <rect x="24" y="5" width="1" height="4" fill={color} />
          <rect x="9" y="2" width="3" height="2" fill={color} />
          <rect x="14" y="0" width="4" height="4" fill={color} />
          <rect x="20" y="1" width="3" height="3" fill={color} />
          <rect x="14" y="0" width="4" height="1" fill={dark} />
          <rect x="9" y="2" width="3" height="1" fill={dark} />
          <rect x="20" y="1" width="3" height="1" fill={dark} />
          <rect x="15" y="1" width="2" height="1" fill={light} />
        </g>
      );
    case "bald":
      return (
        <g>
          <rect x="8" y="5" width="16" height="1" fill={darkenColor(color, 60)} opacity="0.2" />
        </g>
      );
    case "bob":
      return (
        <g>
          <rect x="8" y="3" width="16" height="4" fill={color} />
          <rect x="6" y="5" width="2" height="9" fill={color} />
          <rect x="24" y="5" width="2" height="9" fill={color} />
          <rect x="6" y="13" width="3" height="2" fill={color} />
          <rect x="23" y="13" width="3" height="2" fill={color} />
          <rect x="8" y="3" width="16" height="1" fill={dark} />
          <rect x="6" y="13" width="2" height="1" fill={dark} />
          <rect x="24" y="13" width="2" height="1" fill={dark} />
          <rect x="10" y="4" width="4" height="1" fill={light} />
        </g>
      );
    default:
      return null;
  }
}

function EyesSVG({ style }: { style: string }) {
  switch (style) {
    case "normal":
      return (
        <g>
          {/* Left eye */}
          <rect x="10" y="11" width="4" height="4" fill="#2D1B00" />
          <rect x="10" y="11" width="2" height="2" fill="white" />
          <rect x="11" y="12" width="2" height="2" fill="#1a1a2e" />
          {/* Right eye */}
          <rect x="18" y="11" width="4" height="4" fill="#2D1B00" />
          <rect x="18" y="11" width="2" height="2" fill="white" />
          <rect x="19" y="12" width="2" height="2" fill="#1a1a2e" />
        </g>
      );
    case "happy":
      return (
        <g>
          {/* Left eye - squinted happy */}
          <rect x="10" y="12" width="4" height="2" fill="#2D1B00" />
          <rect x="9" y="14" width="1" height="1" fill="#2D1B00" />
          <rect x="14" y="14" width="1" height="1" fill="#2D1B00" />
          {/* Right eye */}
          <rect x="18" y="12" width="4" height="2" fill="#2D1B00" />
          <rect x="17" y="14" width="1" height="1" fill="#2D1B00" />
          <rect x="22" y="14" width="1" height="1" fill="#2D1B00" />
        </g>
      );
    case "cool":
      return (
        <g>
          {/* Sunglasses */}
          <rect x="9" y="11" width="6" height="4" fill="#1a1a1a" />
          <rect x="17" y="11" width="6" height="4" fill="#1a1a1a" />
          <rect x="15" y="12" width="2" height="1" fill="#1a1a1a" />
          <rect x="8" y="12" width="1" height="1" fill="#1a1a1a" />
          <rect x="23" y="12" width="1" height="1" fill="#1a1a1a" />
          {/* Lens shine */}
          <rect x="10" y="12" width="2" height="1" fill="#333" />
          <rect x="18" y="12" width="2" height="1" fill="#333" />
        </g>
      );
    case "determined":
      return (
        <g>
          {/* Eyebrows */}
          <rect x="10" y="10" width="4" height="1" fill="#2D1B00" />
          <rect x="18" y="10" width="4" height="1" fill="#2D1B00" />
          {/* Left eye */}
          <rect x="10" y="12" width="4" height="3" fill="#2D1B00" />
          <rect x="10" y="12" width="2" height="1" fill="white" />
          <rect x="11" y="13" width="2" height="1" fill="#1a1a2e" />
          {/* Right eye */}
          <rect x="18" y="12" width="4" height="3" fill="#2D1B00" />
          <rect x="18" y="12" width="2" height="1" fill="white" />
          <rect x="19" y="13" width="2" height="1" fill="#1a1a2e" />
        </g>
      );
    default:
      return null;
  }
}

function OutfitSVG({ outfit, color }: { outfit: string; color: string }) {
  const dark = darkenColor(color, 40);
  const light = lightenColor(color, 20);
  return (
    <g>
      {/* Torso */}
      <rect x="9" y="20" width="14" height="6" fill={color} />
      {/* Shoulders */}
      <rect x="6" y="21" width="3" height="4" fill={color} />
      <rect x="23" y="21" width="3" height="4" fill={color} />
      {/* Arms */}
      <rect x="4" y="22" width="2" height="5" fill={color} />
      <rect x="26" y="22" width="2" height="5" fill={color} />
      {/* Hands */}
      <rect x="4" y="27" width="2" height="2" fill="#E8C4A0" />
      <rect x="26" y="27" width="2" height="2" fill="#E8C4A0" />
      {/* Collar */}
      <rect x="12" y="19" width="8" height="2" fill={dark} />
      {/* Shirt highlight */}
      <rect x="10" y="21" width="2" height="3" fill={light} />

      {/* Class-specific detail */}
      {outfit === "warrior" && (
        <g>
          {/* Belt */}
          <rect x="9" y="25" width="14" height="1" fill={dark} />
          <rect x="15" y="24" width="2" height="3" fill="#C0C0C0" />
          {/* Chest plate */}
          <rect x="13" y="21" width="6" height="3" fill={dark} />
          <rect x="14" y="22" width="4" height="1" fill="#C0C0C0" />
        </g>
      )}
      {outfit === "mage" && (
        <g>
          {/* Star emblem */}
          <rect x="14" y="22" width="4" height="3" fill="#FFD700" />
          <rect x="15" y="21" width="2" height="1" fill="#FFD700" />
          <rect x="15" y="25" width="2" height="1" fill="#FFD700" />
          {/* Robe trim */}
          <rect x="9" y="25" width="14" height="1" fill={dark} />
          <rect x="10" y="25" width="12" height="1" fill="#4B0082" />
        </g>
      )}
      {outfit === "healer" && (
        <g>
          {/* Cross emblem */}
          <rect x="15" y="21" width="2" height="5" fill="white" />
          <rect x="13" y="22" width="6" height="2" fill="white" />
          <rect x="15" y="22" width="2" height="2" fill="#FF6B6B" />
          {/* Sash */}
          <rect x="9" y="25" width="14" height="1" fill="white" />
        </g>
      )}
      {outfit === "ranger" && (
        <g>
          {/* Straps */}
          <rect x="11" y="20" width="2" height="6" fill={dark} />
          <rect x="19" y="20" width="2" height="6" fill={dark} />
          {/* Belt with pouch */}
          <rect x="9" y="25" width="14" height="1" fill="#8B4513" />
          <rect x="20" y="24" width="3" height="2" fill="#8B4513" />
        </g>
      )}
      {outfit === "rogue" && (
        <g>
          {/* Hood detail */}
          <rect x="9" y="20" width="14" height="1" fill={dark} />
          {/* Dagger */}
          <rect x="22" y="22" width="1" height="4" fill="#C0C0C0" />
          <rect x="21" y="26" width="3" height="1" fill="#8B4513" />
          {/* Belt */}
          <rect x="9" y="25" width="14" height="1" fill={dark} />
        </g>
      )}
      {outfit === "paladin" && (
        <g>
          {/* Shield emblem */}
          <rect x="13" y="21" width="6" height="4" fill={dark} />
          <rect x="14" y="22" width="4" height="2" fill="#FFD700" />
          <rect x="15" y="21" width="2" height="1" fill="#FFD700" />
          {/* Belt */}
          <rect x="9" y="25" width="14" height="1" fill={dark} />
          <rect x="15" y="25" width="2" height="1" fill="#FFD700" />
        </g>
      )}

      {/* Legs */}
      <rect x="10" y="26" width="5" height="4" fill="#4A4A6A" />
      <rect x="17" y="26" width="5" height="4" fill="#3A3A5A" />
      {/* Shoes */}
      <rect x="9" y="29" width="6" height="2" fill="#3A2A1A" />
      <rect x="17" y="29" width="6" height="2" fill="#2A1A0A" />
      <rect x="9" y="29" width="2" height="1" fill="#5A4A3A" />
      <rect x="17" y="29" width="2" height="1" fill="#5A4A3A" />
    </g>
  );
}

function AccessorySVG({ accessory }: { accessory: string }) {
  switch (accessory) {
    case "glasses":
      return (
        <g>
          <rect x="9" y="11" width="6" height="4" fill="none" stroke="#555" strokeWidth="0.8" />
          <rect x="17" y="11" width="6" height="4" fill="none" stroke="#555" strokeWidth="0.8" />
          <rect x="15" y="12" width="2" height="1" fill="#555" />
          <rect x="8" y="12" width="1" height="1" fill="#555" />
          <rect x="23" y="12" width="1" height="1" fill="#555" />
          {/* Lens glare */}
          <rect x="10" y="12" width="1" height="1" fill="rgba(255,255,255,0.3)" />
          <rect x="18" y="12" width="1" height="1" fill="rgba(255,255,255,0.3)" />
        </g>
      );
    case "earring":
      return (
        <g>
          <rect x="7" y="14" width="1" height="1" fill="#FFD700" />
          <rect x="7" y="15" width="1" height="2" fill="#FFD700" />
          <rect x="7" y="16" width="1" height="1" fill="#FFA500" />
        </g>
      );
    case "headband":
      return (
        <g>
          <rect x="7" y="7" width="18" height="2" fill="#DC2626" />
          <rect x="7" y="7" width="18" height="1" fill="#FF4444" />
          <rect x="24" y="8" width="2" height="4" fill="#DC2626" />
          <rect x="24" y="12" width="1" height="1" fill="#DC2626" />
        </g>
      );
    case "crown":
      return (
        <g>
          <rect x="9" y="1" width="14" height="3" fill="#FFD700" />
          <rect x="10" y="0" width="2" height="1" fill="#FFD700" />
          <rect x="15" y="-1" width="2" height="2" fill="#FFD700" />
          <rect x="20" y="0" width="2" height="1" fill="#FFD700" />
          {/* Gems */}
          <rect x="12" y="2" width="2" height="1" fill="#FF4444" />
          <rect x="18" y="2" width="2" height="1" fill="#4488FF" />
          <rect x="15" y="1" width="2" height="1" fill="#44FF44" />
          {/* Crown highlight */}
          <rect x="10" y="1" width="12" height="1" fill="#FFE44D" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <rect x="8" y="18" width="16" height="3" fill="#4488CC" />
          <rect x="7" y="19" width="3" height="6" fill="#4488CC" />
          <rect x="7" y="24" width="2" height="2" fill="#3366AA" />
          <rect x="8" y="18" width="16" height="1" fill="#5599DD" />
        </g>
      );
    default:
      return null;
  }
}

export function AvatarDisplay({ config, size = 220, className = "", onClick }: AvatarDisplayProps) {
  const c = config || defaultAvatarConfig;
  const skinDark = darkenColor(c.skinColor, 25);
  const skinLight = lightenColor(c.skinColor, 15);

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`${className} ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
      style={{ imageRendering: "pixelated" }}
      onClick={onClick}
    >
      {/* Head */}
      <rect x="9" y="5" width="14" height="13" fill={c.skinColor} />
      <rect x="8" y="7" width="1" height="9" fill={c.skinColor} />
      <rect x="23" y="7" width="1" height="9" fill={c.skinColor} />
      {/* Face shadow */}
      <rect x="9" y="16" width="14" height="1" fill={skinDark} />
      {/* Cheeks */}
      <rect x="9" y="14" width="2" height="2" fill="#FFB0B0" opacity="0.4" />
      <rect x="21" y="14" width="2" height="2" fill="#FFB0B0" opacity="0.4" />
      {/* Nose */}
      <rect x="15" y="14" width="2" height="1" fill={skinDark} />
      {/* Mouth */}
      <rect x="13" y="16" width="6" height="1" fill={skinDark} />
      <rect x="14" y="16" width="4" height="1" fill={darkenColor(c.skinColor, 50)} />
      {/* Neck */}
      <rect x="13" y="18" width="6" height="2" fill={c.skinColor} />
      <rect x="14" y="18" width="1" height="2" fill={skinDark} />

      {/* Outfit */}
      <OutfitSVG outfit={c.outfit} color={c.outfitColor} />

      {/* Hair (rendered over head) */}
      <HairSVG style={c.hairStyle} color={c.hairColor} />

      {/* Eyes */}
      <EyesSVG style={c.eyeStyle} />

      {/* Accessory (top layer) */}
      <AccessorySVG accessory={c.accessory} />
    </svg>
  );
}

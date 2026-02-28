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

function HairSVG({ style, color }: { style: string; color: string }) {
  const dark = darkenColor(color, 30);
  switch (style) {
    case "short":
      return (
        <g>
          <rect x="3" y="2" width="10" height="3" fill={color} />
          <rect x="2" y="3" width="1" height="3" fill={color} />
          <rect x="13" y="3" width="1" height="3" fill={color} />
          <rect x="3" y="2" width="10" height="1" fill={dark} />
        </g>
      );
    case "long":
      return (
        <g>
          <rect x="3" y="1" width="10" height="3" fill={color} />
          <rect x="2" y="2" width="1" height="8" fill={color} />
          <rect x="13" y="2" width="1" height="8" fill={color} />
          <rect x="3" y="1" width="10" height="1" fill={dark} />
        </g>
      );
    case "ponytail":
      return (
        <g>
          <rect x="3" y="2" width="10" height="3" fill={color} />
          <rect x="2" y="3" width="1" height="3" fill={color} />
          <rect x="13" y="3" width="2" height="2" fill={color} />
          <rect x="14" y="4" width="1" height="5" fill={color} />
          <rect x="3" y="2" width="10" height="1" fill={dark} />
        </g>
      );
    case "spiky":
      return (
        <g>
          <rect x="3" y="2" width="10" height="3" fill={color} />
          <rect x="2" y="3" width="1" height="3" fill={color} />
          <rect x="13" y="3" width="1" height="3" fill={color} />
          <rect x="4" y="1" width="2" height="1" fill={color} />
          <rect x="7" y="0" width="2" height="2" fill={color} />
          <rect x="10" y="1" width="2" height="1" fill={color} />
          <rect x="3" y="2" width="10" height="1" fill={dark} />
        </g>
      );
    case "bald":
      return (
        <g>
          <rect x="3" y="3" width="10" height="1" fill={darkenColor(color, 60)} opacity="0.3" />
        </g>
      );
    case "bob":
      return (
        <g>
          <rect x="3" y="2" width="10" height="3" fill={color} />
          <rect x="2" y="3" width="1" height="5" fill={color} />
          <rect x="13" y="3" width="1" height="5" fill={color} />
          <rect x="2" y="7" width="2" height="1" fill={color} />
          <rect x="12" y="7" width="2" height="1" fill={color} />
          <rect x="3" y="2" width="10" height="1" fill={dark} />
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
          <rect x="5" y="6" width="2" height="2" fill="#2D1B00" />
          <rect x="9" y="6" width="2" height="2" fill="#2D1B00" />
          <rect x="5" y="6" width="1" height="1" fill="white" />
          <rect x="9" y="6" width="1" height="1" fill="white" />
        </g>
      );
    case "happy":
      return (
        <g>
          <rect x="5" y="6" width="2" height="1" fill="#2D1B00" />
          <rect x="9" y="6" width="2" height="1" fill="#2D1B00" />
          <rect x="4" y="7" width="1" height="1" fill="#2D1B00" />
          <rect x="7" y="7" width="1" height="1" fill="#2D1B00" />
          <rect x="8" y="7" width="1" height="1" fill="#2D1B00" />
          <rect x="11" y="7" width="1" height="1" fill="#2D1B00" />
        </g>
      );
    case "cool":
      return (
        <g>
          <rect x="4" y="6" width="3" height="2" fill="#1a1a1a" />
          <rect x="9" y="6" width="3" height="2" fill="#1a1a1a" />
          <rect x="7" y="6" width="2" height="1" fill="#1a1a1a" />
          <rect x="4" y="6" width="1" height="1" fill="#444" />
          <rect x="9" y="6" width="1" height="1" fill="#444" />
        </g>
      );
    case "determined":
      return (
        <g>
          <rect x="5" y="6" width="2" height="2" fill="#2D1B00" />
          <rect x="9" y="6" width="2" height="2" fill="#2D1B00" />
          <rect x="5" y="5" width="2" height="1" fill="#2D1B00" opacity="0.5" />
          <rect x="9" y="5" width="2" height="1" fill="#2D1B00" opacity="0.5" />
          <rect x="5" y="6" width="1" height="1" fill="white" />
          <rect x="9" y="6" width="1" height="1" fill="white" />
        </g>
      );
    default:
      return null;
  }
}

function OutfitSVG({ outfit, color }: { outfit: string; color: string }) {
  const dark = darkenColor(color, 40);
  return (
    <g>
      {/* Body / torso */}
      <rect x="4" y="10" width="8" height="4" fill={color} />
      <rect x="3" y="11" width="1" height="3" fill={color} />
      <rect x="12" y="11" width="1" height="3" fill={color} />
      {/* Shoulders */}
      <rect x="2" y="11" width="2" height="2" fill={color} />
      <rect x="12" y="11" width="2" height="2" fill={color} />
      {/* Collar detail */}
      <rect x="6" y="10" width="4" height="1" fill={dark} />
      {/* Class-specific detail */}
      {outfit === "warrior" && <rect x="7" y="11" width="2" height="2" fill={dark} />}
      {outfit === "mage" && (
        <g>
          <rect x="7" y="11" width="2" height="1" fill="#FFD700" />
          <rect x="6" y="12" width="4" height="1" fill={dark} />
        </g>
      )}
      {outfit === "healer" && (
        <g>
          <rect x="7" y="11" width="2" height="1" fill="white" />
          <rect x="7.5" y="11.5" width="1" height="2" fill="#FF6B6B" />
          <rect x="7" y="12" width="2" height="1" fill="#FF6B6B" />
        </g>
      )}
      {outfit === "ranger" && (
        <g>
          <rect x="5" y="10" width="1" height="4" fill={dark} />
          <rect x="10" y="10" width="1" height="4" fill={dark} />
        </g>
      )}
      {outfit === "rogue" && (
        <g>
          <rect x="4" y="10" width="8" height="1" fill={dark} />
          <rect x="7" y="11" width="1" height="2" fill={dark} />
        </g>
      )}
      {outfit === "paladin" && (
        <g>
          <rect x="6" y="11" width="4" height="2" fill={dark} />
          <rect x="7" y="11" width="2" height="1" fill="#FFD700" />
        </g>
      )}
      {/* Legs */}
      <rect x="5" y="14" width="3" height="2" fill="#4A4A6A" />
      <rect x="8" y="14" width="3" height="2" fill="#3A3A5A" />
    </g>
  );
}

function AccessorySVG({ accessory }: { accessory: string }) {
  switch (accessory) {
    case "glasses":
      return (
        <g>
          <rect x="4" y="6" width="3" height="2" fill="none" stroke="#666" strokeWidth="0.5" />
          <rect x="9" y="6" width="3" height="2" fill="none" stroke="#666" strokeWidth="0.5" />
          <rect x="7" y="6.5" width="2" height="0.5" fill="#666" />
        </g>
      );
    case "earring":
      return (
        <g>
          <rect x="3" y="7" width="1" height="1" fill="#FFD700" />
          <rect x="3" y="8" width="1" height="1" fill="#FFD700" opacity="0.7" />
        </g>
      );
    case "headband":
      return (
        <g>
          <rect x="3" y="4" width="10" height="1" fill="#DC2626" />
          <rect x="3" y="4" width="10" height="0.5" fill="#FF4444" />
        </g>
      );
    case "crown":
      return (
        <g>
          <rect x="4" y="1" width="8" height="2" fill="#FFD700" />
          <rect x="5" y="0" width="1" height="1" fill="#FFD700" />
          <rect x="7.5" y="0" width="1" height="1" fill="#FFD700" />
          <rect x="10" y="0" width="1" height="1" fill="#FFD700" />
          <rect x="6" y="1" width="1" height="1" fill="#FF4444" />
          <rect x="9" y="1" width="1" height="1" fill="#4488FF" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <rect x="4" y="9" width="8" height="2" fill="#4488CC" />
          <rect x="3" y="10" width="2" height="3" fill="#4488CC" />
          <rect x="4" y="9" width="8" height="1" fill="#5599DD" />
        </g>
      );
    default:
      return null;
  }
}

export function AvatarDisplay({ config, size = 128, className = "", onClick }: AvatarDisplayProps) {
  const c = config || defaultAvatarConfig;

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={`${className} ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
      style={{ imageRendering: "pixelated" }}
      onClick={onClick}
    >
      {/* Head */}
      <rect x="4" y="3" width="8" height="7" fill={c.skinColor} />
      <rect x="3" y="4" width="1" height="5" fill={c.skinColor} />
      <rect x="12" y="4" width="1" height="5" fill={c.skinColor} />

      {/* Mouth */}
      <rect x="6" y="8" width="4" height="1" fill={darkenColor(c.skinColor, 40)} />

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

import React, { useState } from "react";
import { CanvasCard } from "./Canvas";

export interface Connection {
  _id: string;
  id: string;
  fromCardId: string;
  toCardId: string;
  label?: string;
  type: "relationship" | "dependency" | "timeline" | "custom";
  color?: string;
  createdBy: string;
  boardId: string;
}

export interface ConnectionLineProps {
  connection: Connection;
  cards: CanvasCard[];
  onDelete: (connectionId: string) => void;
  onUpdate: (connectionId: string, updates: Partial<Connection>) => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  cards,
  onDelete,
  onUpdate,
  onSelect,
  isSelected = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const fromCard = cards.find(card => card._id === connection.fromCardId);
  const toCard = cards.find(card => card._id === connection.toCardId);

  if (!fromCard || !toCard) {
    return null;
  }

  const fromX = fromCard.x + 150; // Card width / 2
  const fromY = fromCard.y + 50;  // Card height / 2
  const toX = toCard.x + 150;
  const toY = toCard.y + 50;

  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  const getConnectionColor = () => {
    if (connection.color) return connection.color;

    switch (connection.type) {
      case "relationship":
        return "hsl(var(--primary))";
      case "dependency":
        return "hsl(var(--destructive))";
      case "timeline":
        return "hsl(var(--warning))";
      case "custom":
        return "hsl(var(--muted-foreground))";
      default:
        return "hsl(var(--ring))";
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHovered) {
      onDelete(connection._id);
    } else {
      onSelect?.();
    }
  };

  return (
    <g>
      {/* Connection Line */}
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke={getConnectionColor()}
        strokeWidth={isHovered ? 3 : isSelected ? 3 : 2}
        strokeDasharray={connection.type === "dependency" ? "5,5" : "none"}
        markerEnd="url(#arrowhead)"
        className={`cursor-pointer transition-all duration-200 ${isSelected ? 'opacity-80' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      />

      {/* Connection Label */}
      {connection.label && (
        <g>
          <rect
            x={midX - 40}
            y={midY - 12}
            width={80}
            height={24}
            fill="hsl(var(--background))"
            stroke={getConnectionColor()}
            strokeWidth={1}
            rx={4}
            className="cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
          />
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fontSize={12}
            fill={getConnectionColor()}
            className="pointer-events-none select-none"
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Hover Delete Indicator */}
      {isHovered && (
        <g>
          <circle
            cx={midX}
            cy={midY}
            r={16}
            fill="hsl(var(--destructive))"
            className="cursor-pointer"
            onClick={handleClick}
          />
          <text
            x={midX}
            y={midY + 5}
            textAnchor="middle"
            fontSize={12}
            fill="hsl(var(--destructive-foreground))"
            className="pointer-events-none font-bold select-none"
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
};
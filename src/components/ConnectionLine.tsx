import { CanvasCard } from "./Canvas";

interface Connection {
  id: string;
  fromCardId: string;
  toCardId: string;
}

interface ConnectionLineProps {
  connection: Connection;
  cards: CanvasCard[];
  onDelete: (id: string) => void;
}

export const ConnectionLine = ({ connection, cards, onDelete }: ConnectionLineProps) => {
  const fromCard = cards.find((c) => c.id === connection.fromCardId);
  const toCard = cards.find((c) => c.id === connection.toCardId);

  if (!fromCard || !toCard) return null;

  // Calculate center points of cards
  const fromX = fromCard.x + 128; // Half of card width (256px / 2)
  const fromY = fromCard.y + 80; // Approximate center of card
  const toX = toCard.x + 128;
  const toY = toCard.y + 80;

  // Calculate control points for curved line
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const offset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5;
  
  const path = `M ${fromX} ${fromY} Q ${midX} ${midY - offset} ${toX} ${toY}`;

  // Calculate arrow position and rotation
  const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);

  return (
    <g className="connection-line group">
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--ring))"
        strokeWidth="2"
        className="opacity-40 hover:opacity-80 transition-opacity cursor-pointer"
        markerEnd="url(#arrowhead)"
      />
      <circle
        cx={midX}
        cy={midY}
        r="8"
        fill="hsl(var(--card))"
        stroke="hsl(var(--ring))"
        strokeWidth="2"
        className="opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(connection.id);
        }}
      />
      <text
        x={midX}
        y={midY + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-xs fill-destructive"
      >
        ×
      </text>
    </g>
  );
};

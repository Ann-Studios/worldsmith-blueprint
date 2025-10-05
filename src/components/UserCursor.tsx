import { CollaborationUser } from "./CollaborationUsers";

interface UserCursorProps {
    user: CollaborationUser;
    position: { x: number; y: number };
}

export const UserCursor = ({ user, position }: UserCursorProps) => {
    const getCursorColor = (userId: string) => {
        // Generate consistent color based on user ID
        const colors = [
            "hsl(var(--primary))",
            "hsl(var(--secondary))",
            "hsl(var(--accent))",
            "hsl(var(--destructive))",
            "hsl(var(--ring))",
        ];
        const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    if (!position.x || !position.y) return null;

    return (
        <div
            className="absolute pointer-events-none z-40 transition-all duration-100 ease-linear"
            style={{
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)',
            }}
        >
            {/* Cursor */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={getCursorColor(user.id)}
                strokeWidth="2"
                className="transform -rotate-45"
            >
                <path d="M4 4l16 8-8 4-4-8 4-4z" />
            </svg>

            {/* User label */}
            <div
                className="absolute top-4 left-4 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
                style={{ backgroundColor: getCursorColor(user.id) }}
            >
                {user.name}
            </div>
        </div>
    );
};
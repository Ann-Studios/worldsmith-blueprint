import { useEffect, useState } from "react";
import { Users, User, MoreVertical, Crown, Edit, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";

export interface CollaborationUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: "owner" | "editor" | "viewer";
    isOnline: boolean;
    lastSeen?: string;
    cursor?: { x: number; y: number };
    currentCard?: string;
}

interface CollaborationUsersProps {
    users: CollaborationUser[];
    currentBoardId?: string;
    currentUser?: CollaborationUser;
    onPermissionChange?: (userId: string, newRole: "editor" | "viewer") => void;
    onRemoveUser?: (userId: string) => void;
    onInviteUser?: (email: string, role: "editor" | "viewer") => void;
}

export const CollaborationUsers = ({
    users,
    currentBoardId,
    currentUser,
    onPermissionChange,
    onRemoveUser,
    onInviteUser
}: CollaborationUsersProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
    const [onlineUsers, setOnlineUsers] = useState<CollaborationUser[]>([]);
    const { toast } = useToast();

    // Filter online users and sort by role importance
    useEffect(() => {
        const sortedUsers = users
            .filter(user => user.isOnline)
            .sort((a, b) => {
                // Owner first, then editors, then viewers
                const roleOrder = { owner: 0, editor: 1, viewer: 2 };
                return roleOrder[a.role] - roleOrder[b.role];
            });
        setOnlineUsers(sortedUsers);
    }, [users]);

    const handleInviteUser = async () => {
        if (!inviteEmail.trim()) {
            toast({
                title: "Error",
                description: "Please enter an email address",
                variant: "destructive",
            });
            return;
        }

        try {
            if (onInviteUser) {
                onInviteUser(inviteEmail, inviteRole);
            } else {
                // MongoDB implementation - call API to invite user
                const response = await fetch('/boards/invite', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        boardId: currentBoardId,
                        email: inviteEmail,
                        role: inviteRole,
                        invitedBy: currentUser?.id,
                    })
                });

                if (!response.ok) throw new Error('Failed to invite user');
            }

            toast({
                title: "Invitation sent",
                description: `${inviteEmail} has been invited to collaborate`,
            });

            setInviteEmail("");
            setInviteRole("editor");
            setShowInviteDialog(false);
        } catch (error) {
            console.error("Failed to invite user:", error);
            toast({
                title: "Invitation failed",
                description: "Could not send invitation. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleRoleChange = async (userId: string, newRole: "editor" | "viewer") => {
        try {
            if (onPermissionChange) {
                onPermissionChange(userId, newRole);
            } else {
                // MongoDB implementation - call API to update role
                const response = await fetch('/boards/permissions', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        boardId: currentBoardId,
                        userId,
                        role: newRole,
                        updatedBy: currentUser?.id,
                    })
                });

                if (!response.ok) throw new Error('Failed to update role');
            }

            toast({
                title: "Role updated",
                description: `User role changed to ${newRole}`,
            });
        } catch (error) {
            console.error("Failed to update role:", error);
            toast({
                title: "Update failed",
                description: "Could not update user role. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleRemoveUser = async (userId: string, userName: string) => {
        try {
            if (onRemoveUser) {
                onRemoveUser(userId);
            } else {
                // MongoDB implementation - call API to remove user
                const response = await fetch('/boards/permissions', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        boardId: currentBoardId,
                        userId,
                        removedBy: currentUser?.id,
                    })
                });

                if (!response.ok) throw new Error('Failed to remove user');
            }

            toast({
                title: "User removed",
                description: `${userName} has been removed from the board`,
            });
        } catch (error) {
            console.error("Failed to remove user:", error);
            toast({
                title: "Removal failed",
                description: "Could not remove user. Please try again.",
                variant: "destructive",
            });
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "owner":
                return <Crown className="w-3 h-3 text-yellow-500" />;
            case "editor":
                return <Edit className="w-3 h-3 text-blue-500" />;
            case "viewer":
                return <Eye className="w-3 h-3 text-gray-500" />;
            default:
                return null;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "owner":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "editor":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "viewer":
                return "bg-gray-100 text-gray-800 border-gray-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const canManageUsers = currentUser?.role === "owner" || currentUser?.role === "editor";

    return (
        <>
            <div className="flex items-center gap-2">
                {/* Online users avatars */}
                <div className="flex items-center -space-x-2">
                    {onlineUsers.slice(0, 3).map((user) => (
                        <div key={user.id} className="relative group">
                            <Avatar className="w-8 h-8 border-2 border-background">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />

                            {/* User tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                <div className="flex items-center gap-2">
                                    <span>{user.name}</span>
                                    <Badge variant="outline" className={`text-xs ${getRoleColor(user.role)}`}>
                                        {getRoleIcon(user.role)}
                                        <span className="ml-1 capitalize">{user.role}</span>
                                    </Badge>
                                </div>
                                {user.currentCard && (
                                    <div className="text-muted-foreground mt-1">
                                        Editing: {user.currentCard}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {onlineUsers.length > 3 && (
                        <div className="relative group">
                            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                +{onlineUsers.length - 3}
                            </div>
                        </div>
                    )}
                </div>

                {/* Collaboration dropdown */}
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{onlineUsers.length} online</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <div className="p-2 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Collaborators</h3>
                                {canManageUsers && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowInviteDialog(true)}
                                    >
                                        Invite
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {onlineUsers.length} user(s) online
                            </p>
                        </div>

                        <div className="max-h-60 overflow-auto">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-2 hover:bg-accent rounded-sm"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="relative">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback className="text-xs">
                                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div
                                                className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-background rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium truncate">{user.name}</p>
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user.isOnline ? "Online" : `Last seen ${new Date(user.lastSeen!).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                    </div>

                                    {canManageUsers && user.id !== currentUser?.id && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                    <MoreVertical className="w-3 h-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <div className="p-2">
                                                    <p className="text-sm font-medium">Change Role</p>
                                                </div>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleRoleChange(user.id, "editor")}
                                                    disabled={user.role === "editor"}
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Make Editor
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleRoleChange(user.id, "viewer")}
                                                    disabled={user.role === "viewer"}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Make Viewer
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleRemoveUser(user.id, user.name)}
                                                    className="text-destructive"
                                                >
                                                    Remove User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            ))}
                        </div>

                        {users.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No collaborators yet</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => setShowInviteDialog(true)}
                                >
                                    Invite your first collaborator
                                </Button>
                            </div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Invite User Dialog */}
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Collaborator</DialogTitle>
                        <DialogDescription>
                            Invite someone to collaborate on this board. They will receive an email invitation.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="collaborator@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={inviteRole === "editor" ? "default" : "outline"}
                                    className="flex-1"
                                    onClick={() => setInviteRole("editor")}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editor
                                </Button>
                                <Button
                                    type="button"
                                    variant={inviteRole === "viewer" ? "default" : "outline"}
                                    className="flex-1"
                                    onClick={() => setInviteRole("viewer")}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Viewer
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {inviteRole === "editor"
                                    ? "Editors can create, edit, and delete cards and connections"
                                    : "Viewers can only view the board and add comments"
                                }
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowInviteDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleInviteUser}>
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
import { useState, useMemo } from "react";
import { MessageSquare, X, Check, Reply, MoreVertical, Trash2, Pin, AtSign } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Comment, CanvasCard } from "./Canvas";

interface CommentPanelProps {
    comments: Comment[];
    cards: CanvasCard[];
    onClose: () => void;
    onResolveComment: (id: string) => void;
    onDeleteComment: (id: string) => void;
    onNavigateToCard: (cardId: string) => void;
    onAddComment?: (cardId: string, content: string) => void;
    currentUser?: {
        id: string;
        name: string;
        avatar?: string;
    };
}

export const CommentPanel = ({
    comments,
    cards,
    onClose,
    onResolveComment,
    onDeleteComment,
    onNavigateToCard,
    onAddComment,
    currentUser = { id: "user-1", name: "Current User" }
}: CommentPanelProps) => {
    const [newComment, setNewComment] = useState("");
    const [selectedCardId, setSelectedCardId] = useState<string>("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [view, setView] = useState<"all" | "unresolved" | "mentions">("all");
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const { toast } = useToast();

    // Filter comments based on current view
    const filteredComments = useMemo(() => {
        let filtered = comments;

        if (view === "unresolved") {
            filtered = filtered.filter(comment => !comment.resolved);
        } else if (view === "mentions") {
            filtered = filtered.filter(comment =>
                comment.mentions.includes(currentUser.name.toLowerCase())
            );
        }

        return filtered.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [comments, view, currentUser.name]);

    // Group comments by card for better organization
    const commentsByCard = useMemo(() => {
        const grouped: Record<string, Comment[]> = {};

        filteredComments.forEach(comment => {
            if (!grouped[comment.cardId]) {
                grouped[comment.cardId] = [];
            }
            grouped[comment.cardId].push(comment);
        });

        return grouped;
    }, [filteredComments]);

    // Get card title for display
    const getCardTitle = (cardId: string) => {
        const card = cards.find(c => c.id === cardId);
        return card?.title || card?.content?.substring(0, 30) + "..." || "Unknown Card";
    };

    // Get card type for styling
    const getCardType = (cardId: string) => {
        const card = cards.find(c => c.id === cardId);
        return card?.type || "note";
    };

    // Handle adding a new comment
    const handleAddComment = () => {
        if (!newComment.trim() || !selectedCardId) {
            toast({
                title: "Cannot add comment",
                description: "Please select a card and enter a comment.",
                variant: "destructive",
            });
            return;
        }

        if (onAddComment) {
            onAddComment(selectedCardId, newComment);
        } else {
            // Fallback implementation
            console.log("Adding comment:", { cardId: selectedCardId, content: newComment });
        }

        setNewComment("");
        setSelectedCardId("");
        toast({
            title: "Comment added",
            description: "Your comment has been posted.",
        });
    };

    // Handle adding a reply
    const handleAddReply = (parentCommentId: string) => {
        if (!replyContent.trim()) {
            toast({
                title: "Cannot add reply",
                description: "Please enter a reply.",
                variant: "destructive",
            });
            return;
        }

        // In a real app, this would create a nested comment/reply
        // For now, we'll create a new top-level comment
        if (onAddComment) {
            const parentComment = comments.find(c => c.id === parentCommentId);
            if (parentComment) {
                onAddComment(parentComment.cardId, `@${getCommentAuthor(parentComment.id)} ${replyContent}`);
            }
        }

        setReplyContent("");
        setReplyingTo(null);
        toast({
            title: "Reply added",
            description: "Your reply has been posted.",
        });
    };

    // Extract mentions from text
    const extractMentions = (text: string): string[] => {
        const mentionRegex = /@(\w+)/g;
        const matches = text.match(mentionRegex);
        return matches ? matches.map(match => match.substring(1).toLowerCase()) : [];
    };

    // Get comment author name
    const getCommentAuthor = (commentId: string) => {
        const comment = comments.find(c => c.id === commentId);
        return comment?.createdBy || "Unknown User";
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return "Just now";
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 168) {
            return `${Math.floor(diffInHours / 24)}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    // Get user avatar initials
    const getAvatarInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Handle mention input
    const handleCommentInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNewComment(value);

        // Check for @ mention
        const lastAtSymbol = value.lastIndexOf('@');
        if (lastAtSymbol !== -1) {
            const query = value.substring(lastAtSymbol + 1).split(/\s/)[0];
            setMentionQuery(query);
            setShowMentionSuggestions(true);
        } else {
            setShowMentionSuggestions(false);
        }
    };

    // Available users for mentions (in real app, this would come from collaboration users)
    const availableUsers = [
        { id: "user-1", name: "Current User" },
        { id: "user-2", name: "Alex Johnson" },
        { id: "user-3", name: "Sam Smith" },
        { id: "user-4", name: "Taylor Brown" },
    ];

    const mentionSuggestions = availableUsers.filter(user =>
        user.name.toLowerCase().includes(mentionQuery.toLowerCase()) &&
        user.id !== currentUser.id
    );

    const insertMention = (userName: string) => {
        const lastAtSymbol = newComment.lastIndexOf('@');
        const beforeMention = newComment.substring(0, lastAtSymbol);
        const afterMention = newComment.substring(lastAtSymbol + mentionQuery.length + 1);
        setNewComment(`${beforeMention}@${userName} ${afterMention}`.trim());
        setShowMentionSuggestions(false);
        setMentionQuery("");
    };

    return (
        <div className="w-96 bg-card border-l flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <h2 className="font-semibold">Comments</h2>
                    <Badge variant="secondary" className="ml-2">
                        {filteredComments.length}
                    </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* View Filters */}
            <div className="flex gap-1 p-3 border-b">
                <Button
                    variant={view === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("all")}
                    className="flex-1"
                >
                    All
                </Button>
                <Button
                    variant={view === "unresolved" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("unresolved")}
                    className="flex-1"
                >
                    Unresolved
                </Button>
                <Button
                    variant={view === "mentions" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("mentions")}
                    className="flex-1"
                >
                    <AtSign className="w-3 h-3 mr-1" />
                    Mentions
                </Button>
            </div>

            {/* New Comment Input */}
            <div className="p-4 border-b">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Add to Card</label>
                        <select
                            value={selectedCardId}
                            onChange={(e) => setSelectedCardId(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                        >
                            <option value="">Select a card...</option>
                            {cards.map(card => (
                                <option key={card.id} value={card.id}>
                                    {getCardTitle(card.id)} ({card.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <label className="text-sm font-medium mb-1 block">Comment</label>
                        <Textarea
                            value={newComment}
                            onChange={handleCommentInput}
                            placeholder="Add a comment... Use @ to mention someone"
                            className="min-h-[80px] resize-none"
                        />

                        {/* Mention Suggestions */}
                        {showMentionSuggestions && mentionSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-popover border rounded-md shadow-lg z-10 mt-1">
                                {mentionSuggestions.map(user => (
                                    <button
                                        key={user.id}
                                        className="w-full p-2 text-left hover:bg-accent flex items-center gap-2"
                                        onClick={() => insertMention(user.name)}
                                    >
                                        <Avatar className="w-6 h-6">
                                            <AvatarFallback className="text-xs">
                                                {getAvatarInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{user.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || !selectedCardId}
                        className="w-full"
                    >
                        Add Comment
                    </Button>
                </div>
            </div>

            {/* Comments List */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {Object.entries(commentsByCard).length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">
                                {view === "all"
                                    ? "No comments yet"
                                    : view === "unresolved"
                                        ? "No unresolved comments"
                                        : "No mentions"
                                }
                            </p>
                        </div>
                    ) : (
                        Object.entries(commentsByCard).map(([cardId, cardComments]) => (
                            <div key={cardId} className="space-y-3">
                                {/* Card Header */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => onNavigateToCard(cardId)}
                                        className="flex items-center gap-2 hover:underline text-left"
                                    >
                                        <Badge variant="outline" className="capitalize">
                                            {getCardType(cardId)}
                                        </Badge>
                                        <span className="font-medium text-sm truncate">
                                            {getCardTitle(cardId)}
                                        </span>
                                    </button>
                                    <Badge variant="secondary" className="text-xs">
                                        {cardComments.length}
                                    </Badge>
                                </div>

                                {/* Comments for this card */}
                                <div className="space-y-3 ml-2 border-l-2 border-muted pl-3">
                                    {cardComments.map(comment => (
                                        <div
                                            key={comment.id}
                                            className={`p-3 rounded-lg border ${comment.resolved ? "bg-muted/30" : "bg-background"
                                                }`}
                                        >
                                            {/* Comment Header */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarFallback className="text-xs">
                                                            {getAvatarInitials(comment.createdBy)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{comment.createdBy}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(comment.createdAt)}
                                                    </span>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <MoreVertical className="w-3 h-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {!comment.resolved && (
                                                            <DropdownMenuItem
                                                                onClick={() => onResolveComment(comment.id)}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                                Mark Resolved
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Reply className="w-4 h-4" />
                                                            Reply
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {comment.createdBy === currentUser.id && (
                                                            <DropdownMenuItem
                                                                onClick={() => onDeleteComment(comment.id)}
                                                                className="flex items-center gap-2 text-destructive"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete Comment
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Comment Content */}
                                            <div className="text-sm whitespace-pre-wrap mb-2">
                                                {comment.content.split(' ').map((word, index) =>
                                                    word.startsWith('@') ? (
                                                        <span key={index} className="text-primary font-medium">
                                                            {word}{' '}
                                                        </span>
                                                    ) : (
                                                        <span key={index}>{word} </span>
                                                    )
                                                )}
                                            </div>

                                            {/* Mentions */}
                                            {comment.mentions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {comment.mentions.map(mention => (
                                                        <Badge key={mention} variant="outline" className="text-xs">
                                                            @{mention}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Comment Status */}
                                            <div className="flex items-center justify-between">
                                                {comment.resolved && (
                                                    <Badge variant="outline" className="text-xs text-green-600">
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Resolved
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Reply Input */}
                                            {replyingTo === comment.id && (
                                                <div className="mt-3 space-y-2">
                                                    <Textarea
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className="min-h-[60px] resize-none text-sm"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAddReply(comment.id)}
                                                            disabled={!replyContent.trim()}
                                                        >
                                                            Reply
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setReplyingTo(null)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Quick Actions Footer */}
            <div className="p-3 border-t bg-muted/20">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const unresolved = comments.filter(c => !c.resolved);
                            if (unresolved.length > 0) {
                                unresolved.forEach(comment => onResolveComment(comment.id));
                                toast({
                                    title: "All comments resolved",
                                    description: `${unresolved.length} comments marked as resolved.`,
                                });
                            }
                        }}
                        disabled={comments.filter(c => !c.resolved).length === 0}
                        className="flex-1"
                    >
                        <Check className="w-4 h-4 mr-1" />
                        Resolve All
                    </Button>
                </div>
            </div>
        </div>
    );
};
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Filter, Clock, Tag, User, MapPin, BookOpen, Package, MessageSquare, ArrowUpRight, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CanvasCard, Connection, Comment } from "./Canvas";

interface SearchPanelProps {
    cards: CanvasCard[];
    connections: Connection[];
    comments: Comment[];
    onClose: () => void;
    onSelectCard: (cardId: string) => void;
    onSelectConnection?: (connectionId: string) => void;
    onSelectComment?: (commentId: string) => void;
    recentSearches?: string[];
    onClearRecent?: () => void;
}

type SearchResultType = "all" | "cards" | "connections" | "comments";

interface SearchResult {
    id: string;
    type: "card" | "connection" | "comment";
    title?: string;
    content: string;
    cardType?: string;
    relevance: number;
    tags?: string[];
    timestamp?: string;
    author?: string;
    preview?: string;
}

export const SearchPanel = ({
    cards,
    connections,
    comments,
    onClose,
    onSelectCard,
    onSelectConnection,
    onSelectComment,
    recentSearches = [],
    onClearRecent
}: SearchPanelProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<SearchResultType>("all");
    const [selectedFilters, setSelectedFilters] = useState<{
        cardTypes: string[];
        tags: string[];
        timeRange: string;
    }>({
        cardTypes: [],
        tags: [],
        timeRange: "all"
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>(recentSearches);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus search input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Extract all unique tags from cards and comments
    const allTags = useMemo(() => {
        const tags = new Set<string>();

        cards.forEach(card => {
            card.tags?.forEach(tag => tags.add(tag.toLowerCase()));
        });

        comments.forEach(comment => {
            // Extract tags from comment content (words starting with #)
            const commentTags = comment.content.match(/#(\w+)/g) || [];
            commentTags.forEach(tag => tags.add(tag.substring(1).toLowerCase()));
        });

        return Array.from(tags).sort();
    }, [cards, comments]);

    // Extract all card types
    const allCardTypes = useMemo(() => {
        const types = new Set(cards.map(card => card.type));
        return Array.from(types).sort();
    }, [cards]);

    // Advanced search function
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();
        const results: SearchResult[] = [];
        const queryWords = query.split(/\s+/).filter(word => word.length > 0);

        // Search cards
        if (activeTab === "all" || activeTab === "cards") {
            cards.forEach(card => {
                // Skip if card type is filtered out
                if (selectedFilters.cardTypes.length > 0 && !selectedFilters.cardTypes.includes(card.type)) {
                    return;
                }

                // Skip if tags are filtered and card doesn't have any matching tags
                if (selectedFilters.tags.length > 0 &&
                    !selectedFilters.tags.some(tag => card.tags?.includes(tag))) {
                    return;
                }

                const searchableContent = [
                    card.title?.toLowerCase() || '',
                    card.content.toLowerCase(),
                    card.type.toLowerCase(),
                    ...(card.tags || []).map(tag => tag.toLowerCase())
                ].join(' ');

                // Calculate relevance score
                let relevance = 0;

                // Exact matches in title get highest score
                if (card.title?.toLowerCase().includes(query)) {
                    relevance += 100;
                }

                // Word-by-word matching
                queryWords.forEach(word => {
                    if (card.title?.toLowerCase().includes(word)) relevance += 50;
                    if (card.content.toLowerCase().includes(word)) relevance += 10;
                    if (card.type.toLowerCase().includes(word)) relevance += 30;
                    if (card.tags?.some(tag => tag.toLowerCase().includes(word))) relevance += 20;
                });

                // Count occurrences
                const totalOccurrences = queryWords.reduce((count, word) => {
                    return count + (searchableContent.split(word).length - 1);
                }, 0);

                relevance += totalOccurrences * 5;

                if (relevance > 0) {
                    results.push({
                        id: card._id,
                        type: "card",
                        title: card.title,
                        content: card.content,
                        cardType: card.type,
                        relevance,
                        tags: card.tags,
                        timestamp: card.updatedAt,
                        author: card.createdBy,
                        preview: getContentPreview(card.content, queryWords)
                    });
                }
            });
        }

        // Search connections
        if (activeTab === "all" || activeTab === "connections") {
            connections.forEach(connection => {
                const fromCard = cards.find(c => c._id === connection.fromCardId);
                const toCard = cards.find(c => c._id === connection.toCardId);

                if (!fromCard || !toCard) return;

                const searchableContent = [
                    connection.label?.toLowerCase() || '',
                    connection.type.toLowerCase(),
                    fromCard.title?.toLowerCase() || '',
                    toCard.title?.toLowerCase() || '',
                    fromCard.content.toLowerCase(),
                    toCard.content.toLowerCase()
                ].join(' ');

                let relevance = 0;
                queryWords.forEach(word => {
                    if (connection.label?.toLowerCase().includes(word)) relevance += 40;
                    if (connection.type.toLowerCase().includes(word)) relevance += 30;
                    if (fromCard.title?.toLowerCase().includes(word)) relevance += 20;
                    if (toCard.title?.toLowerCase().includes(word)) relevance += 20;
                });

                if (relevance > 0) {
                    results.push({
                        id: connection.id,
                        type: "connection",
                        title: `${fromCard.title || 'Card'} → ${toCard.title || 'Card'}`,
                        content: connection.label || `${connection.type} connection`,
                        cardType: "connection",
                        relevance,
                        timestamp: connection.createdBy, // Using createdBy as timestamp placeholder
                        preview: `Connection: ${connection.type}${connection.label ? ` - ${connection.label}` : ''}`
                    });
                }
            });
        }

        // Search comments
        if (activeTab === "all" || activeTab === "comments") {
            comments.forEach(comment => {
                // Skip if tags are filtered and comment doesn't have any matching tags
                const commentTags = comment.content.match(/#(\w+)/g)?.map(tag => tag.substring(1).toLowerCase()) || [];
                if (selectedFilters.tags.length > 0 &&
                    !selectedFilters.tags.some(tag => commentTags.includes(tag))) {
                    return;
                }

                const searchableContent = comment.content.toLowerCase();
                let relevance = 0;

                queryWords.forEach(word => {
                    if (searchableContent.includes(word)) relevance += 15;
                    if (comment.mentions.some(mention => mention.toLowerCase().includes(word))) relevance += 25;
                });

                if (relevance > 0) {
                    const card = cards.find(c => c._id === comment.cardId);
                    results.push({
                        id: comment._id,
                        type: "comment",
                        title: `Comment on ${card?.title || 'Card'}`,
                        content: comment.content,
                        cardType: "comment",
                        relevance,
                        tags: commentTags,
                        timestamp: comment.createdAt,
                        author: comment.createdBy,
                        preview: getContentPreview(comment.content, queryWords)
                    });
                }
            });
        }

        // Sort by relevance and apply time filter
        return results
            .filter(result => {
                if (selectedFilters.timeRange === "all") return true;

                const resultDate = new Date(result.timestamp || 0);
                const now = new Date();
                const diffHours = (now.getTime() - resultDate.getTime()) / (1000 * 60 * 60);

                switch (selectedFilters.timeRange) {
                    case "day": return diffHours <= 24;
                    case "week": return diffHours <= 168;
                    case "month": return diffHours <= 720;
                    default: return true;
                }
            })
            .sort((a, b) => b.relevance - a.relevance);
    }, [searchQuery, cards, connections, comments, activeTab, selectedFilters]);

    // Get content preview with highlighted terms
    const getContentPreview = (content: string, queryWords: string[]): string => {
        const maxLength = 120;
        const lowerContent = content.toLowerCase();

        // Find the first occurrence of any query word
        let firstIndex = -1;
        for (const word of queryWords) {
            const index = lowerContent.indexOf(word);
            if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
                firstIndex = index;
            }
        }

        if (firstIndex === -1) {
            return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "");
        }

        // Show context around the found term
        const start = Math.max(0, firstIndex - 30);
        const end = Math.min(content.length, firstIndex + 90);
        let preview = content.substring(start, end);

        if (start > 0) preview = "..." + preview;
        if (end < content.length) preview = preview + "...";

        return preview;
    };

    // Highlight matching text in results
    const highlightText = (text: string, queryWords: string[]): JSX.Element => {
        if (!text) return <span></span>;

        let elements: JSX.Element[] = [<span key="0">{text}</span>];

        queryWords.forEach((word, wordIndex) => {
            if (word.length < 2) return;

            const newElements: JSX.Element[] = [];
            elements.forEach(element => {
                if (typeof element.props.children !== 'string') {
                    newElements.push(element);
                    return;
                }

                const content = element.props.children;
                const lowerContent = content.toLowerCase();
                const lowerWord = word.toLowerCase();
                let lastIndex = 0;
                let index = lowerContent.indexOf(lowerWord);

                while (index !== -1) {
                    // Add text before match
                    if (index > lastIndex) {
                        newElements.push(
                            <span key={`${wordIndex}-${lastIndex}`}>
                                {content.substring(lastIndex, index)}
                            </span>
                        );
                    }

                    // Add highlighted match
                    newElements.push(
                        <mark key={`${wordIndex}-${index}`} className="bg-yellow-200 dark:bg-yellow-600 px-0.5 rounded">
                            {content.substring(index, index + word.length)}
                        </mark>
                    );

                    lastIndex = index + word.length;
                    index = lowerContent.indexOf(lowerWord, lastIndex);
                }

                // Add remaining text
                if (lastIndex < content.length) {
                    newElements.push(
                        <span key={`${wordIndex}-end`}>
                            {content.substring(lastIndex)}
                        </span>
                    );
                }
            });

            elements = newElements;
        });

        return <>{elements}</>;
    };

    // Handle search submission
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() && !searchHistory.includes(query)) {
            const newHistory = [query, ...searchHistory.slice(0, 9)];
            setSearchHistory(newHistory);
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedFilters({
            cardTypes: [],
            tags: [],
            timeRange: "all"
        });
    };

    // Toggle card type filter
    const toggleCardType = (type: string) => {
        setSelectedFilters(prev => ({
            ...prev,
            cardTypes: prev.cardTypes.includes(type)
                ? prev.cardTypes.filter(t => t !== type)
                : [...prev.cardTypes, type]
        }));
    };

    // Toggle tag filter
    const toggleTag = (tag: string) => {
        setSelectedFilters(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    // Get icon for card type
    const getCardTypeIcon = (type: string) => {
        switch (type) {
            case "character": return <User className="w-3 h-3" />;
            case "location": return <MapPin className="w-3 h-3" />;
            case "plot": return <BookOpen className="w-3 h-3" />;
            case "item": return <Package className="w-3 h-3" />;
            case "note": return <MessageSquare className="w-3 h-3" />;
            case "connection": return <Zap className="w-3 h-3" />;
            case "comment": return <MessageSquare className="w-3 h-3" />;
            default: return <Search className="w-3 h-3" />;
        }
    };

    // Get color for card type
    const getCardTypeColor = (type: string) => {
        switch (type) {
            case "character": return "bg-blue-100 text-blue-800 border-blue-200";
            case "location": return "bg-green-100 text-green-800 border-green-200";
            case "plot": return "bg-purple-100 text-purple-800 border-purple-200";
            case "item": return "bg-orange-100 text-orange-800 border-orange-200";
            case "note": return "bg-gray-100 text-gray-800 border-gray-200";
            case "connection": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "comment": return "bg-indigo-100 text-indigo-800 border-indigo-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    // Handle result click
    const handleResultClick = (result: SearchResult) => {
        if (result.type === "card" && onSelectCard) {
            onSelectCard(result.id);
        } else if (result.type === "connection" && onSelectConnection) {
            onSelectConnection(result.id);
        } else if (result.type === "comment" && onSelectComment) {
            onSelectComment(result.id);
            // Also navigate to the card the comment is on
            const comment = comments.find(c => c._id === result.id);
            if (comment && onSelectCard) {
                onSelectCard(comment.cardId);
            }
        }
        onClose();
    };

    return (
        <div className="w-96 bg-card border-l flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    <h2 className="font-semibold">Search</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        ref={inputRef}
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search cards, connections, comments..."
                        className="pl-9 pr-9"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                            onClick={() => setSearchQuery("")}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    )}
                </div>

                {/* Quick Filters */}
                <div className="flex items-center justify-between mt-3">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchResultType)} className="w-full">
                        <TabsList className="grid grid-cols-4">
                            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                            <TabsTrigger value="cards" className="text-xs">Cards</TabsTrigger>
                            <TabsTrigger value="connections" className="text-xs">Links</TabsTrigger>
                            <TabsTrigger value="comments" className="text-xs">Comments</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`ml-2 ${showFilters ? 'bg-accent' : ''}`}
                    >
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="p-4 border-b space-y-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Filters</h3>
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear All
                        </Button>
                    </div>

                    {/* Card Type Filters */}
                    <div>
                        <label className="text-xs font-medium mb-2 block">Card Types</label>
                        <div className="flex flex-wrap gap-1">
                            {allCardTypes.map(type => (
                                <Badge
                                    key={type}
                                    variant={selectedFilters.cardTypes.includes(type) ? "default" : "outline"}
                                    className="cursor-pointer text-xs capitalize"
                                    onClick={() => toggleCardType(type)}
                                >
                                    {getCardTypeIcon(type)}
                                    <span className="ml-1">{type}</span>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Tag Filters */}
                    {allTags.length > 0 && (
                        <div>
                            <label className="text-xs font-medium mb-2 block">Tags</label>
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                {allTags.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant={selectedFilters.tags.includes(tag) ? "default" : "outline"}
                                        className="cursor-pointer text-xs"
                                        onClick={() => toggleTag(tag)}
                                    >
                                        <Tag className="w-3 h-3 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Time Filter */}
                    <div>
                        <label className="text-xs font-medium mb-2 block">Time Range</label>
                        <div className="flex gap-1">
                            {[
                                { value: "all", label: "All Time" },
                                { value: "day", label: "Last Day" },
                                { value: "week", label: "Last Week" },
                                { value: "month", label: "Last Month" }
                            ].map(range => (
                                <Badge
                                    key={range.value}
                                    variant={selectedFilters.timeRange === range.value ? "default" : "outline"}
                                    className="cursor-pointer text-xs"
                                    onClick={() => setSelectedFilters(prev => ({ ...prev, timeRange: range.value }))}
                                >
                                    <Clock className="w-3 h-3 mr-1" />
                                    {range.label}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Search Results */}
            <ScrollArea className="flex-1">
                <div className="p-4">
                    {!searchQuery ? (
                        /* Recent Searches */
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                <span>Recent Searches</span>
                                {searchHistory.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={() => setSearchHistory([])}>
                                        Clear
                                    </Button>
                                )}
                            </h3>
                            {searchHistory.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No recent searches
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {searchHistory.map((search, index) => (
                                        <Button
                                            key={index}
                                            variant="ghost"
                                            className="w-full justify-start h-auto py-2 px-3 text-sm"
                                            onClick={() => handleSearch(search)}
                                        >
                                            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                            <span className="text-left truncate">{search}</span>
                                        </Button>
                                    ))}
                                </div>
                            )}

                            {/* Quick Tips */}
                            <div className="pt-4 border-t">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Search Tips</h3>
                                <div className="space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-3 h-3" />
                                        <span>Use # to search tags</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3" />
                                        <span>Filter by card type using the tabs</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-3 h-3" />
                                        <span>Use advanced filters for precise results</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : searchResults.length === 0 ? (
                        /* No Results */
                        <div className="text-center py-8">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
                            <p className="text-xs text-muted-foreground mt-1">Try different keywords or check your filters</p>
                        </div>
                    ) : (
                        /* Search Results */
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">
                                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                    {activeTab === "all" ? "All Types" : activeTab}
                                </Badge>
                            </div>

                            {searchResults.map((result, index) => (
                                <div
                                    key={`${result.id}-${index}`}
                                    className="p-3 border rounded-lg hover:border-primary cursor-pointer transition-colors group"
                                    onClick={() => handleResultClick(result)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs capitalize ${getCardTypeColor(result.cardType || '')}`}
                                            >
                                                {getCardTypeIcon(result.cardType || '')}
                                                <span className="ml-1">{result.cardType}</span>
                                            </Badge>
                                            {result.relevance > 50 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {result.relevance > 80 ? "Best" : "Good"} Match
                                                </Badge>
                                            )}
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {result.title && (
                                        <h4 className="font-medium text-sm mb-1">
                                            {highlightText(result.title, searchQuery.split(' '))}
                                        </h4>
                                    )}

                                    {result.preview && (
                                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                            {highlightText(result.preview, searchQuery.split(' '))}
                                        </p>
                                    )}

                                    {/* Metadata */}
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-3">
                                            {result.author && (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {result.author}
                                                </span>
                                            )}
                                            {result.timestamp && (
                                                <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                                            )}
                                        </div>

                                        {result.tags && result.tags.length > 0 && (
                                            <div className="flex gap-1">
                                                {result.tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className="text-xs bg-muted px-1 rounded">#{tag}</span>
                                                ))}
                                                {result.tags.length > 2 && (
                                                    <span className="text-xs">+{result.tags.length - 2}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
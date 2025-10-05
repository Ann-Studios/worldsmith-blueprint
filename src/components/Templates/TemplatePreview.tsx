// components/templates/TemplatePreview.tsx
import React from 'react';
import { Template } from '@/types/Template';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, Star, Users } from 'lucide-react';

interface TemplatePreviewProps {
    template: Template;
    onClose: () => void;
    onApply: () => void;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
    template,
    onClose,
    onApply
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold">{template.name}</h2>
                        <p className="text-gray-600">{template.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
                    {/* Template Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Template Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Category:</span>
                                        <Badge variant="secondary">{template.category}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cards:</span>
                                        <span>{template.cards.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Connections:</span>
                                        <span>{template.connections.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Stats</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Rating:</span>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span>{template.rating.toFixed(1)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Usage:</span>
                                    <div className="flex items-center gap-1">
                                        <Download className="h-4 w-4" />
                                        <span>{template.usageCount}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Visibility:</span>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <span>{template.isPublic ? 'Public' : 'Private'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-1">
                                {template.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cards Preview */}
                    <div>
                        <h3 className="font-semibold mb-4">Cards in this Template</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {template.cards.slice(0, 6).map((card, index) => (
                                <div key={card._id} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary">{card.type}</Badge>
                                        <span className="text-sm text-gray-600">({card.x}, {card.y})</span>
                                    </div>
                                    <h4 className="font-medium mb-1">{card.title || 'Untitled Card'}</h4>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {card.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {template.cards.length > 6 && (
                            <div className="text-center mt-4 text-sm text-gray-600">
                                +{template.cards.length - 6} more cards
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onApply}>
                        <Download className="h-4 w-4 mr-2" />
                        Apply to Board
                    </Button>
                </div>
            </div>
        </div>
    );
};
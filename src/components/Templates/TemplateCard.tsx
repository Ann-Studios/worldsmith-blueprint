// components/templates/TemplateCard.tsx
import React from 'react';
import { Template } from '@/types/Template';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Download } from 'lucide-react';

interface TemplateCardProps {
    template: Template;
    onApply: (templateId: string) => void;
    onPreview: (template: Template) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
    template,
    onApply,
    onPreview
}) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Thumbnail */}
            <div
                className="h-40 bg-gradient-to-br from-blue-50 to-purple-100 rounded-t-lg flex items-center justify-center cursor-pointer"
                onClick={() => onPreview(template)}
            >
                {template.thumbnail ? (
                    <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="h-full w-full object-cover rounded-t-lg"
                    />
                ) : (
                    <div className="text-4xl">
                        {template.category === 'worldbuilding' && '🗺️'}
                        {template.category === 'character' && '👤'}
                        {template.category === 'plot' && '📖'}
                        {template.category === 'location' && '🏰'}
                        {template.category === 'system' && '🎲'}
                        {template.category === 'custom' && '⚙️'}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                        {template.name}
                    </h3>
                    <Badge variant="secondary" className="ml-2 shrink-0">
                        {template.cards.length} cards
                    </Badge>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                    {template.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 3}
                        </Badge>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{template.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            <span>{template.usageCount}</span>
                        </div>
                    </div>
                    {template.isPublic && (
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>Public</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onPreview(template)}
                    >
                        Preview
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onApply(template._id)}
                    >
                        Use
                    </Button>
                </div>
            </div>
        </div>
    );
};
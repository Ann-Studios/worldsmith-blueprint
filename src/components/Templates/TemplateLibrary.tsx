// components/templates/TemplateLibrary.tsx
import React, { useState, useEffect } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { TemplateCard } from './TemplateCard';
import { TemplatePreview } from './TemplatePreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Grid, List, Plus } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface TemplateLibraryProps {
    boardId?: string;
    onTemplateApplied?: (templateId: string) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
    boardId,
    onTemplateApplied
}) => {
    const {
        templates,
        categories,
        isLoading,
        error,
        getTemplates,
        applyTemplate
    } = useTemplates();

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedTemplate, setSelectedTemplate] = useState<{ _id: string; name: string; description: string; category: string; cards: unknown[] } | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        getTemplates(selectedCategory === 'all' ? undefined : selectedCategory, searchQuery);
    }, [selectedCategory, searchQuery, getTemplates]);

    const handleApplyTemplate = async (templateId: string) => {
        if (!boardId) {
            alert('Please select a board first');
            return;
        }

        try {
            await applyTemplate(templateId, boardId);
            onTemplateApplied?.(templateId);
            alert('Template applied successfully!');
        } catch (error) {
            alert('Failed to apply template');
        }
    };

    const handlePreviewTemplate = (template: { _id: string; name: string; description: string; category: string; cards: unknown[] }) => {
        setSelectedTemplate(template);
        setShowPreview(true);
    };

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-600 mb-4">Error loading templates: {error}</div>
                <Button onClick={() => getTemplates()}>Try Again</Button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">Template Library</h1>
                        <p className="text-gray-600">Choose from pre-built templates to get started quickly</p>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Template
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-48">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.icon} {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex border rounded-lg">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                        <p className="text-gray-600 mb-4">
                            {searchQuery || selectedCategory !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Be the first to create a template!'
                            }
                        </p>
                        <Button>Create Template</Button>
                    </div>
                ) : (
                    <div className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                            : 'space-y-4'
                    }>
                        {templates.map(template => (
                            <TemplateCard
                                key={template._id}
                                template={template}
                                onApply={handleApplyTemplate}
                                onPreview={handlePreviewTemplate}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && selectedTemplate && (
                <TemplatePreview
                    template={selectedTemplate}
                    onClose={() => setShowPreview(false)}
                    onApply={() => {
                        handleApplyTemplate(selectedTemplate._id);
                        setShowPreview(false);
                    }}
                />
            )}
        </div>
    );
};
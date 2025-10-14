import React, { useState } from 'react';
import { Download, FileText, Image, FileImage, File } from 'lucide-react';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Slider } from './ui/slider';
import { exportCanvas, ExportOptions } from '@/lib/exportUtils';

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    canvasElement: HTMLElement | null;
    boardName: string;
    data?: any;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
    isOpen,
    onClose,
    canvasElement,
    boardName,
    data,
}) => {
    const [format, setFormat] = useState<'json' | 'png' | 'pdf' | 'svg'>('png');
    const [quality, setQuality] = useState([1]);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!canvasElement) return;

        setIsExporting(true);
        try {
            const options: ExportOptions = {
                format,
                quality: quality[0],
                includeConnections: true,
                includeComments: true,
            };

            await exportCanvas(canvasElement, boardName, options, data);
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const formatOptions = [
        {
            value: 'png' as const,
            label: 'PNG Image',
            description: 'High-quality image format',
            icon: <Image className="w-4 h-4" />,
        },
        {
            value: 'pdf' as const,
            label: 'PDF Document',
            description: 'Multi-page document format',
            icon: <FileText className="w-4 h-4" />,
        },
        {
            value: 'svg' as const,
            label: 'SVG Vector',
            description: 'Scalable vector graphics',
            icon: <FileImage className="w-4 h-4" />,
        },
        {
            value: 'json' as const,
            label: 'JSON Data',
            description: 'Raw data for import/backup',
            icon: <File className="w-4 h-4" />,
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Export Canvas
                    </DialogTitle>
                    <DialogDescription>
                        Choose a format to export your canvas. The export will include all cards, connections, and comments.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label>Export Format</Label>
                        <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
                            {formatOptions.map((option) => (
                                <div key={option.value} className="flex items-center space-x-3">
                                    <RadioGroupItem value={option.value} id={option.value} />
                                    <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                                        {option.icon}
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-sm text-muted-foreground">{option.description}</div>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {format === 'png' || format === 'pdf' ? (
                        <div className="space-y-3">
                            <Label>Quality: {quality[0] === 1 ? 'High' : quality[0] === 2 ? 'Very High' : 'Ultra High'}</Label>
                            <Slider
                                value={quality}
                                onValueChange={setQuality}
                                max={3}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>1x (Fast)</span>
                                <span>2x (Balanced)</span>
                                <span>3x (Best)</span>
                            </div>
                        </div>
                    ) : null}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isExporting}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

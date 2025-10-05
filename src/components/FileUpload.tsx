import { useRef, useState } from "react";
import { Upload, FileText, Image } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
    onUploadComplete: (attachment: any) => void;
    cardId: string;
}

export const FileUpload = ({ onUploadComplete, cardId }: FileUploadProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size (e.g., 10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            toast({
                title: "File too large",
                description: "Please select a file smaller than 10MB",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);

        try {
            // Create FormData to send the file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('cardId', cardId);
            formData.append('filename', file.name);
            formData.append('type', file.type.startsWith('image/') ? 'image' : 'file');
            formData.append('size', file.size.toString());

            // Upload to MongoDB Atlas via your API
            const response = await api.post('/attachments/upload', formData, {headers: {'Content-Type': 'multipart/form-data',},});

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }

            const attachment = await response.json();

            // Call the callback with the attachment data
            onUploadComplete(attachment);

            toast({
                title: "File uploaded",
                description: `${file.name} has been attached successfully`,
            });

        } catch (error) {
            console.error('Upload failed:', error);
            toast({
                title: "Upload failed",
                description: "Could not upload file. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.md"
            />
            <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
            >
                <Upload className="w-4 h-4" />
                {isUploading ? "Uploading..." : "Attach File"}
            </Button>
        </div>
    );
};
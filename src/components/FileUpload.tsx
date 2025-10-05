import { useRef, useState } from "react";
import { Upload, X, FileText, Image } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
    onUploadComplete: (attachment: any) => void;
    cardId: string;
}

export const FileUpload = ({ onUploadComplete, cardId }: FileUploadProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${cardId}/${Math.random()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('attachments')
                .upload(fileName, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(fileName);

            const attachment = {
                id: `att-${Date.now()}`,
                cardId,
                filename: file.name,
                url: publicUrl,
                type: file.type.startsWith('image/') ? 'image' : 'file',
                uploadedBy: "user", // Replace with actual user
                uploadedAt: new Date().toISOString(),
                size: file.size,
            };

            onUploadComplete(attachment);
        } catch (error) {
            console.error('Upload failed:', error);
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
                accept="image/*,.pdf,.doc,.docx,.txt"
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
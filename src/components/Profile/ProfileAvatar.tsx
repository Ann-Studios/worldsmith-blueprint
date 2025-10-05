// components/profile/ProfileAvatar.tsx
import React, { useRef, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

interface ProfileAvatarProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    editable?: boolean;
    userId?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
    size = 'md',
    editable = false,
    userId
}) => {
    const { user } = useAuth();
    const { profile, uploadAvatar, isLoading } = useProfile();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    };

    const handleAvatarClick = () => {
        if (editable && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                await uploadAvatar(file);
            } catch (error) {
                console.error('Failed to upload avatar:', error);
            }
        }
    };

    const displayProfile = userId ? undefined : profile;
    const avatarUrl = displayProfile?.avatar || user?.avatar;
    const displayName = displayProfile?.displayName || user?.name;

    return (
        <div className="relative">
            <div
                className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold cursor-pointer relative overflow-hidden`}
                onClick={handleAvatarClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-lg">
                        {displayName?.charAt(0).toUpperCase()}
                    </span>
                )}

                {editable && isHovered && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white text-xs">Change</span>
                    </div>
                )}

                {isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    </div>
                )}
            </div>

            {editable && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            )}
        </div>
    );
};
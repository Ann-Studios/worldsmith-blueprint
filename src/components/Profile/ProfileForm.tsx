// components/profile/ProfileForm.tsx
import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { ProfileAvatar } from './ProfileAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export const ProfileForm: React.FC = () => {
    const { profile, updateProfile, isLoading, error } = useProfile();
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        website: '',
        twitter: '',
        github: '',
        discord: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                displayName: profile.displayName || '',
                bio: profile.bio || '',
                website: profile.socialLinks?.website || '',
                twitter: profile.socialLinks?.twitter || '',
                github: profile.socialLinks?.github || '',
                discord: profile.socialLinks?.discord || '',
            });
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile({
                displayName: formData.displayName,
                bio: formData.bio,
                socialLinks: {
                    website: formData.website || undefined,
                    twitter: formData.twitter || undefined,
                    github: formData.github || undefined,
                    discord: formData.discord || undefined,
                },
            });
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center gap-6 mb-8">
                <ProfileAvatar size="xl" editable />
                <div>
                    <h1 className="text-2xl font-bold">Profile Settings</h1>
                    <p className="text-gray-600">Manage your account information and preferences</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={formData.displayName}
                            onChange={(e) => handleChange('displayName', e.target.value)}
                            placeholder="Enter your display name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => handleChange('bio', e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={3}
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                type="url"
                                value={formData.website}
                                onChange={(e) => handleChange('website', e.target.value)}
                                placeholder="https://yourwebsite.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="twitter">Twitter</Label>
                            <Input
                                id="twitter"
                                value={formData.twitter}
                                onChange={(e) => handleChange('twitter', e.target.value)}
                                placeholder="@username"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="github">GitHub</Label>
                            <Input
                                id="github"
                                value={formData.github}
                                onChange={(e) => handleChange('github', e.target.value)}
                                placeholder="username"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="discord">Discord</Label>
                            <Input
                                id="discord"
                                value={formData.discord}
                                onChange={(e) => handleChange('discord', e.target.value)}
                                placeholder="username#1234"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t">
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
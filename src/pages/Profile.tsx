// pages/Profile.tsx
import React, { useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { Button } from '@/components/ui/button';

export const Profile: React.FC = () => {
    const { profile, getProfile, isLoading } = useProfile();

    useEffect(() => {
        getProfile();
    }, [getProfile]);

    if (isLoading && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Profile</h1>
                        <p className="text-gray-600">Manage your account and preferences</p>
                    </div>
                    <Button variant="outline" onClick={() => getProfile()}>
                        Refresh
                    </Button>
                </div>

                <div className="space-y-8">
                    {profile && <ProfileStats profile={profile} />}
                    <ProfileForm />
                </div>
            </div>
        </div>
    );
};
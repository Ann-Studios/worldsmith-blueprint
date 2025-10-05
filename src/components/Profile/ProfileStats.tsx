// components/profile/ProfileStats.tsx
import React from 'react';
import { UserProfile } from '@/types/profile';

interface ProfileStatsProps {
    profile: UserProfile;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ profile }) => {
    const stats = profile.stats;

    if (!stats) {
        return (
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Profile Stats</h3>
                <p className="text-gray-500">No stats available yet.</p>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Worlds Created',
            value: stats.worldsCreated,
            icon: '🗺️'
        },
        {
            label: 'Characters',
            value: stats.charactersCreated,
            icon: '👤'
        },
        {
            label: 'Total Cards',
            value: stats.totalCards,
            icon: '📝'
        },
        {
            label: 'Member Since',
            value: new Date(stats.joinedDate).getFullYear(),
            icon: '📅'
        }
    ];

    return (
        <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Profile Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
// hooks/useProfile.ts
import { useState, useCallback } from 'react';
import { api } from '@/config/api';
import { UserProfile, ProfileUpdateData } from '@/types/profile';
import { useAuth } from './useAuth';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getProfile = useCallback(async (userId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const targetUserId = userId || user?._id;
      if (!targetUserId) throw new Error('No user ID provided');

      const profileData = await api.get(`/profile/${targetUserId}`);
      setProfile(profileData);
      return profileData;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  const updateProfile = useCallback(async (updateData: ProfileUpdateData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user?._id) throw new Error('User not authenticated');

      const updatedProfile = await api.put(`/profile/${user._id}`, updateData);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  const uploadAvatar = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user?._id) throw new Error('User not authenticated');

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/${user._id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const { avatarUrl } = await response.json();
      
      // Update profile with new avatar
      const updatedProfile = await updateProfile({ avatar: avatarUrl });
      return updatedProfile;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, updateProfile]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    profile,
    isLoading,
    error,
    getProfile,
    updateProfile,
    uploadAvatar,
    resetError,
  };
};
// hooks/useTemplates.ts
import { useState, useCallback } from 'react';
import { api } from '@/config/api';
import { Template, TemplateCategory } from '@/types/Template';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Predefined template categories
  const templateCategories: TemplateCategory[] = [
    {
      id: 'worldbuilding',
      name: 'World Building',
      description: 'Templates for creating detailed worlds and settings',
      icon: '🗺️',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'character',
      name: 'Characters',
      description: 'Character profiles and relationship templates',
      icon: '👤',
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'plot',
      name: 'Plot & Story',
      description: 'Story structures and plot development templates',
      icon: '📖',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'location',
      name: 'Locations',
      description: 'Location and setting templates',
      icon: '🏰',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'system',
      name: 'Game Systems',
      description: 'RPG and game system templates',
      icon: '🎲',
      color: 'bg-red-100 text-red-800'
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'User-created templates',
      icon: '⚙️',
      color: 'bg-gray-100 text-gray-800'
    }
  ];

  const getTemplates = useCallback(async (category?: string, search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      
      const queryString = params.toString();
      const url = `/templates${queryString ? `?${queryString}` : ''}`;
      
      const templatesData = await api.get(url);
      setTemplates(templatesData);
      return templatesData;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch templates';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTemplate = useCallback(async (templateId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const template = await api.get(`/templates/${templateId}`);
      return template;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch template';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (templateData: Partial<Template>) => {
    setIsLoading(true);
    setError(null);
    try {
      const template = await api.post('/templates', templateData);
      setTemplates(prev => [template, ...prev]);
      return template;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create template';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (templateId: string, updates: Partial<Template>) => {
    setIsLoading(true);
    setError(null);
    try {
      const template = await api.put(`/templates/${templateId}`, updates);
      setTemplates(prev => prev.map(t => t._id === templateId ? template : t));
      return template;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update template';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/templates/${templateId}`);
      setTemplates(prev => prev.filter(t => t._id !== templateId));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete template';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyTemplate = useCallback(async (templateId: string, boardId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.post(`/templates/${templateId}/apply`, { boardId });
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to apply template';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rateTemplate = useCallback(async (templateId: string, rating: number) => {
    try {
      const result = await api.post(`/templates/${templateId}/rate`, { rating });
      setTemplates(prev => prev.map(t => 
        t._id === templateId ? { ...t, rating: result.newRating } : t
      ));
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to rate template';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    templates,
    categories: templateCategories,
    isLoading,
    error,
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    rateTemplate,
    resetError,
  };
};
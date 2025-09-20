'use client';

import { useState, useEffect } from 'react';

interface AIModel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  inference_speed: 'fast' | 'medium' | 'slow';
  is_available: boolean;
}

export default function ModelSelector({ 
  currentModel, 
  onModelChange,
  conversationId
}: { 
  currentModel: string; 
  onModelChange: (modelId: string) => void;
  conversationId?: string;
}) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock models data - in real app, this would come from API
  useEffect(() => {
    const mockModels: AIModel[] = [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        display_name: 'GPT-4o',
        description: 'OpenAI\'s most advanced model',
        inference_speed: 'fast',
        is_available: true
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        display_name: 'Claude 3.5 Sonnet',
        description: 'Anthropic\'s most intelligent model',
        inference_speed: 'medium',
        is_available: true
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        display_name: 'Gemini Pro',
        description: 'Google\'s advanced multimodal model',
        inference_speed: 'fast',
        is_available: true
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        display_name: 'GPT-4o Mini',
        description: 'Fast and affordable model',
        inference_speed: 'fast',
        is_available: true
      }
    ];
    setModels(mockModels);
  }, []);

  const handleModelChange = async (modelId: string) => {
    setIsLoading(true);
    try {
      // Call the API to switch model on backend
      const response = await fetch(`/api/models/${modelId}/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversationId || 'default-conversation' })
      });

      if (!response.ok) {
        throw new Error(`Failed to switch model: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Model switched successfully:', result);
      
      onModelChange(modelId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch model:', error);
      // Revert the model change on frontend if backend fails
      // Note: Since onModelChange was already called in some implementations, this might need state management adjustment
      alert('Failed to switch model. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentModel = () => {
    return models.find(model => model.id === currentModel) || models[0];
  };

  const getSpeedBadge = (speed: string) => {
    const speedClasses = {
      fast: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      slow: 'bg-red-100 text-red-800'
    };
    return speedClasses[speed as keyof typeof speedClasses] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            Switching...
          </>
        ) : (
          <>
            <span className="text-xs">🤖</span>
            {getCurrentModel()?.display_name || 'Select Model'}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Available Models
            </div>
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelChange(model.id)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start justify-between ${
                  currentModel === model.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                }`}
                disabled={!model.is_available || isLoading}
              >
                <div>
                  <div className="font-medium text-gray-900">{model.display_name}</div>
                  <div className="text-xs text-gray-500 mt-1">{model.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getSpeedBadge(model.inference_speed)}`}>
                    {model.inference_speed}
                  </span>
                  {!model.is_available && (
                    <span className="text-xs text-red-500">Unavailable</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
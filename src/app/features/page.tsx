'use client';

import { useState } from 'react';
import Link from 'next/link';
import ModelSelector from '@/components/ModelSelector';
import SearchBar from '@/components/SearchBar';
import SubscriptionPanel from '@/components/SubscriptionPanel';

export default function FeaturesPage() {
  const [currentModel, setCurrentModel] = useState('gpt-4o-mini');
  const [searchQuery, setSearchQuery] = useState('');

  const handleModelChange = (modelId: string) => {
    setCurrentModel(modelId);
    console.log('Model changed to:', modelId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
  };

  const handleConversationSelect = (conversationId: string) => {
    console.log('Selected conversation:', conversationId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🚀 T3 Chat Features
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <SearchBar 
                onSearch={handleSearch} 
                onConversationSelect={handleConversationSelect} 
              />
              <ModelSelector 
                currentModel={currentModel} 
                onModelChange={handleModelChange} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            T3 Chat: The Next Generation AI Chat Experience
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Experience lightning-fast conversations with instant model switching, 
            powerful search, and seamless local-first architecture.
          </p>
        </div>

        {/* Enterprise Features Link */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white mb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              🏢 Enterprise Features Available
            </h2>
            <p className="text-purple-100 max-w-2xl mx-auto mb-6">
              Unlock advanced collaboration, analytics, team management, and security features 
              with our enterprise dashboard.
            </p>
            <Link 
              href="/enterprise" 
              className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-medium rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="mr-2">🚀</span>
              Access Enterprise Dashboard
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Instant Model Switching */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Instant Model Switching
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Switch between AI models in real-time without losing context. 
              Compare responses and choose the best one for your needs.
            </p>
          </div>

          {/* Conversation Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Smart Conversation Search
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Find any conversation instantly with powerful search across 
              titles, content, and metadata.
            </p>
          </div>

          {/* Local-First Architecture */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Local-First Privacy
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your conversations stay on your device. Sync only what you want 
              to the cloud for backup and cross-device access.
            </p>
          </div>

          {/* Multi-Model Support */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Multi-Model Support
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Access the latest AI models from OpenAI, Anthropic, Google, and more. 
              Each model optimized for different use cases.
            </p>
          </div>

          {/* Real-Time Collaboration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Real-Time Collaboration
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Share conversations and collaborate with others in real-time. 
              Perfect for team brainstorming and knowledge sharing.
            </p>
          </div>

          {/* Advanced Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Usage Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Track your AI usage, model performance, and conversation patterns. 
              Optimize your workflow with detailed insights.
            </p>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Unlock Premium Features
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Go beyond the basics with our premium subscription plans. 
              Get unlimited conversations, advanced models, and priority support.
            </p>
          </div>
          
          <SubscriptionPanel />
        </div>

        {/* Technical Architecture */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              T3 Stack Architecture
            </h2>
            <p className="text-indigo-100 max-w-2xl mx-auto">
              Built with the latest technologies for maximum performance and developer experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl mb-2">⚛️</div>
              <h3 className="font-bold mb-1">Next.js 14</h3>
              <p className="text-sm text-indigo-100">App Router, Server Components</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl mb-2">🟦</div>
              <h3 className="font-bold mb-1">TypeScript</h3>
              <p className="text-sm text-indigo-100">Full type safety</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl mb-2">🔌</div>
              <h3 className="font-bold mb-1">tRPC</h3>
              <p className="text-sm text-indigo-100">End-to-end typesafe APIs</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl mb-2">💾</div>
              <h3 className="font-bold mb-1">Prisma</h3>
              <p className="text-sm text-indigo-100">Type-safe database ORM</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
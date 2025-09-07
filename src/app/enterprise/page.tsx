'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TeamManagement from '@/components/TeamManagement';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import CollaborationPanel from '@/components/CollaborationPanel';
import PermissionManager from '@/components/PermissionManager';
import ExportPanel from '@/components/ExportPanel';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Mock user data - in real app, this would come from auth context
    setUser({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin'
    });
  }, []);

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'collaboration', label: 'Collaboration', icon: '🤝' },
    { id: 'permissions', label: 'Permissions', icon: '🔒' },
    { id: 'export', label: 'Export', icon: '📥' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🏢 Enterprise Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">{user?.name}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">{user?.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Track usage patterns and conversation insights across your organization
                  </p>
                </div>
              </div>
              <AnalyticsDashboard />
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Create and manage teams, add members, and assign roles
                  </p>
                </div>
              </div>
              <TeamManagement />
            </div>
          )}

          {activeTab === 'collaboration' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Collaboration</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Share conversations and collaborate with team members in real-time
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Conversation ID"
                    value={selectedConversation || ''}
                    onChange={(e) => setSelectedConversation(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={() => setSelectedConversation(selectedConversation || '')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
                  >
                    Load
                  </button>
                </div>
              </div>
              
              {selectedConversation ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Conversation Preview
                      </h3>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-64 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">💬</div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Conversation content would appear here
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            ID: {selectedConversation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <CollaborationPanel conversationId={selectedConversation} />
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <div className="text-6xl mb-4">🤝</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a Conversation to Collaborate
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Enter a conversation ID above to start collaborating with your team members in real-time.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Permission Management</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage access controls and permissions for teams and resources
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Team ID"
                    value={selectedTeam || ''}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={() => setSelectedTeam(selectedTeam || '')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
                  >
                    Load
                  </button>
                </div>
              </div>
              
              {selectedTeam ? (
                <PermissionManager teamId={selectedTeam} />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a Team to Manage Permissions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Enter a team ID above to configure permissions and access controls for that team.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export & Reporting</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Export conversations and generate detailed reports
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Conversation ID"
                    value={selectedConversation || ''}
                    onChange={(e) => setSelectedConversation(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={() => setSelectedConversation(selectedConversation || '')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
                  >
                    Load
                  </button>
                </div>
              </div>
              
              {selectedConversation ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Conversation Details
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400">ID</div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {selectedConversation.substring(0, 8)}...
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Messages</div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            24
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Model</div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            GPT-4o
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Tokens</div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            1,247
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <ExportPanel conversationId={selectedConversation} />
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <div className="text-6xl mb-4">📥</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a Conversation to Export
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Enter a conversation ID above to export it in your preferred format.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
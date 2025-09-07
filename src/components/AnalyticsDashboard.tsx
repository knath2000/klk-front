'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface UsageStats {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  period: string;
}

interface ConversationAnalytics {
  id: string;
  conversation_id: string;
  user_id: string;
  message_count: number;
  token_usage: number;
  model_usage: Record<string, number>;
  duration_seconds: number;
  first_message_at: string;
  last_message_at: string;
  avg_response_time?: number;
  created_at: string;
  updated_at: string;
}

interface UserAnalytics {
  id: string;
  user_id: string;
  total_conversations: number;
  total_messages: number;
  total_tokens: number;
  active_days: number;
  favorite_model?: string;
  favorite_persona?: string;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

interface ModelUsageData {
  name: string;
  value: number;
  color: string;
}

interface DailyUsageData {
  date: string;
  conversations: number;
  messages: number;
  tokens: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [modelUsage, setModelUsage] = useState<ModelUsageData[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageData[]>([]);
  const [topConversations, setTopConversations] = useState<ConversationAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch user usage stats
        const usageResponse = await fetch(`/api/analytics/user/usage?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsageStats(usageData);
        }

        // Fetch user analytics
        const userResponse = await fetch('/api/analytics/user', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserAnalytics(userData);
        }

        // Fetch conversation insights
        const insightsResponse = await fetch(`/api/analytics/insights/conversations?limit=10`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          setTopConversations(insightsData.topConversations || []);
          
          // Process model usage data
          const modelData: ModelUsageData[] = Object.entries(insightsData.modelUsage || {}).map(([name, value]) => ({
            name,
            value: value as number,
            color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)]
          }));
          setModelUsage(modelData);
        }

        // Generate mock daily usage data for demonstration
        const mockDailyData: DailyUsageData[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockDailyData.push({
            date: date.toISOString().split('T')[0],
            conversations: Math.floor(Math.random() * 50) + 10,
            messages: Math.floor(Math.random() * 200) + 50,
            tokens: Math.floor(Math.random() * 10000) + 2000
          });
        }
        setDailyUsage(mockDailyData);

      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your usage patterns and conversation insights
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-800 dark:text-red-200">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span className="text-2xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {usageStats?.totalConversations ? formatNumber(usageStats.totalConversations) : '0'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {usageStats?.totalMessages ? formatNumber(usageStats.totalMessages) : '0'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <span className="text-2xl">🔢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tokens Used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {usageStats?.totalTokens ? formatNumber(usageStats.totalTokens) : '0'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Days</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userAnalytics?.active_days || '0'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid - Simplified with text-based representation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Usage - Text representation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Usage Trend</h3>
          <div className="space-y-3">
            {dailyUsage.slice(0, 5).map((day) => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{day.date}</span>
                <div className="flex-1 mx-4">
                  <div className="flex items-center">
                    <div 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (day.conversations / 50) * 100)}%` }}
                    ></div>
                    <span className="ml-2 text-xs text-gray-500">{day.conversations} conv</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <div 
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${Math.min(100, (day.messages / 200) * 100)}%` }}
                    ></div>
                    <span className="ml-2 text-xs text-gray-500">{day.messages} msgs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Model Usage - Pie chart representation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Model Usage Distribution</h3>
          <div className="space-y-3">
            {modelUsage.map((model) => (
              <div key={model.name} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{model.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Model</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{model.value}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">requests</div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(model.value / Math.max(...modelUsage.map(m => m.value))) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Conversations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Conversations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Conversation ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {topConversations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No conversations found
                  </td>
                </tr>
              ) : (
                topConversations.map((conversation) => (
                  <tr key={conversation.conversation_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {conversation.conversation_id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {conversation.message_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatNumber(conversation.token_usage || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {conversation.model_usage ? Object.keys(conversation.model_usage)[0] : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {Math.floor((conversation.duration_seconds || 0) / 60)}m {(conversation.duration_seconds || 0) % 60}s
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
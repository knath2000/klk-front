'use client';

import { useState, useEffect, useRef } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
// Keep backward-compatible `motion` name for existing JSX while we migrate incrementally
const motion = m;
import type { Socket } from 'socket.io-client';

interface UserJoinedEvent {
  userId: string;
  timestamp: string;
}

interface UserLeftEvent {
  userId: string;
  timestamp: string;
}

interface UserTypingEvent {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: string;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  isTyping: boolean;
  lastActive: string;
}

interface SharedUser {
  id: string;
  user_id: string;
  permission: string;
  shared_at: string;
  user?: {
    name: string;
    email: string;
  };
}

const CollaborationPanel: React.FC<{ conversationId: string }> = ({ conversationId }) => {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [newShareEmail, setNewShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'read' | 'write' | 'admin'>('read');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initializes WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      try {
        // Lazy-load socket.io-client only when the panel mounts
        const { io } = await import('socket.io-client');
        socketRef.current = io(backendUrl, {
          withCredentials: true,
          transports: ['websocket', 'polling']
        });

        socketRef.current.emit('authenticate', localStorage.getItem('user_id'));

        // Join conversation room
        socketRef.current.emit('join_conversation', {
          conversationId,
          userId: localStorage.getItem('user_id')
        });

        // Listen for collaborator updates
        socketRef.current.on('user_joined', (data: UserJoinedEvent) => {
          // Handle user joined
          console.log('User joined:', data);
        });

        socketRef.current.on('user_left', (data: UserLeftEvent) => {
          // Handle user left
          console.log('User left:', data);
        });

        socketRef.current.on('user_typing', (data: UserTypingEvent) => {
          // Handle typing indicator
          console.log('User typing:', data);
        });
      } catch (err) {
        console.error('Failed to initialize collaboration socket:', err);
      }

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leave_conversation', {
            conversationId,
            userId: localStorage.getItem('user_id')
          });
          socketRef.current.disconnect();
        }
      };
    };

    // Fire-and-forget async initializer; cleanup is returned from initializeWebSocket when it resolves,
    // but React expects a sync cleanup function — we attach cleanup via a mounted flag.
    let cleanupFn: (() => void) | null = null;
    (async () => {
      const maybeCleanup = await initializeWebSocket();
      if (typeof maybeCleanup === 'function') cleanupFn = maybeCleanup;
    })();

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [conversationId]);

  // Fetch shared users
  useEffect(() => {
    const fetchSharedUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/collaboration/conversations/${conversationId}/shared`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSharedUsers(data);
        } else {
          throw new Error('Failed to fetch shared users');
        }
      } catch (err) {
        setError('Failed to load shared users');
        console.error('Error fetching shared users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedUsers();
  }, [conversationId]);

  const handleShareConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newShareEmail) {
      setError('Please enter an email address');
      return;
    }

    try {
      setIsSharing(true);
      setError(null);

      const response = await fetch(`/api/collaboration/conversations/${conversationId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          shared_with_id: newShareEmail, // In a real app, this would be a user ID lookup
          permission: sharePermission
        })
      });

      if (response.ok) {
        const newShare = await response.json();
        setSharedUsers([...sharedUsers, newShare]);
        setNewShareEmail('');
        
        // Notify via WebSocket if connected
        if (socketRef.current) {
          socketRef.current.emit('conversation_shared', {
            conversationId,
            sharedWith: newShareEmail,
            permission: sharePermission
          });
        }
      } else {
        throw new Error('Failed to share conversation');
      }
    } catch (err) {
      setError('Failed to share conversation. Please try again.');
      console.error('Error sharing conversation:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (sharedUserId: string) => {
    try {
      const response = await fetch(`/api/collaboration/conversations/${conversationId}/shared/${sharedUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        setSharedUsers(sharedUsers.filter(share => share.user_id !== sharedUserId));
        
        // Notify via WebSocket if connected
        if (socketRef.current) {
          socketRef.current.emit('conversation_unshared', {
            conversationId,
            unsharedWith: sharedUserId
          });
        }
      } else {
        throw new Error('Failed to remove share');
      }
    } catch (err) {
      setError('Failed to remove share. Please try again.');
      console.error('Error removing share:', err);
    }
  };

  const handleUpdatePermission = async (sharedUserId: string, permission: 'read' | 'write' | 'admin') => {
    try {
      const response = await fetch(`/api/collaboration/conversations/${conversationId}/shared/${sharedUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ permission })
      });

      if (response.ok) {
        const updatedShare = await response.json();
        setSharedUsers(sharedUsers.map(share => 
          share.user_id === sharedUserId ? updatedShare : share
        ));
      } else {
        throw new Error('Failed to update permission');
      }
    } catch (err) {
      setError('Failed to update permission. Please try again.');
      console.error('Error updating permission:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Collaboration</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Share Form */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Share this conversation</h4>
        <form onSubmit={handleShareConversation} className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="email"
              value={newShareEmail}
              onChange={(e) => setNewShareEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              disabled={isSharing}
            />
            <select
              value={sharePermission}
              onChange={(e) => setSharePermission(e.target.value as 'read' | 'write' | 'admin')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              disabled={isSharing}
            >
              <option value="read">Read Only</option>
              <option value="write">Can Edit</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSharing || !newShareEmail}
            className={`px-4 py-2 text-sm rounded-md text-white transition-colors ${
              isSharing || !newShareEmail
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isSharing ? 'Sharing...' : 'Share'}
          </button>
        </form>
      </div>

      {/* Shared Users List */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Shared with</h4>
        {sharedUsers.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p>This conversation is not shared with anyone yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sharedUsers.map((share) => (
              <motion.div
                key={share.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {share.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {share.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {share.user?.email || share.user_id}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <select
                    value={share.permission}
                    onChange={(e) => handleUpdatePermission(share.user_id, e.target.value as 'read' | 'write' | 'admin')}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  <button
                    onClick={() => handleRemoveShare(share.user_id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Indicators */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Active Collaborators</h4>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            You are currently collaborating on this conversation
          </span>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;
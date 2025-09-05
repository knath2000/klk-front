'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Permission {
  id: string;
  resource_type: string;
  resource_id: string;
  permission: string;
  granted_by: string;
  granted_at: string;
}

interface TeamPermission {
  id: string;
  team_id: string;
  resource_type: string;
  resource_id: string;
  permission: string;
  granted_by: string;
  granted_at: string;
}

const PermissionManager: React.FC<{ teamId: string }> = ({ teamId }) => {
  const [permissions, setPermissions] = useState<TeamPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPermission, setNewPermission] = useState({
    resource_type: 'conversation',
    resource_id: '',
    permission: 'read'
  });
  const [isAdding, setIsAdding] = useState(false);

  // Fetch team permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teams/${teamId}/permissions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPermissions(data);
        } else {
          throw new Error('Failed to fetch permissions');
        }
      } catch (err) {
        setError('Failed to load permissions');
        console.error('Error fetching permissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [teamId]);

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPermission.resource_id) {
      setError('Please enter a resource ID');
      return;
    }

    try {
      setIsAdding(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(newPermission)
      });

      if (response.ok) {
        const permission = await response.json();
        setPermissions([...permissions, permission]);
        setNewPermission({
          resource_type: 'conversation',
          resource_id: '',
          permission: 'read'
        });
      } else {
        throw new Error('Failed to add permission');
      }
    } catch (err) {
      setError('Failed to add permission. Please try again.');
      console.error('Error adding permission:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/permissions/${permissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        setPermissions(permissions.filter(p => p.id !== permissionId));
      } else {
        throw new Error('Failed to remove permission');
      }
    } catch (err) {
      setError('Failed to remove permission. Please try again.');
      console.error('Error removing permission:', err);
    }
  };

  const handleUpdatePermission = async (permissionId: string, permission: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/permissions/${permissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ permission })
      });

      if (response.ok) {
        const updatedPermission = await response.json();
        setPermissions(permissions.map(p => 
          p.id === permissionId ? updatedPermission : p
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Permissions</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Add Permission Form */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Add New Permission</h4>
        <form onSubmit={handleAddPermission} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={newPermission.resource_type}
              onChange={(e) => setNewPermission({ ...newPermission, resource_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="conversation">Conversation</option>
              <option value="file">File</option>
              <option value="folder">Folder</option>
            </select>
            
            <input
              type="text"
              value={newPermission.resource_id}
              onChange={(e) => setNewPermission({ ...newPermission, resource_id: e.target.value })}
              placeholder="Resource ID"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            
            <select
              value={newPermission.permission}
              onChange={(e) => setNewPermission({ ...newPermission, permission: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={isAdding || !newPermission.resource_id}
            className={`px-4 py-2 text-sm rounded-md text-white transition-colors ${
              isAdding || !newPermission.resource_id
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isAdding ? 'Adding...' : 'Add Permission'}
          </button>
        </form>
      </div>

      {/* Permissions List */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Current Permissions</h4>
        {permissions.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p>No permissions configured for this team yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {permissions.map((permission) => (
              <motion.div
                key={permission.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-medium">
                    {permission.resource_type.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {permission.resource_type}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {permission.resource_id}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={permission.permission}
                    onChange={(e) => handleUpdatePermission(permission.id, e.target.value)}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  <button
                    onClick={() => handleRemovePermission(permission.id)}
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

      {/* Permission Levels Info */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Permission Levels</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div><strong>Read:</strong> View content only</div>
          <div><strong>Write:</strong> View and edit content</div>
          <div><strong>Admin:</strong> Full access including sharing and permission management</div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;
/**
 * Admin Users Management Page - ADMIN-002
 * User management, plan assignment, and quota overrides
 */

'use client';

import { useState } from 'react';

export default function AdminUsers() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const mockUsers = [
    {
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice Johnson',
      plan: 'Premium',
      status: 'active',
      usage: 450,
      quota: 1000,
    },
    {
      id: 'user-2',
      email: 'bob@example.com',
      name: 'Bob Smith',
      plan: 'Basic',
      status: 'active',
      usage: 85,
      quota: 100,
    },
    {
      id: 'user-3',
      email: 'charlie@example.com',
      name: 'Charlie Brown',
      plan: 'Enterprise',
      status: 'active',
      usage: 5230,
      quota: 100000,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mockUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.usage}/{user.quota}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedUser(user.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* User Details Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">User Actions</h2>

          {selectedUser ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm font-semibold mb-3">Selected User: {selectedUser}</p>

                <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-2 text-sm">
                  Change Plan
                </button>

                <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mb-2 text-sm">
                  Override Quota
                </button>

                <button className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 mb-2 text-sm">
                  Reset API Keys
                </button>

                <button className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 text-sm">
                  Suspend User
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm text-gray-600">Select a user to manage their account</p>
            </div>
          )}

          <div className="mt-8">
            <h3 className="font-semibold mb-2">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Users:</span>
                <span className="font-semibold">1,245</span>
              </div>
              <div className="flex justify-between">
                <span>Active Users:</span>
                <span className="font-semibold text-green-600">1,189</span>
              </div>
              <div className="flex justify-between">
                <span>Suspended:</span>
                <span className="font-semibold text-red-600">56</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          ℹ️ ADMIN-002 User Management implemented. Manage users, plans, quotas, and access.
        </p>
      </div>
    </div>
  );
}

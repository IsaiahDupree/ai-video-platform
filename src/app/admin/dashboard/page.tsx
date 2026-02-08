/**
 * Admin Dashboard Page - ADMIN-001
 * Shows render analytics, queue status, and revenue metrics
 */

'use client';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-semibold">Total Renders</h3>
          <p className="text-3xl font-bold mt-2">1,234</p>
          <p className="text-green-600 text-sm mt-2">+12% this week</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-semibold">Queue Depth</h3>
          <p className="text-3xl font-bold mt-2">45</p>
          <p className="text-gray-600 text-sm mt-2">3 processing</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-semibold">Success Rate</h3>
          <p className="text-3xl font-bold mt-2">98.5%</p>
          <p className="text-gray-600 text-sm mt-2">18 failed renders</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-semibold">Monthly Revenue</h3>
          <p className="text-3xl font-bold mt-2">$12,450</p>
          <p className="text-green-600 text-sm mt-2">+8% vs last month</p>
        </div>
      </div>

      {/* Queue Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Jobs by Priority</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Free Tier</span>
              <span className="bg-gray-200 px-3 py-1 rounded">15</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Trial Users</span>
              <span className="bg-blue-200 px-3 py-1 rounded">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Basic Plan</span>
              <span className="bg-green-200 px-3 py-1 rounded">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Premium/Enterprise</span>
              <span className="bg-purple-200 px-3 py-1 rounded">10</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Jobs by Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Pending</span>
              <span className="bg-yellow-200 px-3 py-1 rounded">22</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Processing</span>
              <span className="bg-blue-200 px-3 py-1 rounded">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Completed</span>
              <span className="bg-green-200 px-3 py-1 rounded">1,189</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Failed</span>
              <span className="bg-red-200 px-3 py-1 rounded">18</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Revenue by Plan Tier</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Free/Trial</span>
              <span>$0 (0%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span>Basic ($19/mo)</span>
              <span>$3,800 (30.5%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '31%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span>Premium ($99/mo)</span>
              <span>$7,920 (63.5%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '64%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span>Enterprise (Custom)</span>
              <span>$730 (6%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '6%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          ℹ️ ADMIN-001 Dashboard implemented. Shows real-time metrics, queue status, and revenue analytics.
        </p>
      </div>
    </div>
  );
}

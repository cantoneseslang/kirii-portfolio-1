import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getMonthlyUsageData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, department, position, is_admin')
      .order('full_name')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return []
    }

    if (!profiles) return []

    // Get current month's data
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59)

    const { data: loginHistory, error: historyError } = await supabase
      .from('login_history')
      .select('user_id, login_timestamp, login_success')
      .gte('login_timestamp', startOfMonth.toISOString())
      .lte('login_timestamp', endOfMonth.toISOString())
      .eq('login_success', true)

    if (historyError) {
      console.error('Error fetching login history:', historyError)
      return []
    }

    // Process data
    const userStats = profiles.map(profile => {
      const userLogins = loginHistory?.filter(h => h.user_id === profile.id) || []
      const loginCount = userLogins.length
      const lastLogin = userLogins.length > 0 
        ? new Date(Math.max(...userLogins.map(l => new Date(l.login_timestamp).getTime())))
        : null

      // Determine status
      let status = 'Unused'
      let statusColor = 'text-red-600 bg-red-100'
      
      if (loginCount > 0) {
        const daysSinceLastLogin = lastLogin 
          ? Math.floor((currentDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
          : 0
        
        if (daysSinceLastLogin <= 7) {
          status = 'Active'
          statusColor = 'text-green-600 bg-green-100'
        } else {
          status = 'Inactive'
          statusColor = 'text-yellow-600 bg-yellow-100'
        }
      }

      return {
        ...profile,
        loginCount,
        lastLogin,
        status,
        statusColor
      }
    })

    return userStats
  } catch (error) {
    console.error('Error in getMonthlyUsageData:', error)
    return []
  }
}

// Convert UTC time from database to Hong Kong time (UTC+8)
function formatHongKongTime(date: Date | null): string {
  if (!date) return 'Not logged in'
  
  // Convert UTC time to Hong Kong time (UTC+8)
  const hongKongTime = new Date(date.getTime() + (8 * 60 * 60 * 1000))
  
  return hongKongTime.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

export default async function AdminPage() {
  const userStats = await getMonthlyUsageData()
  
  const totalUsers = userStats.length
  const activeUsers = userStats.filter(u => u.status === 'Active').length
  const inactiveUsers = userStats.filter(u => u.status === 'Inactive').length
  const unusedUsers = userStats.filter(u => u.status === 'Unused').length

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard - Monthly Usage Report</h1>
      
      {/* Real-time Update Mode Indicator */}
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <strong>Real-time Update Mode</strong>
        </div>
        <div className="mt-2">
          <p>Current Month: {currentYear}-{currentMonth.toString().padStart(2, '0')}</p>
          <p>Users Retrieved: {totalUsers}</p>
          <p className="text-sm mt-1">※Reload the page to display the latest data</p>
          <p className="text-sm mt-1">※All times are converted to Hong Kong Time (UTC+8)</p>
        </div>
      </div>

      {/* Monthly Usage Report Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Usage Report ({currentYear}-{currentMonth.toString().padStart(2, '0')})</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-sm">Total Users</div>
          </div>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <div className="text-2xl font-bold">{activeUsers}</div>
            <div className="text-sm">Active Users</div>
          </div>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <div className="text-2xl font-bold">{inactiveUsers}</div>
            <div className="text-sm">Inactive Users</div>
          </div>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="text-2xl font-bold">{unusedUsers}</div>
            <div className="text-sm">Unused Users</div>
          </div>
        </div>
      </div>

      {/* User Details Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">User Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login (HK Time)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userStats.map((user) => (
                <tr key={user.id} className={user.status === 'Inactive' ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.loginCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatHongKongTime(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.statusColor}`}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mt-8">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">Permission Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">All Employees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchasing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factory</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department (raw)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userStats.map((user) => {
                const dept = (user.department || '') as string
                const has = (key: string) => dept.includes(key)
                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.is_admin ? '✓' : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{has('All Employees') ? '✓' : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{has('Sales') ? '✓' : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{has('Purchasing') ? '✓' : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{has('Factory') ? '✓' : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

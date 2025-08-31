import { useState, useEffect } from 'react'
import axios from 'axios'
import { Eye, EyeOff, LogOut, Shield, Users, Mail, Award, AlertCircle } from 'lucide-react';


interface LoginResponse {
  role: string
  token: string
  email: string
  userId: number
}

interface User {
  id: number
  email: string
  role: string
  foulConunt: number
  marit: number
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  // Fetch users if token exists
  useEffect(() => {
    if (token) {
      axios
        .get<User[]>('http://localhost:8080/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setUsers(res.data))
        .catch(err => setError('Failed to fetch users'))
    }
  }, [token])

   const handleLogin = async () => {
    try {
      const res = await axios.post<LoginResponse>(
        'http://localhost:8080/login',
        { email, password }
      )
      if (res.data.role === 'admin') {
        setToken(res.data.token)
        localStorage.setItem('token', res.data.token)
      } else {
        setError('Unauthorized role')
      }
      } catch (err: any) {
    console.error('Login error:', err)

    // If it's an Axios error, you can get more details
    if (axios.isAxiosError(err)) {
      console.error('Response data:', err.response?.data)
      console.error('Status code:', err.response?.status)
      console.error('Headers:', err.response?.headers)
    }

    setError('Login failed')
  }
  }


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Moderator': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMeritColor = (marit: number) => {
    switch (true) {
      case marit > 100:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case marit > 5:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }


  const getFoulStatus = (count : number) => {
    if (count === 0) return { color: 'text-green-600', bg: 'bg-green-50' };
    if (count <= 2) return { color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { color: 'text-red-600', bg: 'bg-red-50' };
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
            <p className="text-gray-600">Sign in to manage your dashboard</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                    onKeyPress={e => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                onClick={() => { setToken(null); localStorage.removeItem('token'); }}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-indigo-600 font-medium mb-1">Demo Credentials:</p>
              <p className="text-xs text-indigo-500">admin@example.com / password</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Users Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                <p className="text-xs text-gray-500">{users.length} total users</p>
              </div>
            </div>
            <button
        onClick={() => { setToken(null); localStorage.removeItem('token'); }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'Admin').length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Gold Members</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.marit > 100).length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Clean Records</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.foulConunt === 0).length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900">Users Directory</h2>
            <p className="text-gray-600 text-sm mt-1">Manage and monitor user accounts</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Violations
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Merit Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {users.map((user, index) => {
                  const foulStatus = getFoulStatus(user.foulConunt);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                            <div className="text-xs text-gray-500">Member #{String(index + 1).padStart(3, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${foulStatus.bg} ${foulStatus.color}`}>
                          {user.foulConunt === 0 ? (
                            <span>Clean Record</span>
                          ) : (
                            <span>{user.foulConunt} violation{user.foulConunt > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getMeritColor(user.marit)}`}>
                          <Award className="w-3 h-3 mr-1" />
                          {user.marit}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App

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
const [userImages, setUserImages] = useState<string[]>([]);
const [showImagesDropdown, setShowImagesDropdown] = useState(false);

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

const handleViewUser = async (userId: number) => {
  if (!token) return;

  try {
    const res = await axios.get(`http://localhost:8080/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Assuming res.data is an array of image objects
    const imagesBase64 = res.data.map((imgObj: any) => `data:image/png;base64,${imgObj.image}`);
    setUserImages(imagesBase64);
    setShowImagesDropdown(true);
  } catch (err: any) {
    console.error('Error fetching user:', err);
    setError('Failed to fetch user images');
  }
}

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
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

      if (axios.isAxiosError(err)) {
        console.error('Response data:', err.response?.data)
        console.error('Status code:', err.response?.status)
        console.error('Headers:', err.response?.headers)
      }

      setError('Login failed')
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setEmail('');
    setPassword('');
    setError('');
  }

  const getMeritLabel = (marit: number) => {
    if (marit > 100) return 'Gold';
    if (marit > 5) return 'Silver';
    return 'Bronze';
  }

  const getMeritStyles = (marit: number) => {
    if (marit > 100) {
      return { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' };
    } else if (marit > 5) {
      return { background: '#fed7aa', color: '#9a3412', borderColor: '#fdba74' };
    } else {
      return { background: '#f3f4f6', color: '#1f2937', borderColor: '#e5e7eb' };
    }
  }

  const getRoleStyles = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return { background: '#f3e8ff', color: '#6b21a8', borderColor: '#ddd6fe' };
      case 'moderator':
        return { background: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' };
      default:
        return { background: '#f3f4f6', color: '#1f2937', borderColor: '#e5e7eb' };
    }
  };

  const getFoulStyles = (count: number) => {
    if (count === 0) return { color: '#16a34a', background: '#f0fdf4' };
    if (count <= 2) return { color: '#ca8a04', background: '#fffbeb' };
    return { color: '#dc2626', background: '#fef2f2' };
  };

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 50%, #f0fdff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minWidth:'100vh'
      }}>
        <div style={{ width: '100%', maxWidth: '28rem' }}>
          {/* Logo/Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              borderRadius: '1rem',
              marginBottom: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <Shield size={32} color="white" />
            </div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '0.5rem',
              margin: '0 0 0.5rem 0'
            }}>Admin Portal</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Sign in to manage your dashboard</p>
          </div>

          {/* Login Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {error && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertCircle size={20} color="#ef4444" />
                <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Email Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail 
                    size={20} 
                    color="#9ca3af"
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      paddingLeft: '2.75rem',
                      paddingRight: '1rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem',
                      background: '#f9fafb',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => {
                      e.target.style.background = 'white';
                      e.target.style.borderColor = '#6366f1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.background = '#f9fafb';
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading}
                    onKeyPress={e => e.key === 'Enter' && handleLogin()}
                    style={{
                      width: '100%',
                      paddingLeft: '1rem',
                      paddingRight: '2.75rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem',
                      background: '#f9fafb',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => {
                      e.target.style.background = 'white';
                      e.target.style.borderColor = '#6366f1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.background = '#f9fafb';
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.25rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#6b7280'}
                    onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: isLoading ? '#6b7280' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.875rem',
                  opacity: isLoading ? 0.7 : 1
                }}
                onMouseEnter={e => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #4338ca, #6d28d9)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Users Dashboard
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 50%, #e0e7ff 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                borderRadius: '0.75rem'
              }}>
                <Users size={20} color="white" />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: 0
                }}>User Management</h1>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0
                }}>{users.length} total users</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.875rem'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#dc2626';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {error && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <AlertCircle size={20} color="#ef4444" />
            <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>Total Users</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{users.length}</p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: '#dbeafe',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={24} color="#2563eb" />
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>Admins</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {users.filter(u => u.role.toLowerCase() === 'admin').length}
                </p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: '#ede9fe',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={24} color="#7c3aed" />
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>Gold Members</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {users.filter(u => u.marit > 100).length}
                </p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: '#fef3c7',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={24} color="#d97706" />
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>Clean Records</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {users.filter(u => u.foulConunt === 0).length}
                </p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: '#dcfce7',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={24} color="#16a34a" />
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(229, 231, 235, 0.5)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.25rem 0'
            }}>Users Directory</h2>
            <p style={{
              color: '#6b7280',
              fontSize: '0.875rem',
              margin: 0
            }}>Manage and monitor user accounts</p>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(249, 250, 251, 0.5)' }}>
                  <th style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    User ID
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Email Address
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Role
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Violations
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Merit Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const foulStyles = getFoulStyles(user.foulConunt);
                  const meritStyles = getMeritStyles(user.marit);
                  const roleStyles = getRoleStyles(user.role);
                  
                  return (
                    <tr 
                      key={user.id} 
                      style={{
                        borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(249, 250, 251, 0.5)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            width: '2rem',
                            height: '2rem',
                            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {user.id}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            background: 'linear-gradient(135deg, #60a5fa, #4f46e5)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{
                              color: 'white',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}>
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: '#111827'
                            }}>{user.email}</div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>Member #{String(index + 1).padStart(3, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          border: '1px solid',
                          ...roleStyles
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          ...foulStyles
                        }}>
                          {user.foulConunt === 0 ? (
                            <span>Clean Record</span>
                          ) : (
                            <span>{user.foulConunt} violation{user.foulConunt > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          border: '1px solid',
                          ...meritStyles
                        }}>
                          <Award size={12} style={{ marginRight: '0.25rem' }} />
                          {getMeritLabel(user.marit)} ({user.marit})
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleViewUser(user.id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #4338ca, #6d28d9)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)'}
                      >
                        View
                      </button>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {showImagesDropdown && userImages.length > 0 && (
  <div style={{
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(8px)',
    borderRadius: '1rem',
    border: '1px solid rgba(0,0,0,0.1)',
  }}>
    <h3 style={{ marginBottom: '0.5rem' }}>User Images</h3>
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      gap: '1rem',
      paddingBottom: '0.5rem'
    }}>
      {userImages.map((src, idx) => (
        <img 
          key={idx}
          src={src} 
          alt={`user-${idx}`} 
          style={{
            height: '120px',
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db'
          }}
        />
      ))}
    </div>
    <button
      onClick={() => setShowImagesDropdown(false)}
      style={{
        marginTop: '0.5rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '0.5rem',
        background: '#ef4444',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.75rem'
      }}
    >
      Close
    </button>
  </div>
)}

        </div>

        {/* Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0
          }}>
            Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App
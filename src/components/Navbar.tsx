import  { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Map, User, Users, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Map className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">Student Transport</span>
            </Link>
          </div>

          {currentUser && (
            <div className="hidden md:flex space-x-4">
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md text-sm font-medium border-b-2 ${
                    isActive ? 'route-active' : 'border-transparent hover:text-gray-900'
                  }`
                }
              >
                Dashboard
              </NavLink>
              
              {userProfile?.role === 'admin' && (
                <>
                  <NavLink 
                    to="/student-registration" 
                    className={({ isActive }) => 
                      `px-3 py-2 rounded-md text-sm font-medium border-b-2 ${
                        isActive ? 'route-active' : 'border-transparent hover:text-gray-900'
                      }`
                    }
                  >
                    Add Students
                  </NavLink>
                  <NavLink 
                    to="/driver-registration" 
                    className={({ isActive }) => 
                      `px-3 py-2 rounded-md text-sm font-medium border-b-2 ${
                        isActive ? 'route-active' : 'border-transparent hover:text-gray-900'
                      }`
                    }
                  >
                    Add Drivers
                  </NavLink>
                  <NavLink 
                    to="/manage-trips" 
                    className={({ isActive }) => 
                      `px-3 py-2 rounded-md text-sm font-medium border-b-2 ${
                        isActive ? 'route-active' : 'border-transparent hover:text-gray-900'
                      }`
                    }
                  >
                    Manage Trips
                  </NavLink>
                </>
              )}
            </div>
          )}

          <div className="hidden md:flex items-center">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium">
                  <span className="text-gray-500">Logged in as </span>
                  <span className="text-indigo-600 capitalize">{userProfile?.role}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center text-gray-600 hover:text-indigo-600"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-indigo-600">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMenu}
              className="text-gray-600 hover:text-indigo-600 focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white p-4 border-t">
          <div className="flex flex-col space-y-3">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </NavLink>
            
            {userProfile?.role === 'admin' && (
              <>
                <NavLink 
                  to="/student-registration" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  Add Students
                </NavLink>
                <NavLink 
                  to="/driver-registration" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  Add Drivers
                </NavLink>
                <NavLink 
                  to="/manage-trips" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  Manage Trips
                </NavLink>
              </>
            )}
            
            {currentUser ? (
              <button 
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            ) : (
              <div className="space-y-2 pt-2 border-t">
                <Link 
                  to="/login" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-3 py-2 rounded-md text-base font-medium bg-indigo-600 text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
 
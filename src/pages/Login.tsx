import  { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, LogIn, AlertCircle, Briefcase, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'admin' | 'client' | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      setLoading(true);
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!loginType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Student Transport Tracker</h2>
            <p className="text-lg text-gray-600">Select your account type to continue</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div 
              onClick={() => setLoginType('admin')}
              className="bg-white overflow-hidden rounded-lg shadow-lg transition-transform transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-indigo-500"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  className="w-full h-full object-cover" 
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxzdHVkZW50JTIwdHJhbnNwb3J0JTIwdHJhY2tlciUyMGxvZ2lufGVufDB8fHx8MTc0MjkxNzY0OHww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800"
                  alt="Administrator login"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center mb-3">
                  <Briefcase className="h-8 w-8 text-indigo-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">Administrator</h3>
                </div>
                <p className="text-center text-gray-600 mb-4">
                  School administrators, manage your transportation system
                </p>
                <button className="w-full btn btn-primary">
                  Login as Administrator
                </button>
              </div>
            </div>
            
            <div 
              onClick={() => setLoginType('client')}
              className="bg-white overflow-hidden rounded-lg shadow-lg transition-transform transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-indigo-500"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  className="w-full h-full object-cover" 
                  src="https://images.unsplash.com/photo-1503676382389-4809596d5290?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxzdHVkZW50JTIwdHJhbnNwb3J0JTIwdHJhY2tlciUyMGxvZ2lufGVufDB8fHx8MTc0MjkxNzY0OHww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800"
                  alt="Student login"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center mb-3">
                  <GraduationCap className="h-8 w-8 text-indigo-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">Students & Drivers</h3>
                </div>
                <p className="text-center text-gray-600 mb-4">
                  Students and drivers, track your transportation
                </p>
                <button className="w-full btn btn-primary">
                  Login as Student/Driver
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center">
            {loginType === 'admin' ? (
              <Briefcase className="h-10 w-10 text-indigo-600" />
            ) : (
              <GraduationCap className="h-10 w-10 text-indigo-600" />
            )}
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            {loginType === 'admin' ? 'Administrator Login' : 'Student/Driver Login'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <button 
              onClick={() => setLoginType(null)} 
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              go back to selection
            </button>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Email address"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`input-field pl-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Password"
                  {...register('password', { required: 'Password is required' })}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center btn btn-primary py-2 px-4"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign in
                </span>
              )}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Create a new account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
 
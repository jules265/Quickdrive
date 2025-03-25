import  { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Welcome to Student Transport Tracker</h1>
        
        <div className="bg-indigo-50 p-4 rounded-md mb-6 border border-indigo-100">
          <p className="text-indigo-700">
            You are logged in as <span className="font-bold capitalize">{userProfile?.role}</span>
          </p>
        </div>
        
        <p className="mb-4">
          Please use the navigation menu to access the features available for your account type.
        </p>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">System Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="font-medium text-gray-500 mb-1">Students</div>
              <div className="text-2xl font-bold">124</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="font-medium text-gray-500 mb-1">Drivers</div>
              <div className="text-2xl font-bold">18</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="font-medium text-gray-500 mb-1">Active Trips</div>
              <div className="text-2xl font-bold">5</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 
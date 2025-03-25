import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Driver, Trip, Notification } from '../types';
import { Users, Truck, Calendar, User, MapPin, BellRing, Check, X, Phone } from 'lucide-react';
import Map from '../components/Map';

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch students
        const studentQuery = query(collection(db, 'students'));
        const studentSnapshot = await getDocs(studentQuery);
        const studentsList = studentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Student));
        setStudents(studentsList);

        // Fetch drivers
        const driverQuery = query(collection(db, 'drivers'));
        const driverSnapshot = await getDocs(driverQuery);
        const driversList = driverSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Driver));
        setDrivers(driversList);

        // Set up real-time listener for trips
        const tripQuery = query(collection(db, 'trips'));
        const tripUnsubscribe = onSnapshot(tripQuery, (snapshot) => {
          const tripsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Trip));
          
          setTrips(tripsList);
          setActiveTrips(tripsList.filter(trip => trip.status === 'in-progress'));
        });

        // Set up real-time listener for notifications
        const notificationQuery = query(collection(db, 'notifications'));
        const notificationUnsubscribe = onSnapshot(notificationQuery, (snapshot) => {
          const notificationList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Notification));
          
          // Sort notifications by timestamp (newest first)
          notificationList.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          setNotifications(notificationList);
          setUnreadCount(notificationList.filter(notif => !notif.read).length);
        });

        setLoading(false);
        return () => {
          tripUnsubscribe();
          notificationUnsubscribe();
        };
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      // Get all unread notifications
      const unreadNotifications = notifications.filter(notif => !notif.read);
      
      // Update each notification
      const updatePromises = unreadNotifications.map(notif => 
        updateDoc(doc(db, 'notifications', notif.id), {
          read: true
        })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Prepare map markers from active trips
  const mapMarkers = activeTrips.map(trip => ({
    id: trip.id,
    position: trip.currentLocation || { lat: 40.7128, lng: -74.0060 },
    title: `${trip.driverName} (${trip.plateNumber})`,
    info: `Destination: ${trip.destination} | Students: ${trip.students.length}`
  }));

  // Get notification content based on type
  const getNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'student-arrived':
        return (
          <div>
            <p className="font-medium">Student Arrived</p>
            <p className="text-sm">
              {notification.studentName} has arrived at {notification.destination}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Driver: {notification.driverName}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(notification.timestamp).toLocaleString()}
            </p>
          </div>
        );
      case 'trip-started':
        return (
          <div>
            <p className="font-medium">Trip Started</p>
            <p className="text-sm">
              Trip to {notification.destination} has started
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Driver: {notification.driverName} ({notification.plateNumber})
            </p>
            <p className="text-xs text-gray-500">
              {new Date(notification.timestamp).toLocaleString()}
            </p>
          </div>
        );
      case 'trip-completed':
        return (
          <div>
            <p className="font-medium">Trip Completed</p>
            <p className="text-sm">
              Trip to {notification.destination} has been completed
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Driver: {notification.driverName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Students arrived: {notification.arrivedStudents?.length || 0} of {notification.totalStudents}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(notification.timestamp).toLocaleString()}
            </p>
          </div>
        );
      default:
        return (
          <div>
            <p className="font-medium">Notification</p>
            <p className="text-sm">{JSON.stringify(notification)}</p>
          </div>
        );
    }
  };

  const getDriverDetails = (driverId: string) => {
    return drivers.find(driver => driver.id === driverId);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage all aspects of the student transportation system.</p>
        </div>
        
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-gray-100"
          >
            <BellRing className="h-6 w-6 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Notification Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
              <div className="py-2 px-3 bg-gray-100 flex justify-between items-center">
                <div className="font-medium">Notifications</div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-4 px-3 text-center text-gray-500">
                    No notifications
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`py-3 px-3 border-b border-gray-100 ${!notification.read ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="flex justify-between">
                        {getNotificationContent(notification)}
                        <div className="ml-3 flex-shrink-0 flex">
                          <button
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {notification.read ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Action buttons for student-arrived notifications */}
                      {notification.type === 'student-arrived' && !notification.read && (
                        <div className="mt-2 flex space-x-2">
                          {notification.driverId && (
                            <a 
                              href={`tel:${getDriverDetails(notification.driverId)?.phone}`}
                              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded flex items-center"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Call Driver
                            </a>
                          )}
                          <button 
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Acknowledge
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card flex items-center">
              <div className="rounded-full bg-indigo-100 p-3 mr-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
            
            <div className="card flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Drivers</p>
                <p className="text-2xl font-bold">{drivers.length}</p>
              </div>
            </div>
            
            <div className="card flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Trips</p>
                <p className="text-2xl font-bold">{trips.length}</p>
              </div>
            </div>
            
            <div className="card flex items-center">
              <div className="rounded-full bg-amber-100 p-3 mr-4">
                <Truck className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Active Trips</p>
                <p className="text-2xl font-bold">{activeTrips.length}</p>
              </div>
            </div>
          </div>

          {/* Live Map */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Live Transportation Tracking</h2>
              <div className="flex space-x-2">
                <span className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  Active Vehicles
                </span>
              </div>
            </div>
            
            <div className="card p-0 overflow-hidden">
              <Map 
                markers={mapMarkers}
                height="400px"
                zoom={10}
              />
            </div>
          </div>

          {/* Recent Notifications */}
          {notifications.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Recent Notifications</h2>
              <div className="card">
                <div className="divide-y divide-gray-100">
                  {notifications.slice(0, 5).map(notification => (
                    <div 
                      key={notification.id}
                      className={`py-3 ${!notification.read ? 'bg-indigo-50 rounded' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        {getNotificationContent(notification)}
                        {!notification.read && (
                          <button
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/student-registration" className="card bg-indigo-50 hover:bg-indigo-100 transition flex flex-col items-center p-6">
                <Users className="h-8 w-8 text-indigo-600 mb-3" />
                <h3 className="font-semibold">Register Student</h3>
                <p className="text-sm text-gray-600 text-center mt-2">Add new students to the system</p>
              </Link>
              
              <Link to="/driver-registration" className="card bg-green-50 hover:bg-green-100 transition flex flex-col items-center p-6">
                <User className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold">Register Driver</h3>
                <p className="text-sm text-gray-600 text-center mt-2">Add new transportation drivers</p>
              </Link>
              
              <Link to="/manage-trips" className="card bg-blue-50 hover:bg-blue-100 transition flex flex-col items-center p-6">
                <MapPin className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold">Manage Trips</h3>
                <p className="text-sm text-gray-600 text-center mt-2">Create and monitor transportation trips</p>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-bold mb-4">Recent Trips</h2>
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrived</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trips.slice(0, 5).map((trip) => (
                      <tr key={trip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{trip.driverName}</div>
                          <div className="text-sm text-gray-500">{trip.plateNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trip.destination}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            trip.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            trip.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {trip.status === 'in-progress' ? 'In Progress' : 
                             trip.status === 'completed' ? 'Completed' : 'Scheduled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trip.students.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trip.arrivedStudents?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(trip.startTime).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    
                    {trips.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          No trips found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
 
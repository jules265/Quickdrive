import  { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Trip, Student } from '../types';
import { MapPin, Calendar, Users, CheckCircle, Play, Phone, Clock, Navigation, UserCheck, BellRing } from 'lucide-react';
import Map from '../components/Map';

export default function DriverDashboard() {
  const { userProfile } = useAuth();
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [tripStudents, setTripStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [arrivedStudents, setArrivedStudents] = useState<string[]>([]);
  const [notificationSent, setNotificationSent] = useState<Record<string, boolean>>({});
  
  // For real location tracking
  const [currentLocation, setCurrentLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!userProfile) return;

      try {
        // Find driver record by user email
        const driversRef = collection(db, 'drivers');
        const q = query(driversRef, where("email", "==", userProfile.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const driverData = {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
          };
          setDriverDetails(driverData);
          
          // Get trips this driver is assigned to
          const tripsRef = collection(db, 'trips');
          const tripsQuery = query(tripsRef, where("driverId", "==", driverData.id));
          
          const unsubscribe = onSnapshot(tripsQuery, (snapshot) => {
            const tripsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Trip));
            
            const active = tripsList.find(trip => trip.status === 'in-progress');
            
            setTrips(tripsList);
            setActiveTrip(active || null);
            
            if (active) {
              fetchTripStudents(active);
              // Initialize arrived students if available
              if (active.arrivedStudents) {
                setArrivedStudents(active.arrivedStudents || []);
              } else {
                setArrivedStudents([]);
              }
            }
            
            setLoading(false);
          });
          
          return unsubscribe;
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching driver data:", error);
        setLoading(false);
      }
    };

    const fetchTripStudents = async (trip: Trip) => {
      if (!trip.students || trip.students.length === 0) {
        setTripStudents([]);
        return;
      }
      
      try {
        const students: Student[] = [];
        const studentsRef = collection(db, 'students');
        
        // Fetch each student document
        for (const studentId of trip.students) {
          const studentQuery = query(studentsRef, where("id", "==", studentId));
          const querySnapshot = await getDocs(studentsRef);
          
          // Find the student with matching ID
          const studentDoc = querySnapshot.docs.find(doc => doc.id === studentId);
          
          if (studentDoc) {
            students.push({
              id: studentDoc.id,
              ...studentDoc.data() as Omit<Student, 'id'>
            });
          }
        }
        
        setTripStudents(students);
      } catch (error) {
        console.error("Error fetching trip students:", error);
      }
    };

    fetchDriverData();
  }, [userProfile]);

  // Handle real location tracking
  useEffect(() => {
    if (activeTrip) {
      // Start location tracking when there's an active trip
      startLocationTracking();
    } else {
      // Stop location tracking when there's no active trip
      stopLocationTracking();
    }

    // Cleanup on unmount
    return () => {
      stopLocationTracking();
    };
  }, [activeTrip]);

  const startLocationTracking = () => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    // Clear any previous errors
    setLocationError('');

    // First get the current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(newPosition);
        
        // Update trip location in Firestore if there's an active trip
        if (activeTrip) {
          updateTripLocation(activeTrip.id, newPosition);
        }
      },
      (error) => {
        // Handle geolocation error
        setLocationError(`Error getting location: ${getLocationErrorMessage(error.code)}`);
        // Fallback to simulated location updates
        startSimulatedLocationTracking();
      },
      { enableHighAccuracy: true }
    );

    // Then start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(newPosition);
        
        // Update trip location in Firestore if there's an active trip
        if (activeTrip) {
          updateTripLocation(activeTrip.id, newPosition);
        }
      },
      (error) => {
        setLocationError(`Error tracking location: ${getLocationErrorMessage(error.code)}`);
        // Fallback to simulated location updates
        startSimulatedLocationTracking();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // Also clear any interval that might be running
    if (window.locationUpdateInterval) {
      clearInterval(window.locationUpdateInterval);
      window.locationUpdateInterval = undefined;
    }
  };

  const startSimulatedLocationTracking = () => {
    // If we already have an interval running, clear it
    if (window.locationUpdateInterval) {
      clearInterval(window.locationUpdateInterval);
    }
    
    // Use simulated location updates
    window.locationUpdateInterval = setInterval(() => {
      const newLat = currentLocation.lat + (Math.random() - 0.5) * 0.01;
      const newLng = currentLocation.lng + (Math.random() - 0.5) * 0.01;
      const newPosition = { lat: newLat, lng: newLng };
      
      setCurrentLocation(newPosition);
      
      // Update trip location in Firestore if there's an active trip
      if (activeTrip) {
        updateTripLocation(activeTrip.id, newPosition);
      }
    }, 10000);
  };

  const getLocationErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return "Permission denied. Please enable location services.";
      case 2:
        return "Position unavailable. The network is down or GPS satellites can't be contacted.";
      case 3:
        return "Timeout. The request to get user location timed out.";
      default:
        return "An unknown error occurred.";
    }
  };

  const updateTripLocation = async (tripId: string, location: { lat: number; lng: number }) => {
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        currentLocation: location,
        lastLocationUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating trip location:", error);
    }
  };

  const startTrip = async (tripId: string) => {
    try {
      // Start location tracking
      startLocationTracking();
      
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'in-progress',
        currentLocation: currentLocation,
        startTime: new Date().toISOString(),
        arrivedStudents: []
      });
      
      // Send notification that trip has started
      await sendNotification({
        type: 'trip-started',
        tripId,
        driverName: driverDetails.name,
        driverId: driverDetails.id,
        plateNumber: driverDetails.plateNumber,
        destination: trips.find(t => t.id === tripId)?.destination || 'Unknown',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error starting trip:", error);
    }
  };

  const completeTrip = async (tripId: string) => {
    try {
      // Stop location tracking
      stopLocationTracking();
      
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'completed',
        endTime: new Date().toISOString()
      });
      
      // Send notification that trip has completed
      await sendNotification({
        type: 'trip-completed',
        tripId,
        driverName: driverDetails.name,
        driverId: driverDetails.id,
        destination: activeTrip?.destination || 'Unknown',
        arrivedStudents: arrivedStudents,
        totalStudents: activeTrip?.students.length || 0,
        timestamp: new Date().toISOString()
      });
      
      setActiveTrip(null);
      setArrivedStudents([]);
      setNotificationSent({});
    } catch (error) {
      console.error("Error completing trip:", error);
    }
  };

  // Mark student as arrived
  const markStudentArrived = async (studentId: string, studentName: string) => {
    if (!activeTrip) return;
    
    try {
      // Add student to arrived list if not already there
      if (!arrivedStudents.includes(studentId)) {
        const updatedArrivedStudents = [...arrivedStudents, studentId];
        
        // Update trip in Firestore
        await updateDoc(doc(db, 'trips', activeTrip.id), {
          arrivedStudents: updatedArrivedStudents
        });
        
        setArrivedStudents(updatedArrivedStudents);
        
        // Send notification only if not already sent for this student
        if (!notificationSent[studentId]) {
          await sendNotification({
            type: 'student-arrived',
            tripId: activeTrip.id,
            studentId,
            studentName,
            driverName: driverDetails.name,
            driverId: driverDetails.id,
            destination: activeTrip.destination,
            timestamp: new Date().toISOString(),
            location: currentLocation
          });
          
          // Mark notification as sent for this student
          setNotificationSent(prev => ({
            ...prev,
            [studentId]: true
          }));
        }
      }
    } catch (error) {
      console.error("Error marking student arrival:", error);
    }
  };

  // Send notification to admin
  const sendNotification = async (notificationData: any) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // Prepare map markers
  const mapMarkers = [{
    id: 'driver',
    position: currentLocation,
    title: 'Your Location',
    info: driverDetails ? `${driverDetails.name} - ${driverDetails.plateNumber}` : 'Driver'
  }];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Driver Dashboard</h1>
        <p className="text-gray-600">Manage your trips and view student information.</p>
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
          {/* Driver Info */}
          {driverDetails ? (
            <div className="card mb-8">
              <h2 className="text-xl font-bold mb-4">Your Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Name</p>
                  <p className="font-medium">{driverDetails.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Email</p>
                  <p className="font-medium">{driverDetails.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Phone</p>
                  <p className="font-medium">{driverDetails.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">License Number</p>
                  <p className="font-medium">{driverDetails.licenseNumber || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Vehicle Plate Number</p>
                  <p className="font-medium">{driverDetails.plateNumber || "Not provided"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card mb-8 bg-yellow-50 border border-yellow-100">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Account Not Complete</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Your driver details haven't been added to the system yet. Please contact your administrator to complete your registration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Trip */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Current Trip</h2>
            
            {activeTrip ? (
              <div className="space-y-4">
                <div className="card p-0 overflow-hidden">
                  {locationError && (
                    <div className="bg-yellow-50 border-b border-yellow-100 p-4 text-sm text-yellow-800">
                      {locationError} Showing simulated location updates instead.
                    </div>
                  )}
                  
                  <div className="p-6 bg-indigo-50 border-b border-indigo-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-bold text-lg flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
                          {activeTrip.destination}
                        </h3>
                        <div className="flex flex-col md:flex-row md:items-center mt-2 text-indigo-700">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {activeTrip.students.length} Students
                          </span>
                          <span className="md:ml-4 flex items-center mt-1 md:mt-0">
                            <Clock className="h-4 w-4 mr-1" />
                            Started: {new Date(activeTrip.startTime).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <button 
                          onClick={() => completeTrip(activeTrip.id)}
                          className="btn btn-primary flex items-center"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Complete Trip
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Map 
                      markers={mapMarkers}
                      center={currentLocation}
                      height="350px"
                      zoom={15}
                    />
                    <div className="absolute top-2 right-2 bg-white p-2 rounded-md shadow-md flex items-center text-sm">
                      <Navigation className="h-4 w-4 text-indigo-600 mr-1" />
                      <span>{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Tracking is active. Your location is being shared with students on this trip.</p>
                      <div className="flex items-center text-sm text-indigo-600">
                        <UserCheck className="h-4 w-4 mr-1" />
                        <span>{arrivedStudents.length} of {activeTrip.students.length} students arrived</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Student List */}
                <div className="card">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-indigo-600" />
                    Students ({tripStudents.length})
                  </h3>
                  
                  <div className="divide-y divide-gray-200">
                    {tripStudents.length > 0 ? (
                      tripStudents.map(student => (
                        <div key={student.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.homeAddress}</p>
                              <p className="text-sm text-gray-500">
                                {student.phone && (
                                  <span className="flex items-center text-indigo-600 mt-1">
                                    <Phone className="h-4 w-4 mr-1" />
                                    {student.phone}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              {arrivedStudents.includes(student.id) ? (
                                <div className="py-1 px-3 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Arrived
                                </div>
                              ) : (
                                <button 
                                  onClick={() => markStudentArrived(student.id, student.name)}
                                  className="btn btn-primary py-1 text-sm"
                                >
                                  Mark Arrived
                                </button>
                              )}
                              
                              {student.phone && (
                                <a 
                                  href={`tel:${student.phone}`} 
                                  className="btn btn-secondary py-1 text-sm flex items-center"
                                >
                                  <Phone className="h-4 w-4 mr-1" />
                                  Call
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 py-4">No student information available</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-gray-50 border border-gray-200 text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500">No Active Trip</h3>
                <p className="text-gray-500 mt-2 mb-6">You don't have any active trips right now.</p>
                
                {trips.filter(trip => trip.status === 'scheduled').length > 0 ? (
                  <div className="text-center">
                    <p className="font-medium mb-2">Ready to start your scheduled trip?</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {trips
                        .filter(trip => trip.status === 'scheduled')
                        .map(trip => (
                          <button 
                            key={trip.id}
                            onClick={() => startTrip(trip.id)}
                            className="btn btn-primary flex items-center"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Trip to {trip.destination}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">You have no scheduled trips available.</p>
                )}
              </div>
            )}
          </div>

          {/* Scheduled Trips */}
          {!activeTrip && trips.filter(trip => trip.status === 'scheduled').length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Scheduled Trips</h2>
              
              <div className="space-y-4">
                {trips
                  .filter(trip => trip.status === 'scheduled')
                  .map(trip => (
                    <div key={trip.id} className="card">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="mb-4 md:mb-0">
                          <div className="flex items-center">
                            <MapPin className="h-5 w-5 text-indigo-500 mr-2" />
                            <h3 className="font-bold">{trip.destination}</h3>
                          </div>
                          <p className="text-gray-600 mt-1">Students: {trip.students.length}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Scheduled: {new Date(trip.startTime).toLocaleString()}
                          </p>
                        </div>
                        <button 
                          onClick={() => startTrip(trip.id)}
                          className="btn btn-primary flex items-center self-start md:self-auto"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Trip
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Trip History */}
          {trips.filter(trip => trip.status === 'completed').length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Completed Trips</h2>
              
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrived</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trips
                        .filter(trip => trip.status === 'completed')
                        .map(trip => (
                          <tr key={trip.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{trip.destination}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(trip.startTime).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {trip.students.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {trip.arrivedStudents?.length || 0} of {trip.students.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// For TypeScript - extend Window interface to accept our custom property
declare global {
  interface Window {
    locationUpdateInterval: number | undefined;
  }
}
 
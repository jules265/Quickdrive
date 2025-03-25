import  { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Trip } from '../types';
import { Calendar, Truck, MapPin, Clock, UserCheck } from 'lucide-react';
import Map from '../components/Map';

export default function StudentDashboard() {
  const { userProfile } = useAuth();
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [arrivalStatus, setArrivalStatus] = useState<'pending' | 'arrived' | 'not-applicable'>('not-applicable');

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!userProfile) return;

      try {
        // Find student record by user email
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where("email", "==", userProfile.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const studentData = {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
          };
          setStudentDetails(studentData);
          
          // Get trips this student is assigned to
          const tripsRef = collection(db, 'trips');
          const tripsQuery = query(tripsRef, where("students", "array-contains", studentData.id));
          
          const unsubscribe = onSnapshot(tripsQuery, (snapshot) => {
            const tripsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Trip));
            
            const active = tripsList.find(trip => trip.status === 'in-progress');
            const upcoming = tripsList.filter(trip => trip.status === 'scheduled');
            
            setActiveTrip(active || null);
            setUpcomingTrips(upcoming);
            
            // Check if student is marked as arrived in the active trip
            if (active && studentData.id) {
              const arrivedStudents = active.arrivedStudents || [];
              if (arrivedStudents.includes(studentData.id)) {
                setArrivalStatus('arrived');
              } else {
                setArrivalStatus('pending');
              }
            } else {
              setArrivalStatus('not-applicable');
            }
            
            setLoading(false);
          });
          
          return unsubscribe;
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [userProfile]);

  // Prepare map markers
  const mapMarkers = activeTrip ? [{
    id: activeTrip.id,
    position: activeTrip.currentLocation || { lat: 40.7128, lng: -74.0060 },
    title: `Your Transport: ${activeTrip.driverName}`,
    info: `Vehicle: ${activeTrip.plateNumber} | Destination: ${activeTrip.destination}`
  }] : [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-gray-600">Track your transportation and view upcoming trips.</p>
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
          {/* Student Info */}
          {studentDetails ? (
            <div className="card mb-8">
              <h2 className="text-xl font-bold mb-4">Your Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Name</p>
                  <p className="font-medium">{studentDetails.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Email</p>
                  <p className="font-medium">{studentDetails.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Phone</p>
                  <p className="font-medium">{studentDetails.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Home Address</p>
                  <p className="font-medium">{studentDetails.homeAddress || "Not provided"}</p>
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
                      Your student details haven't been added to the system yet. Please contact your administrator to complete your registration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Trip */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Current Transportation</h2>
            
            {activeTrip ? (
              <div className="card p-0 overflow-hidden">
                <div className="p-6 bg-indigo-50 border-b border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{activeTrip.destination}</h3>
                      <p className="text-indigo-700">Driver: {activeTrip.driverName} • Vehicle: {activeTrip.plateNumber}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                        In Transit
                      </div>
                      
                      {/* Arrival Status */}
                      {arrivalStatus === 'arrived' ? (
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          <UserCheck className="h-4 w-4 mr-1" />
                          Arrival Confirmed
                        </div>
                      ) : arrivalStatus === 'pending' ? (
                        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          Arrival Pending
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                
                <Map 
                  markers={mapMarkers}
                  height="350px"
                  zoom={14}
                />
                
                <div className="p-6 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Departure Time</p>
                        <p className="font-medium">{new Date(activeTrip.startTime).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Truck className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Vehicle</p>
                        <p className="font-medium">{activeTrip.plateNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Destination</p>
                        <p className="font-medium">{activeTrip.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Call Driver */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Need to contact your driver?</p>
                    {activeTrip.driverPhone && (
                      <a 
                        href={`tel:${activeTrip.driverPhone}`} 
                        className="btn btn-secondary text-sm py-1 px-3 flex items-center"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call Driver
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-gray-50 border border-gray-200 text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500">No Active Transportation</h3>
                <p className="text-gray-500 mt-2">You don't have any active transportation right now.</p>
              </div>
            )}
          </div>

          {/* Upcoming Trips */}
          <div>
            <h2 className="text-xl font-bold mb-4">Upcoming Transportation</h2>
            
            {upcomingTrips.length > 0 ? (
              <div className="space-y-4">
                {upcomingTrips.map(trip => (
                  <div key={trip.id} className="card">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-indigo-500 mr-2" />
                          <h3 className="font-bold">{trip.destination}</h3>
                        </div>
                        <p className="text-gray-600 mt-1">Driver: {trip.driverName} • Vehicle: {trip.plateNumber}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Scheduled: {new Date(trip.startTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium self-start md:self-auto">
                        Scheduled
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card bg-gray-50 border border-gray-200 text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500">No Upcoming Trips</h3>
                <p className="text-gray-500 mt-2">You don't have any scheduled transportation.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
 
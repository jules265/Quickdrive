import  { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Calendar, Truck, MapPin, Users, Clock, Plus, CheckCircle, Trash, Edit } from 'lucide-react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Driver, Trip } from '../types';

interface TripForm {
  driverId: string;
  students: string[];
  destination: string;
  startTime: string;
  endTime: string;
}

export default function ManageTrips() {
  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<TripForm>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch students
        const studentSnapshot = await getDocs(collection(db, 'students'));
        const studentsList = studentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Student));
        setStudents(studentsList);

        // Fetch drivers
        const driverSnapshot = await getDocs(collection(db, 'drivers'));
        const driversList = driverSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Driver));
        setDrivers(driversList);

        // Fetch trips
        const tripSnapshot = await getDocs(collection(db, 'trips'));
        const tripsList = tripSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Trip));
        setTrips(tripsList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (editingTrip) {
      setValue('driverId', editingTrip.driverId);
      setValue('destination', editingTrip.destination);
      setValue('startTime', new Date(editingTrip.startTime).toISOString().slice(0, 16));
      setValue('endTime', new Date(editingTrip.endTime).toISOString().slice(0, 16));
      setSelectedStudents(editingTrip.students);
    }
  }, [editingTrip, setValue]);

  const onSubmit = async (data: TripForm) => {
    try {
      setLoading(true);
      setSuccess(false);
      setError('');

      // Find driver details for this trip
      const driver = drivers.find(d => d.id === data.driverId);
      if (!driver) {
        setError('Selected driver not found');
        setLoading(false);
        return;
      }

      const tripData = {
        driverId: data.driverId,
        driverName: driver.name,
        plateNumber: driver.plateNumber,
        students: selectedStudents,
        destination: data.destination,
        startTime: data.startTime,
        endTime: data.endTime,
        status: 'scheduled' as const,
        createdAt: new Date().toISOString()
      };

      if (editingTrip) {
        // Update existing trip
        await updateDoc(doc(db, 'trips', editingTrip.id), tripData);
        setTrips(trips.map(trip => trip.id === editingTrip.id ? { ...tripData, id: editingTrip.id } as Trip : trip));
      } else {
        // Create new trip
        const docRef = await addDoc(collection(db, 'trips'), tripData);
        setTrips([...trips, { id: docRef.id, ...tripData } as Trip]);
      }

      setSuccess(true);
      setEditingTrip(null);
      reset();
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error managing trip:", error);
      setError('Failed to save trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await deleteDoc(doc(db, 'trips', tripId));
        setTrips(trips.filter(trip => trip.id !== tripId));
      } catch (error) {
        console.error("Error deleting trip:", error);
        alert('Failed to delete trip. Please try again.');
      }
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
  };

  const cancelEdit = () => {
    setEditingTrip(null);
    reset();
    setSelectedStudents([]);
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Trips</h1>
        <p className="text-gray-600">Create and manage transportation trips.</p>
      </div>

      <div className="card mb-8">
        <div className="flex items-center mb-6">
          <Calendar className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold">
            {editingTrip ? 'Edit Trip' : 'Create New Trip'}
          </h2>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Trip {editingTrip ? 'updated' : 'created'} successfully!</p>
              <p className="text-sm">The trip has been {editingTrip ? 'updated in' : 'added to'} the system.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="driverId" className="form-label">Driver*</label>
              <select
                id="driverId"
                className={`input-field ${errors.driverId ? 'border-red-500' : ''}`}
                {...register('driverId', { required: 'Driver is required' })}
              >
                <option value="">Select a driver</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.plateNumber}
                  </option>
                ))}
              </select>
              {errors.driverId && (
                <p className="mt-1 text-sm text-red-600">{errors.driverId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="destination" className="form-label">Destination*</label>
              <input
                id="destination"
                type="text"
                className={`input-field ${errors.destination ? 'border-red-500' : ''}`}
                placeholder="Enter trip destination"
                {...register('destination', { required: 'Destination is required' })}
              />
              {errors.destination && (
                <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="startTime" className="form-label">Start Time*</label>
              <input
                id="startTime"
                type="datetime-local"
                className={`input-field ${errors.startTime ? 'border-red-500' : ''}`}
                {...register('startTime', { required: 'Start time is required' })}
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="endTime" className="form-label">Expected End Time*</label>
              <input
                id="endTime"
                type="datetime-local"
                className={`input-field ${errors.endTime ? 'border-red-500' : ''}`}
                {...register('endTime', { required: 'End time is required' })}
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Select Students*</label>
            <div className="border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto">
              {students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {students.map(student => (
                    <div key={student.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelection(student.id)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor={`student-${student.id}`} className="ml-2 block text-sm text-gray-900">
                        {student.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No students available. Please add students first.</p>
              )}
            </div>
            {selectedStudents.length === 0 && (
              <p className="mt-1 text-sm text-red-600">Please select at least one student</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            {editingTrip && (
              <button
                type="button"
                onClick={cancelEdit}
                className="btn btn-secondary"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={loading || selectedStudents.length === 0}
              className="btn btn-primary flex items-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  {editingTrip ? 'Update Trip' : 'Create Trip'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      <div>
        <div className="flex items-center mb-6">
          <Truck className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold">Trip List</h2>
        </div>

        {trips.length > 0 ? (
          <div className="space-y-4">
            {trips.map(trip => (
              <div key={trip.id} className="card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-indigo-500 mr-2" />
                      <h3 className="font-bold">{trip.destination}</h3>
                    </div>
                    <div className="flex items-center mt-1">
                      <Truck className="h-4 w-4 text-gray-500 mr-1" />
                      <p className="text-gray-600">{trip.driverName} ({trip.plateNumber})</p>
                    </div>
                    <div className="flex items-center mt-1">
                      <Users className="h-4 w-4 text-gray-500 mr-1" />
                      <p className="text-gray-600">{trip.students.length} Students</p>
                    </div>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 text-gray-500 mr-1" />
                      <p className="text-sm text-gray-500">
                        {new Date(trip.startTime).toLocaleString()} - {new Date(trip.endTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditTrip(trip)}
                      className="btn btn-secondary flex items-center py-1 px-3"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="btn btn-danger flex items-center py-1 px-3"
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    trip.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    trip.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {trip.status === 'in-progress' ? 'In Progress' : 
                     trip.status === 'completed' ? 'Completed' : 'Scheduled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card bg-gray-50 border border-gray-200 text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500">No Trips Found</h3>
            <p className="text-gray-500 mt-2">
              You haven't created any trips yet. Use the form above to add your first trip.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
 
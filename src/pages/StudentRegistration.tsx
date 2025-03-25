import  { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Users, Plus, CheckCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface StudentForm {
  name: string;
  email: string;
  phone: string;
  homeAddress: string;
  emergencyContact: string;
}

export default function StudentRegistration() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentForm>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: StudentForm) => {
    try {
      setLoading(true);
      setSuccess(false);
      setError('');

      await addDoc(collection(db, 'students'), {
        ...data,
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      reset();
    } catch (error) {
      console.error("Error adding student:", error);
      setError('Failed to register student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Registration</h1>
        <p className="text-gray-600">Add new students to the transportation system.</p>
      </div>

      <div className="card">
        <div className="flex items-center mb-6">
          <Users className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-xl font-bold">Add New Student</h2>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Student registered successfully!</p>
              <p className="text-sm">The student has been added to the transportation system.</p>
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
              <label htmlFor="name" className="form-label">Full Name*</label>
              <input
                id="name"
                type="text"
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter student's full name"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="form-label">Email Address*</label>
              <input
                id="email"
                type="email"
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter student's email address"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="form-label">Phone Number*</label>
              <input
                id="phone"
                type="tel"
                className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="Enter student's phone number"
                {...register('phone', { required: 'Phone number is required' })}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="emergencyContact" className="form-label">Emergency Contact</label>
              <input
                id="emergencyContact"
                type="tel"
                className="input-field"
                placeholder="Enter emergency contact number"
                {...register('emergencyContact')}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="homeAddress" className="form-label">Home Address*</label>
              <textarea
                id="homeAddress"
                rows={3}
                className={`input-field ${errors.homeAddress ? 'border-red-500' : ''}`}
                placeholder="Enter student's home address"
                {...register('homeAddress', { required: 'Home address is required' })}
              ></textarea>
              {errors.homeAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.homeAddress.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => reset()}
              className="btn btn-secondary mr-2"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                <span className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Register Student
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
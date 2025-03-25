import  { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Plus, CheckCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface DriverForm {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  plateNumber: string;
}

export default function DriverRegistration() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DriverForm>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: DriverForm) => {
    try {
      setLoading(true);
      setSuccess(false);
      setError('');

      await addDoc(collection(db, 'drivers'), {
        ...data,
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      reset();
    } catch (error) {
      console.error("Error adding driver:", error);
      setError('Failed to register driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Driver Registration</h1>
        <p className="text-gray-600">Add new drivers to the transportation system.</p>
      </div>

      <div className="card">
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-green-600 mr-2" />
          <h2 className="text-xl font-bold">Add New Driver</h2>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Driver registered successfully!</p>
              <p className="text-sm">The driver has been added to the transportation system.</p>
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
                placeholder="Enter driver's full name"
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
                placeholder="Enter driver's email address"
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
                placeholder="Enter driver's phone number"
                {...register('phone', { required: 'Phone number is required' })}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="licenseNumber" className="form-label">Driver License Number*</label>
              <input
                id="licenseNumber"
                type="text"
                className={`input-field ${errors.licenseNumber ? 'border-red-500' : ''}`}
                placeholder="Enter driver's license number"
                {...register('licenseNumber', { required: 'License number is required' })}
              />
              {errors.licenseNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="plateNumber" className="form-label">Vehicle Plate Number*</label>
              <input
                id="plateNumber"
                type="text"
                className={`input-field ${errors.plateNumber ? 'border-red-500' : ''}`}
                placeholder="Enter vehicle's plate number"
                {...register('plateNumber', { required: 'Plate number is required' })}
              />
              {errors.plateNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.plateNumber.message}</p>
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
                  Register Driver
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
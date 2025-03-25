import  { Map, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center">
              <Map className="h-6 w-6 text-indigo-400" />
              <span className="ml-2 text-xl font-bold">Student Transport</span>
            </div>
            <p className="mt-2 text-gray-400 max-w-md">
              A secure and efficient student transportation tracking system for educational institutions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-indigo-400" />
                  <span>contact@studenttransport.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-indigo-400" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-indigo-400 transition">Home</a>
                </li>
                <li>
                  <a href="#" className="hover:text-indigo-400 transition">About</a>
                </li>
                <li>
                  <a href="#" className="hover:text-indigo-400 transition">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="hover:text-indigo-400 transition">Terms of Service</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Student Transport Tracker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
 
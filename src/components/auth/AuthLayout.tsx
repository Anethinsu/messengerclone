import { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Messenger-style navigation */}
      <header className="fixed top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="font-medium text-xl text-blue-600">
              Messenger Clone
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="hover:text-blue-600 text-gray-600">
              Features
            </Link>
            <Link to="/" className="hover:text-blue-600 text-gray-600">
              Security
            </Link>
            <Link to="/" className="hover:text-blue-600 text-gray-600">
              Help
            </Link>
            <Link to="/" className="hover:text-blue-600 text-gray-600">
              About
            </Link>
          </nav>
        </div>
      </header>

      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-md w-full px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">
              Messenger Clone
            </h2>
            <p className="text-xl font-medium text-gray-500 mt-2">
              Connect with friends instantly
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

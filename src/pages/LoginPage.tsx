// pages/LoginPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '@/components/LoginForm';
import { BookOpen } from 'lucide-react';

export const LoginPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-brand-black" />
                        </div>
                        <span className="text-2xl font-brand font-bold text-brand-black">
                            worldsmith
                        </span>
                    </Link>
                    <Link
                        to="/"
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-body"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </header>

            {/* Login Form */}
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-brand font-bold text-brand-black mb-3">
                            Welcome to WorldSmith
                        </h1>
                        <p className="text-gray-600 font-body">
                            Sign in to continue building your worlds
                        </p>
                    </div>
                    <LoginForm />
                </div>
            </div>
        </div>
    );
};

"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to AI Chat</h1>
        <p className="text-lg mb-8 text-gray-600">
          Your intelligent conversation assistant
        </p>
        
        <Link href="/chat" 
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-md">
          Start Chatting
        </Link>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';

export default function Playground() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Validation failed');
      }

      if (data.valid) {
        setNotification({ message: "Valid API key", color: "green" });
        // Wait for notification to show before redirecting
        setTimeout(() => {
          window.location.href = `/protected?apiKey=${apiKey}`;
        }, 1000);
      } else {
        setNotification({ message: "Invalid API key", color: "red" });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error validating key", color: "red" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Playground</h1>
      
      {notification && (
        <div className={`mb-4 p-4 rounded text-white bg-${notification.color}-500`}>
          {notification.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="border p-2 rounded w-full mb-4"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className={`bg-blue-500 text-white px-4 py-2 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Validating...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
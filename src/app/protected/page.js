'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Protected() {
  const [notification, setNotification] = useState(null);
  const [isValidated, setIsValidated] = useState(false);
  const searchParams = useSearchParams();
  const apiKey = searchParams.get('apiKey');

  useEffect(() => {
    const validateApiKey = async () => {
      if (!apiKey) {
        setNotification({ message: "No API key provided", color: "red" });
        return;
      }

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
          setIsValidated(true);
        } else {
          setNotification({ message: "Invalid API key", color: "red" });
          // Redirect back to playground after 3 seconds
          setTimeout(() => {
            window.location.href = '/playground';
          }, 3000);
        }
      } catch (error) {
        console.error('Error validating API key:', error);
        setNotification({ message: "Error validating key", color: "red" });
        setTimeout(() => {
          window.location.href = '/playground';
        }, 3000);
      }
    };

    validateApiKey();
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="p-8">
        <div className="bg-red-500 text-white p-4 rounded">
          No API key provided. Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {notification && (
        <div className={`bg-${notification.color}-500 text-white p-4 rounded mb-4`}>
          {notification.message}
        </div>
      )}
      
      {isValidated && (
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Protected Content</h1>
          <p>This content is only visible with a valid API key.</p>
          {/* Add your protected content here */}
        </div>
      )}
    </div>
  );
}
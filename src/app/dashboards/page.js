"use client";

import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';

function generateSecureKey(prefix = 'AI4TEA') {
  // Generate a random string of characters
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32; // Length of the random part
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(byte => characters[byte % characters.length])
    .join('');
  
  // Add timestamp component (base36 encoded)
  const timestamp = Date.now().toString(36);
  
  // Combine parts with prefix
  return `${prefix}_${timestamp}_${randomPart}`;
}

export default function Dashboard() {
  const [notification, setNotification] = useState(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyUsage, setKeyUsage] = useState(0);
  const [apiKeys, setApiKeys] = useState([]);
  const [editKey, setEditKey] = useState(null);
  const [deleteKey, setDeleteKey] = useState(null);
  const [copyKey, setCopyKey] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    const { data, error } = await supabase
      .from('api_key')
      .select('*');

    if (error) {
      console.error('Error fetching API keys:', error);
    } else {
      setApiKeys(data);
    }
  };

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key);
    setCopyKey(key);
  };

  const confirmDelete = (apiKey) => {
    setDeleteKey(apiKey);
  };

  const handleDelete = async () => {
    if (deleteKey) {
      const { error } = await supabase
        .from('api_key')
        .delete()
        .eq('id', deleteKey.id);

      if (error) {
        console.error('Error deleting API key:', error);
        setNotification({ message: "Error deleting key!", color: "red" });
      } else {
        setNotification({ message: "Key deleted!", color: "red" });
        fetchApiKeys();
      }

      setDeleteKey(null);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCreateKey = async () => {
    if (!keyName) {
      setNotification({ message: "Key name is required!", color: "red" });
      return;
    }

    const newApiKey = generateSecureKey();
    
    try {
      // First check if a key with this name already exists
      const { data: existingKey } = await supabase
        .from('api_key')
        .select('name')
        .eq('name', keyName)
        .single();

      if (existingKey) {
        setNotification({ message: "A key with this name already exists!", color: "red" });
        return;
      }

      // Create the new key
      const { data, error } = await supabase
        .from('api_key')
        .insert([
          { 
            name: keyName, 
            usage: keyUsage || 0, 
            value: newApiKey,
            created_at: new Date().toISOString(),
            last_used: null,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Success handling
      setNotification({ message: "Key created! Make sure to copy it now.", color: "green" });
      setIsModalOpen(false);
      
      // Copy to clipboard and show copy modal
      navigator.clipboard.writeText(newApiKey);
      setCopyKey(newApiKey);
      
      // Refresh the keys list
      fetchApiKeys();

    } catch (error) {
      console.error('Error creating API key:', error.message);
      setNotification({ 
        message: `Error creating key: ${error.message}`, 
        color: "red" 
      });
    }

    setTimeout(() => setNotification(null), 3000);
};

  const handleSaveKey = async () => {
    if (editKey) {
      try {
        const { error } = await supabase
          .from('api_key')
          .update({ 
            name: keyName, 
            usage: keyUsage || 0 
          })
          .eq('id', editKey.id);

        if (error) throw error;

        setNotification({ message: "Key updated!", color: "green" });
        setIsModalOpen(false);
        fetchApiKeys();
      } catch (error) {
        console.error('Error updating API key:', error.message);
        setNotification({ 
          message: `Error updating key: ${error.message}`, 
          color: "red" 
        });
      }
    } else {
      await handleCreateKey();
    }

    setTimeout(() => setNotification(null), 3000);
};

  const toggleKeyVisibility = () => {
    setKeyVisible(!keyVisible);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditKey(null);
  };

  const closeDeleteModal = () => {
    setDeleteKey(null);
  };

  const closeCopyModal = () => {
    setCopyKey(null);
  };

  const openEditModal = (apiKey) => {
    setEditKey(apiKey);
    setKeyName(apiKey.name);
    setKeyUsage(apiKey.usage);
    setIsModalOpen(true);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8 min-h-screen bg-gray-100">
        {notification && (
          <div
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-${notification.color}-500 text-white p-4 rounded shadow-lg`}
          >
            {notification.message}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">{editKey ? "Edit API Key" : "Create a new API key"}</h2>
              <p>Enter a name and limit for the API key.</p>
              <input
                type="text"
                placeholder="Key Name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="w-full p-2 mt-4 border rounded"
              />
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="limit"
                  className="mr-2"
                  checked={keyUsage > 0}
                  onChange={(e) => setKeyUsage(e.target.checked ? 1000 : 0)}
                />
                <label htmlFor="limit">Limit monthly usage*</label>
              </div>
              <p className="text-sm mt-2">
                * If the combined usage of all your keys exceeds your plan's limit, all requests will be rejected.
              </p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveKey}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg mr-2"
                >
                  {editKey ? "Save" : "Create"}
                </button>
                <button
                  onClick={closeModal}
                  className="bg-gray-300 text-black px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-red-500 p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4 text-white">Confirm Delete</h2>
              <p className="text-white">Are you sure you want to delete this key?</p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleDelete}
                  className="bg-white text-red-500 px-4 py-2 rounded-lg mr-2"
                >
                  Delete
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="bg-gray-300 text-black px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {copyKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-green-500 p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4 text-white">Copied to Clipboard</h2>
              <p className="text-white">The key has been copied to your clipboard.</p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={closeCopyModal}
                  className="bg-white text-green-500 px-4 py-2 rounded-lg"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-400 to-blue-500 text-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold">Researcher</h1>
            <button className="bg-white text-black px-4 py-2 rounded-lg">
              Manage Plan
            </button>
          </div>
          <p className="mt-4">API Limit</p>
          <div className="bg-white h-2 rounded-full mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
          <p className="mt-2">0/1,000 Requests</p>
        </div>

        <div className="bg-white p-6 mt-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">API Keys</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg">
              + Create Key
            </button>
          </div>
          <p className="mt-2 text-lg">
            The key is used to authenticate your requests to the Research API. To learn more, see the <a href="#" className="text-blue-500 underline">documentation</a> page.
          </p>
          <table className="w-full mt-4">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Usage</th>
                <th className="text-left">Key</th>
                <th className="text-left">Options</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((apiKey) => (
                <tr key={apiKey.id}>
                  <td>{apiKey.name}</td>
                  <td>{apiKey.usage}</td>
                  <td>
                    <input
                      type="text"
                      value={keyVisible ? apiKey.value : "AI4TEA-***********************"}
                      readOnly
                      className="bg-gray-100 p-2 rounded text-lg"
                    />
                  </td>
                  <td className="flex gap-2">
                    <button onClick={toggleKeyVisibility}>{keyVisible ? "🙈" : "👁️"}</button>
                    <button onClick={() => handleCopy(apiKey.value)}>📋</button>
                    <button onClick={() => openEditModal(apiKey)}>✏️</button>
                    <button onClick={() => confirmDelete(apiKey)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <p>Have any questions, feedback or need support? We'd love to hear from you!</p>
          <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
            Contact us
          </button>
        </div>
      </div>
    </div>
  );
}
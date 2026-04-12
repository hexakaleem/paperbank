import { useState, useEffect } from 'react';
import api from '../api/index';

export const useBackendConnection = () => {
  const [connected, setConnected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await api.get('/health');
        if (response.status === 200) {
          console.log('✅ Backend connected:', response.data);
          setConnected(true);
          setError(null);
        }
      } catch (err) {
        console.error('❌ Backend connection failed:', err.message);
        setConnected(false);
        setError(err.message);
      }
    };

    checkConnection();
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return { connected, error };
};

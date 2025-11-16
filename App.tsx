

import React, { useState, useMemo, useEffect, lazy, Suspense, useCallback } from 'react';
import { LoginView } from './components/views/LoginView';
import type { User, AnyData } from './types';
import { authenticate } from './auth';
import { api } from './services/api';

const MainLayout = lazy(() => import('./components/MainLayout').then(module => ({ default: module.MainLayout })));

const FullPageSpinner = () => (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600"></div>
    </div>
);


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AnyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const serverData = await api.getData();
        setData(serverData);
      } catch (err) {
        setError("Failed to load data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const users = useMemo(() => data.filter((d): d is User => d.module === 'users'), [data]);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const loggedInUser = await authenticate(username, password, users);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
  };
  
  const createItem = useCallback(async (item: Omit<AnyData, '__backendId' | 'id'> & { id?: string }) => {
    try {
        const newItem = await api.createItem(item);
        setData(prev => [...prev, newItem]);
        return { isOk: true };
    } catch (e) {
        console.error("Failed to create item", e);
        return { isOk: false };
    }
  }, []);

  const updateItem = useCallback(async (item: AnyData) => {
    try {
        const updatedItem = await api.updateItem(item);
        setData(prev => prev.map(d => d.__backendId === updatedItem.__backendId ? updatedItem : d));
        return { isOk: true };
    } catch (e) {
        console.error("Failed to update item", e);
        return { isOk: false };
    }
  }, []);
  
  const deleteItem = useCallback(async (item: AnyData) => {
    try {
        const { __backendId } = await api.deleteItem(item);
        setData(prev => prev.filter(d => d.__backendId !== __backendId));
        return { isOk: true };
    } catch (e) {
        console.error("Failed to delete item", e);
        return { isOk: false };
    }
  }, []);

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (error) {
    return <div className="h-screen w-screen flex items-center justify-center bg-red-100 text-red-700">{error}</div>;
  }
  
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <MainLayout
        user={user}
        onLogout={handleLogout}
        data={data}
        create={createItem}
        update={updateItem}
        deleteItem={deleteItem}
      />
    </Suspense>
  );
}
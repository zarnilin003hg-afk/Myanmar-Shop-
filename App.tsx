

import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
// import { MainLayout } from './components/MainLayout';
import { LoginView } from './components/views/LoginView';
import type { User, AnyData } from './types';
import { authenticate } from './auth';
import { mockData as initialMockData } from './mockData';

const MainLayout = lazy(() => import('./components/MainLayout').then(module => ({ default: module.MainLayout })));

const LOCAL_STORAGE_KEY = 'myanmar-pos-pro-data';

const usePersistentData = () => {
  const [data, setData] = useState<AnyData[]>(() => {
    try {
      const storedData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error("Error parsing data from localStorage", error);
    }
    // If no stored data, or if parsing fails, initialize with mock data.
    return initialMockData;
  });

  // This effect runs whenever 'data' changes, and saves it to localStorage.
  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving data to localStorage", error);
    }
  }, [data]);

  const create = async (item: Omit<AnyData, '__backendId' | 'id'> & { id?: string }) => {
    return new Promise<{ isOk: boolean }>((resolve) => {
      setTimeout(() => {
        const newItem = { ...item, __backendId: `backend_${Date.now()}_${Math.random()}` } as AnyData;
        setData(prev => [...prev, newItem]);
        resolve({ isOk: true });
      }, 200); // Reduced delay for better UX
    });
  };

  const update = async (item: AnyData) => {
    return new Promise<{ isOk: boolean }>((resolve) => {
      setTimeout(() => {
        setData(prev => prev.map(d => d.__backendId === item.__backendId ? item : d));
        resolve({ isOk: true });
      }, 200);
    });
  };

  const del = async (item: AnyData) => {
    return new Promise<{ isOk: boolean }>((resolve) => {
      setTimeout(() => {
        setData(prev => prev.filter(d => d.__backendId !== item.__backendId));
        resolve({ isOk: true });
      }, 200);
    });
  };

  return { data, create, update, delete: del };
};

const FullPageSpinner = () => (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600"></div>
    </div>
);


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const { data, create, update, delete: deleteItem } = usePersistentData();

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

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <MainLayout
        user={user}
        onLogout={handleLogout}
        data={data}
        create={create}
        update={update}
        deleteItem={deleteItem}
      />
    </Suspense>
  );
}
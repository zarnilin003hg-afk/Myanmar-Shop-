
import React, { useState, useMemo } from 'react';
import { MainLayout } from './components/MainLayout';
import { LoginView } from './components/views/LoginView';
import type { User, AnyData } from './types';
import { authenticate } from './auth';
import { mockData as initialMockData } from './mockData';

const useMockDataSdk = () => {
  const [data, setData] = useState<AnyData[]>(initialMockData);

  const create = async (item: Omit<AnyData, '__backendId' | 'id'> & { id?: string }) => {
    return new Promise<{ isOk: boolean }>((resolve) => {
      setTimeout(() => {
        const newItem = { ...item, __backendId: `backend_${Date.now()}_${Math.random()}` } as AnyData;
        setData(prev => [...prev, newItem]);
        resolve({ isOk: true });
      }, 500);
    });
  };

  const update = async (item: AnyData) => {
    return new Promise<{ isOk: boolean }>((resolve) => {
      setTimeout(() => {
        setData(prev => prev.map(d => d.__backendId === item.__backendId ? item : d));
        resolve({ isOk: true });
      }, 500);
    });
  };

  const del = async (item: AnyData) => {
    return new Promise<{ isOk: boolean }>((resolve) => {
      setTimeout(() => {
        setData(prev => prev.filter(d => d.__backendId !== item.__backendId));
        resolve({ isOk: true });
      }, 500);
    });
  };

  return { data, create, update, delete: del };
};


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const { data, create, update, delete: deleteItem } = useMockDataSdk();

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
    <MainLayout
      user={user}
      onLogout={handleLogout}
      data={data}
      create={create}
      update={update}
      deleteItem={deleteItem}
    />
  );
}
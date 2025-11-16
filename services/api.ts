
import { mockData as initialMockData } from '../mockData';
import type { AnyData } from '../types';

const LOCAL_STORAGE_KEY = 'myanmar-pos-pro-data';
const SIMULATED_LATENCY = 500; // ms

// Helper function to get data from localStorage or initialize it
const getStoredData = (): AnyData[] => {
    try {
      const storedData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error("Error parsing data from localStorage", error);
    }
    // If no stored data, or if parsing fails, initialize with mock data.
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMockData));
    return initialMockData;
};

// Helper function to save data to localStorage
const setStoredData = (data: AnyData[]) => {
    try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Error saving data to localStorage", error);
    }
};

// --- Simulated API ---

export const api = {
    getData: async (): Promise<AnyData[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log("API: GET /data");
                const data = getStoredData();
                resolve(data);
            }, SIMULATED_LATENCY);
        });
    },
    
    createItem: async (item: Omit<AnyData, '__backendId' | 'id'> & { id?: string }): Promise<AnyData> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log("API: POST /data", item);
                const data = getStoredData();
                const newItem = { 
                    ...item, 
                    id: item.id || `id_${Date.now()}`,
                    __backendId: `backend_${Date.now()}_${Math.random()}` 
                } as AnyData;
                const newData = [...data, newItem];
                setStoredData(newData);
                resolve(newItem);
            }, SIMULATED_LATENCY);
        });
    },

    updateItem: async (item: AnyData): Promise<AnyData> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log("API: PUT /data/:id", item);
                const data = getStoredData();
                const itemIndex = data.findIndex(d => d.__backendId === item.__backendId);

                if (itemIndex === -1) {
                    return reject(new Error("Item not found"));
                }
                
                const updatedItem = { ...item, updated_at: new Date().toISOString() };
                const newData = [...data];
                newData[itemIndex] = updatedItem;
                setStoredData(newData);
                resolve(updatedItem);
            }, SIMULATED_LATENCY);
        });
    },
    
    deleteItem: async (item: AnyData): Promise<{ __backendId: string }> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log("API: DELETE /data/:id", item);
                const data = getStoredData();
                const itemExists = data.some(d => d.__backendId === item.__backendId);

                if (!itemExists) {
                    return reject(new Error("Item not found"));
                }

                const newData = data.filter(d => d.__backendId !== item.__backendId);
                setStoredData(newData);
                resolve({ __backendId: item.__backendId });
            }, SIMULATED_LATENCY);
        });
    },
};

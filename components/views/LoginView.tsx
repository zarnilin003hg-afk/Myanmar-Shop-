
import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const success = await onLogin(username, password);
    
    setIsLoading(false);
    
    if (!success) {
      setError('အသုံးပြုသူအမည် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 font-[Segoe_UI,Myanmar_Text,Pyidaungsu]" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6 transform transition-all hover:scale-[1.01]">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">🏪</h1>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">Myanmar POS Pro</h2>
            <p className="text-gray-600 dark:text-gray-400">ကျေးဇူးပြု၍ လော့ဂ်အင်ဝင်ပါ</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">အသုံးပြုသူအမည်</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:disabled:bg-gray-600"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">စကားဝှက်</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:disabled:bg-gray-600"
              placeholder="admin"
              required
            />
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-wait"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
            >
              {isLoading ? 'ဝင်ရောက်နေသည်...' : 'လော့ဂ်အင်'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
          <p className="font-semibold mb-1">စမ်းသပ်ရန် အကောင့်များ</p>
          <p>Admin: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">admin</code> / <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">admin</code></p>
          <p>Cashier: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">cashier</code> / <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">cashier</code></p>
        </div>
      </div>
    </div>
  );
};
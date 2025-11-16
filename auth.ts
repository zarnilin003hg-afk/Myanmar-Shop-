
import type { User } from './types';

/**
 * Simulates an authentication request against a provided list of users.
 * @param username The username to check.
 * @param password The password to check.
 * @param users The list of all system users.
 * @returns A promise that resolves with the User object on success, or null on failure.
 */
export const authenticate = (username: string, password: string, users: User[]): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        // Omit password from the returned user object for security
        const { password, ...userWithoutPassword } = user;
        resolve(userWithoutPassword as User);
      } else {
        resolve(null);
      }
    }, 500); // Simulate network delay
  });
};
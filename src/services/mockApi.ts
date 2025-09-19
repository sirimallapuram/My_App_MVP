// Mock API service for testing authentication without backend
import { LoginCredentials, SignupCredentials, AuthResponse } from '../types/auth';

// Mock users database
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  },
  {
    id: '2', 
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123'
  }
];

// Mock JWT token generator
const generateMockToken = (user: any): string => {
  return `mock-jwt-token-${user.id}-${Date.now()}`;
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    await delay(1000); // Simulate network delay
    
    const user = mockUsers.find(u => 
      u.email === credentials.email && u.password === credentials.password
    );
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const token = generateMockToken(user);
    
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  },

  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    await delay(1000); // Simulate network delay
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === credentials.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Create new user
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      name: credentials.name,
      email: credentials.email,
      password: credentials.password
    };
    
    mockUsers.push(newUser);
    
    const token = generateMockToken(newUser);
    
    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    };
  }
};

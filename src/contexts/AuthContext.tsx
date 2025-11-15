import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Dentist } from '@/types';
import { demoUser, demoDentist, storage, isDemoMode } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  dentist: Dentist | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isDemo: boolean;
  setDemo: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check for stored auth
    const storedUser = storage.getItem('user');
    const storedDentist = storage.getItem('dentist');
    const demo = isDemoMode();

    if (demo) {
      setUser(demoUser);
      setDentist(demoDentist);
      setIsDemo(true);
    } else if (storedUser && storedDentist) {
      setUser(storedUser);
      setDentist(storedDentist);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - in real app, call API
    if (email === 'demo@ocliq.ma' && password === 'demo') {
      setUser(demoUser);
      setDentist(demoDentist);
      storage.setItem('user', demoUser);
      storage.setItem('dentist', demoDentist);
      return true;
    }
    
    // Check stored users
    const storedUsers = storage.getItem('users') || [];
    const foundUser = storedUsers.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
      const userData = { ...foundUser };
      delete userData.password;
      setUser(userData);
      
      const dentistData = storage.getItem(`dentist_${userData.id}`);
      if (dentistData) {
        setDentist(dentistData);
        storage.setItem('user', userData);
        storage.setItem('dentist', dentistData);
        return true;
      }
    }
    
    return false;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    // Mock registration
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      role: 'dentist',
    };
    
    const newDentist: Dentist = {
      id: `dentist-${Date.now()}`,
      userId: newUser.id,
      name,
      specialty: 'Dentisterie générale',
      address: '',
      city: '',
      phone: '',
      email,
      workingHours: {
        monday: { start: '09:00', end: '18:00', enabled: true },
        tuesday: { start: '09:00', end: '18:00', enabled: true },
        wednesday: { start: '09:00', end: '18:00', enabled: true },
        thursday: { start: '09:00', end: '18:00', enabled: true },
        friday: { start: '09:00', end: '14:00', enabled: true },
        saturday: { start: '10:00', end: '16:00', enabled: true },
        sunday: { start: '10:00', end: '14:00', enabled: false },
      },
      vacationDates: [],
      services: [
        { id: 's1', name: 'Consultation', description: 'Consultation générale', duration: 30, price: 200 },
        { id: 's2', name: 'Détartrage', description: 'Nettoyage professionnel', duration: 45, price: 300 },
      ],
      bookingPageId: `dentist-${Date.now()}`,
    };
    
    const storedUsers = storage.getItem('users') || [];
    storedUsers.push({ ...newUser, password });
    storage.setItem('users', storedUsers);
    storage.setItem(`dentist_${newUser.id}`, newDentist);
    
    setUser(newUser);
    setDentist(newDentist);
    storage.setItem('user', newUser);
    storage.setItem('dentist', newDentist);
    
    return true;
  };

  const logout = () => {
    setUser(null);
    setDentist(null);
    storage.removeItem('user');
    storage.removeItem('dentist');
  };

  const setDemo = (enabled: boolean) => {
    setIsDemo(enabled);
    storage.setItem('demoMode', enabled);
    if (enabled) {
      setUser(demoUser);
      setDentist(demoDentist);
      storage.setItem('user', demoUser);
      storage.setItem('dentist', demoDentist);
    } else {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, dentist, login, register, logout, isLoading, isDemo, setDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


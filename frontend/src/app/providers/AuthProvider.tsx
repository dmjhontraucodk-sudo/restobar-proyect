// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// Definir interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  restaurantId: string;
  tenantName?: string;
  tenantSubdomain: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  currentTenant: string;
  login: (token: string, userData: User) => void;
  logout: () => void;
  validateTenantAccess: () => boolean;
}

// Crear contexto - ¡EXPORTARLO!
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función para detectar tenant del subdominio
const getCurrentTenantFromHostname = (): string => {
  const hostname = window.location.hostname;
  console.log('🔍 [TENANT DEBUG] Hostname:', hostname);
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '';
  }
  
  if (hostname.endsWith('.localhost')) {
    const subdomain = hostname.split('.')[0];
    console.log('🔍 [TENANT DEBUG] Subdominio detectado:', subdomain);
    return subdomain;
  }
  
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0];
  }
  
  return '';
};

// Exportar AuthProvider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentTenant, setCurrentTenant] = useState<string>('');

  useEffect(() => {
    const tenant = getCurrentTenantFromHostname();
    setCurrentTenant(tenant);
    console.log('🔍 [TENANT DEBUG] Tenant establecido:', tenant);

    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        
        // Validar que el usuario pertenezca a este tenant
        if (tenant && userData.tenantSubdomain !== tenant) {
          console.log('🚫 [TENANT DEBUG] Tenant mismatch - User:', userData.tenantSubdomain, 'Current:', tenant);
          
          toast.error(
            `🔐 Acceso Denegado\n\nTu cuenta pertenece a: ${userData.tenantSubdomain}.localhost\nEstás intentando acceder a: ${tenant}.localhost\n\nPor favor, accede a través del subdominio correcto.`,
            {
              duration: 8000,
              position: 'top-right',
            }
          );
          
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        } else {
          setIsAuthenticated(true);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, userData: User) => {
    const tenant = getCurrentTenantFromHostname();
    
    // Validar durante el login
    if (tenant && userData.tenantSubdomain !== tenant) {
      console.log('🚫 [TENANT DEBUG] Login attempt to wrong tenant:', userData.tenantSubdomain, 'vs', tenant);
      
      toast.error(
        `🔐 Acceso Denegado\n\nTu cuenta pertenece a: ${userData.tenantSubdomain}.localhost\nEstás intentando acceder a: ${tenant}.localhost\n\nPor favor, accede a través del subdominio correcto.`,
        {
          duration: 8000,
          position: 'top-right',
        }
      );
      
      throw new Error(`No tienes acceso a este tenant. Tu tenant es: ${userData.tenantSubdomain}`);
    }
    
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentTenant(tenant);
    
    toast.success(`¡Bienvenido ${userData.name}!`, {
      duration: 3000,
      position: 'top-right',
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    
    toast.success('Sesión cerrada correctamente', {
      duration: 3000,
      position: 'top-right',
    });
    
    window.location.href = 'http://localhost:5174';
  };

  const validateTenantAccess = (): boolean => {
    if (!user || !currentTenant) return false;
    return user.tenantSubdomain === currentTenant;
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    currentTenant,
    login,
    logout,
    validateTenantAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Exportar hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
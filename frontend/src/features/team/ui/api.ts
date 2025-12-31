// src/features/team/ui/api.ts
import axios from 'axios';
import { getApiUrl } from '@shared/config/env';

const apiClient = axios.create({
    baseURL: getApiUrl('/api/dashboard'),
    headers: {
        'Content-Type': 'application/json',
    }
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getRoles = () => apiClient.get('/employees/roles');
export const getEmployees = () => apiClient.get('/employees');
export const updateEmployeeRole = (employeeId: number, rol_id: number) => {
    return apiClient.patch(`/employees/${employeeId}`, { rol_id });
};

// This function is not used in the new component, but I will leave it here for now.
export const getNavigationItems = () => apiClient.get('/rbac/navigation-items');
export const updateRolePermissions = (roleId: number, permissions: string[]) => {
    return apiClient.put(`/rbac/roles/${roleId}/permissions`, { permissions });
};

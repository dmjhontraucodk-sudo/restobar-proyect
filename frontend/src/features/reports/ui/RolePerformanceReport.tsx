import React, { useState, useCallback, useEffect } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import { type Role, type EmployeeSimple, type EmployeePerformanceReport, type MotorizadoPerformanceMetrics } from '@shared/types';
import toast from 'react-hot-toast';
import { Truck, DollarSign, Clock, User, Briefcase, Calendar } from 'lucide-react';

// Helper to format dates to YYYY-MM-DD
const toYYYYMMDD = (date: Date) => {
    return date.toISOString().split('T')[0];
};

// A simple, styled Stat Card component for displaying KPIs
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        borderLeft: `5px solid ${color}`
    }}>
        <div style={{
            background: `${color}20`, // semi-transparent background
            borderRadius: '50%',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color
        }}>
            {icon}
        </div>
        <div>
            <h4 style={{ margin: 0, color: '#666', fontSize: '14px', fontWeight: 500 }}>{title}</h4>
            <p style={{ margin: '4px 0 0 0', color: '#111', fontSize: '28px', fontWeight: 'bold' }}>{value}</p>
        </div>
    </div>
);

export const RolePerformanceReport: React.FC = () => {
    const { 
        getRoles, 
        getEmployeesByRole, 
        getEmployeePerformanceReport,
        isLoading 
    } = useDashboardApi();

    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [employees, setEmployees] = useState<EmployeeSimple[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [fechaInicio, setFechaInicio] = useState(toYYYYMMDD(new Date(new Date().setDate(new Date().getDate() - 30))));
    const [fechaFin, setFechaFin] = useState(toYYYYMMDD(new Date()));
    const [reportData, setReportData] = useState<EmployeePerformanceReport | null>(null);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const rolesData = await getRoles();
                setRoles(rolesData);
            } catch (error) {
                toast.error('No se pudieron cargar los roles.');
            }
        };
        fetchRoles();
    }, [getRoles]);

    useEffect(() => {
        if (selectedRole) {
            const fetchEmployees = async () => {
                try {
                    setEmployees([]);
                    setSelectedEmployee('');
                    setReportData(null);
                    const employeesData = await getEmployeesByRole(parseInt(selectedRole, 10));
                    setEmployees(employeesData);
                } catch (error) {
                    toast.error('No se pudieron cargar los empleados para este rol.');
                }
            };
            fetchEmployees();
        }
    }, [selectedRole, getEmployeesByRole]);

    const handleGenerateReport = useCallback(async () => {
        if (!selectedEmployee) {
            toast.error('Por favor, selecciona un empleado.');
            return;
        }
        try {
            toast.loading('Generando reporte...', { id: 'report-toast' });
            const data = await getEmployeePerformanceReport(parseInt(selectedEmployee, 10), fechaInicio, fechaFin);
            setReportData(data);
            toast.success('Reporte generado exitosamente.', { id: 'report-toast' });
        } catch (error) {
            console.error(error);
            setReportData(null);
            toast.error('Error al generar el reporte.', { id: 'report-toast' });
        }
    }, [selectedEmployee, fechaInicio, fechaFin, getEmployeePerformanceReport]);
    
    const renderPerformanceData = () => {
        if (!reportData) return null;

        const { employee, performance } = reportData;

        const isMotorizadoMetrics = (p: any): p is MotorizadoPerformanceMetrics => {
            return employee.rol === 'Motorizado' && p.totalPedidosEntregados !== undefined;
        };

        if (isMotorizadoMetrics(performance)) {
            return (
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '20px' }}>Desempeño de: <strong>{employee.nombre}</strong> ({employee.rol})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <StatCard title="Pedidos Entregados" value={performance.totalPedidosEntregados} icon={<Truck size={24} />} color="#3B82F6" />
                        <StatCard title="Ventas Totales" value={`S/ ${performance.totalVentasEntregadas.toFixed(2)}`} icon={<DollarSign size={24} />} color="#10B981" />
                        <StatCard title="Tiempo Prom. Entrega" value={`${performance.tiempoPromedioEntregaMin} min`} icon={<Clock size={24} />} color="#F59E0B" />
                    </div>
                </div>
            );
        }

        if ('message' in performance) {
             return <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>{(performance as {message: string}).message}</p>;
        }
        
        return <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>El reporte para el rol '{employee.rol}' no tiene un formato definido.</p>;
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <div style={{ 
                padding: '2rem', 
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '24px' }}>Filtros del Reporte</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <label htmlFor="role-select" style={{fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px'}}><Briefcase size={16} /> Rol</label>
                        <select id="role-select" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                            <option value="">Selecciona un rol...</option>
                            {roles.map(role => <option key={role.id} value={role.id}>{role.nombre}</option>)}
                        </select>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <label htmlFor="employee-select" style={{fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px'}}><User size={16} /> Empleado</label>
                        <select id="employee-select" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} disabled={!selectedRole || employees.length === 0} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                            <option value="">Selecciona un empleado...</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                        </select>
                    </div>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <label htmlFor="fechaInicio" style={{fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px'}}><Calendar size={16} /> Fecha Inicio</label>
                        <input type="date" id="fechaInicio" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}/>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <label htmlFor="fechaFin" style={{fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px'}}><Calendar size={16} /> Fecha Fin</label>
                        <input type="date" id="fechaFin" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}/>
                    </div>
                </div>

                <button
                    onClick={handleGenerateReport}
                    disabled={isLoading || !selectedEmployee}
                    style={{
                        width: '100%',
                        padding: '14px 15px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: (isLoading || !selectedEmployee) ? '#ccc' : '#4F46E5',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        transition: 'background-color 0.2s'
                    }}
                >
                    {isLoading ? 'Generando...' : 'Generar Reporte'}
                </button>
            </div>

            {reportData ? renderPerformanceData() : (
                 <div style={{ marginTop: '2rem', padding: '2rem', background: '#f9fafb', borderRadius: '8px', textAlign: 'center', border: '1px dashed #ddd' }}>
                    <p style={{margin: 0, color: '#666'}}>Selecciona los filtros y haz clic en "Generar Reporte" para ver los datos de desempeño.</p>
                </div>
            )}
        </div>
    );
};

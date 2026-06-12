import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Shield, UserMinus, Key, Mail, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';

export default function Admin() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER'
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to load staff list', err);
      setError('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role
        });
      } else {
        await api.post('/employees', formData);
      }
      setShowModal(false);
      setEditingEmployee(null);
      setFormData({ name: '', email: '', password: '', role: 'CASHIER' });
      fetchEmployees();
    } catch (err) {
      const serverError = err.response?.data?.error;
      const validationErrors = err.response?.data?.errors?.fieldErrors;
      
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0][0];
        alert(`Validation Error: ${firstError}`);
      } else {
        alert(serverError || 'Operation failed');
      }
    }
  };

  const toggleDeactivate = async (employee) => {
    if (confirm(`Are you sure you want to ${employee.isActive ? 'deactivate' : 'reactivate'} this employee?`)) {
      try {
        if (employee.isActive) {
          await api.patch(`/employees/${employee.id}/deactivate`);
        } else {
          await api.put(`/employees/${employee.id}`, { isActive: true });
        }
        fetchEmployees();
      } catch (err) {
        console.error('Failed to update status', err);
        alert('Failed to update status');
      }
    }
  };

  const handleResetPassword = async (employeeId) => {
    const newPassword = prompt('Enter new password (min 8 chars, 1 upper, 1 special, 1 number):');
    if (newPassword) {
      try {
        await api.post('/employees/reset-password', { employeeId, newPassword });
        alert('Password reset successfully');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to reset password');
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-12 h-12 border-4 border-[var(--color-brand-red)] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-[var(--color-text-secondary)] uppercase tracking-widest text-xs">Loading staff...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--color-border-default)]">
        <div>
          <h1 className="text-3xl font-[var(--font-display)] font-bold m-0 flex items-center gap-3">
            <Shield className="text-[var(--color-brand-red)]" size={30} />
            Staff Management
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1 m-0">
            Manage roles and permissions for your team
          </p>
        </div>
        <button 
          onClick={() => { setEditingEmployee(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 text-sm uppercase tracking-wider"
        >
          <UserPlus size={16} />
          Add Employee
        </button>
      </div>

      {error && (
        <div className="bg-[var(--color-danger-bg)] border border-[var(--color-brand-red-mid)]/20 text-[var(--color-danger)] p-4 rounded-sm">
          {error}
        </div>
      )}

      {/* Staff Table */}
      <div className="table-container bg-[var(--color-surface-card)]">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="group">
                <td>
                  <div className="font-bold text-[var(--color-text-primary)]">{emp.name}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-1 font-mono">
                    <Mail size={12} /> {emp.email}
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    emp.role === 'OWNER' ? 'badge-red' :
                    emp.role === 'STOCK_MANAGER' ? 'badge-steel' :
                    'badge-steel'
                  }`}>
                    {emp.role.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  {emp.isActive ? (
                    <span className="flex items-center gap-1.5 text-[var(--color-success)] text-xs font-bold uppercase">
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[var(--color-text-muted)] text-xs font-bold uppercase">
                      <XCircle size={14} /> Deactivated
                    </span>
                  )}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingEmployee(emp); setFormData({ ...emp, password: '' }); setShowModal(true); }}
                      className="btn-ghost"
                      title="Edit Staff Member"
                    >
                      <Users size={18} />
                    </button>
                    <button 
                      onClick={() => handleResetPassword(emp.id)}
                      className="btn-ghost"
                      title="Reset Password"
                    >
                      <Key size={18} />
                    </button>
                    <button 
                      onClick={() => toggleDeactivate(emp)}
                      className="btn-ghost hover:text-[var(--color-danger)]"
                      title={emp.isActive ? "Deactivate" : "Reactivate"}
                    >
                      <UserMinus size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] rounded-md w-full max-w-md p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 font-[var(--font-display)] uppercase m-0 text-[var(--color-text-primary)]">
              {editingEmployee ? 'Edit Staff' : 'Add New Staff'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Full Name</label>
                <input
                  required
                  className="input font-semibold"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Email Address</label>
                <input
                  required
                  type="email"
                  className="input font-semibold"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {!editingEmployee && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Initial Password</label>
                  <input
                    required
                    type="password"
                    className="input font-semibold"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">System Role</label>
                <select
                  className="input font-semibold cursor-pointer"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="CASHIER">Cashier</option>
                  <option value="STOCK_MANAGER">Stock Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4 border-t border-[var(--color-border-default)]">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1 py-3"
                >
                  {editingEmployee ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

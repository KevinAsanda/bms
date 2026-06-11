import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (err) {
      setError('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) return <div className="p-8 text-center">Loading staff...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold font-[var(--font-display)] flex items-center gap-3">
            <Shield className="text-[var(--color-primary)]" size={32} />
            Staff Management
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage roles and permissions for your team</p>
        </div>
        <button 
          onClick={() => { setEditingEmployee(null); setShowModal(true); }}
          className="bg-[var(--color-primary)] text-black font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-[var(--color-primary-dark)] transition-all text-sm uppercase tracking-wider"
        >
          <UserPlus size={16} />
          Add Employee
        </button>
      </div>

      {error && <div className="bg-[var(--color-error)]/10 text-[var(--color-error)] p-4 rounded-xl mb-6">{error}</div>}

      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Name</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Role</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold">{emp.name}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-1">
                    <Mail size={12} /> {emp.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    emp.role === 'OWNER' ? 'bg-[var(--color-role-owner)]/20 text-[var(--color-role-owner)]' :
                    emp.role === 'STOCK_MANAGER' ? 'bg-[var(--color-role-stock)]/20 text-[var(--color-role-stock)]' :
                    'bg-[var(--color-role-cashier)]/20 text-[var(--color-role-cashier)]'
                  }`}>
                    {emp.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {emp.isActive ? (
                    <span className="flex items-center gap-1.5 text-[var(--color-success)] text-xs font-bold">
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[var(--color-text-muted)] text-xs font-bold">
                      <XCircle size={14} /> Deactivated
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setEditingEmployee(emp); setFormData({ ...emp, password: '' }); setShowModal(true); }}
                      className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                      title="Edit"
                    >
                      <Users size={18} />
                    </button>
                    <button 
                      onClick={() => handleResetPassword(emp.id)}
                      className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-info)] transition-colors"
                      title="Reset Password"
                    >
                      <Key size={18} />
                    </button>
                    <button 
                      onClick={() => toggleDeactivate(emp)}
                      className={`p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors ${
                        emp.isActive ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-error)]' : 'text-[var(--color-success)]'
                      }`}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black mb-6 font-[var(--font-display)] tracking-tight">
              {editingEmployee ? 'Edit Staff' : 'Add New Staff'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Full Name</label>
                <input
                  required
                  className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] font-semibold"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] font-semibold"
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
                    className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] font-semibold"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">System Role</label>
                <select
                  className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] font-semibold appearance-none cursor-pointer"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="CASHIER">Cashier</option>
                  <option value="STOCK_MANAGER">Stock Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-[var(--color-bg-elevated)] text-white font-bold py-3.5 rounded-full hover:bg-[var(--color-bg-hover)] transition-all text-sm uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[var(--color-primary)] text-black font-extrabold py-3.5 rounded-full hover:bg-[var(--color-primary-dark)] transition-all text-sm uppercase tracking-wider shadow-md"
                >
                  {editingEmployee ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

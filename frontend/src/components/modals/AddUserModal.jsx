import { useState } from 'react';
import { Input, Btn } from '../ui';
import s from './AddUserModal.module.css';

export default function AddUserModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', roleId: '1' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = [
    { id: 1, name: 'HR' },
    { id: 2, name: 'Panel' },
    { id: 4, name: 'Global Admin' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await onSubmit(form);
    
    if (result.success) {
      setSuccess(result.emailSent 
        ? 'User created and credentials sent via email!' 
        : 'User created but email failed to send.');
      setTimeout(() => onClose(), 2000);
    } else {
      setError(result.message || 'Failed to create user');
    }
    setLoading(false);
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>Add New User</h2>
          <button onClick={onClose} className={s.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <div className={s.field}>
            <label className={s.label}>Role</label>
            <select
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              className={s.select}
              required
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          {error && <div className={s.error}>{error}</div>}
          {success && <div className={s.success}>{success}</div>}

          <div className={s.actions}>
            <button type="button" onClick={onClose} className={s.cancelBtn}>
              Cancel
            </button>
            <Btn type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

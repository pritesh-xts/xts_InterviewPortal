import { useState } from 'react';
import { Input, Btn } from '../ui';
import s from './ChangePasswordModal.module.css';

export default function ChangePasswordModal({ onClose, userId }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const API_BASE = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}api/users/changePassword.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Password changed successfully!');
        setTimeout(() => onClose(), 1500);
      } else {
        setError(result.message || 'Failed to change password');
      }
    } catch (error) {
      setError('Error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>Change Password</h2>
          <button onClick={onClose} className={s.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <Input
            label="Current Password"
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            required
          />

          <Input
            label="New Password"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />

          {error && <div className={s.error}>{error}</div>}
          {success && <div className={s.success}>{success}</div>}

          <div className={s.actions}>
            <button type="button" onClick={onClose} className={s.cancelBtn}>
              Cancel
            </button>
            <Btn type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

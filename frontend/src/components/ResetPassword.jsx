import { useState } from 'react';
import { Input, Btn } from './ui';
import s from './ResetPassword.module.css';

export default function ResetPassword({ token, onSuccess }) {
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const API_BASE = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}api/auth/resetPassword.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: form.newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => onSuccess(), 2000);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (error) {
      setError('Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.wrapper}>
      <div className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>Reset</h1>
          <h1 className={s.titleAccent}>Password</h1>
          <p className={s.subtitle}>Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <Input
            label="New Password"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />

          {error && <div className={s.error}>{error}</div>}
          {success && <div className={s.success}>{success}</div>}

          <Btn type="submit" disabled={loading} className={s.fullBtn}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Btn>
        </form>
      </div>
    </div>
  );
}

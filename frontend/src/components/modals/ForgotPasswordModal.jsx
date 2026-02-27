import { useState } from 'react';
import { Input, Btn } from '../ui';
import s from './ForgotPasswordModal.module.css';

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const API_BASE = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}api/auth/forgotPassword.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Password reset link sent to your email!');
        setTimeout(() => onClose(), 3000);
      } else {
        setError(result.message || 'Failed to send reset link');
      }
    } catch (error) {
      setError('Error sending reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>Forgot Password</h2>
          <button onClick={onClose} className={s.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <p className={s.description}>
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <div className={s.error}>{error}</div>}
          {success && <div className={s.success}>{success}</div>}

          <div className={s.actions}>
            <button type="button" onClick={onClose} className={s.cancelBtn}>
              Cancel
            </button>
            <Btn type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

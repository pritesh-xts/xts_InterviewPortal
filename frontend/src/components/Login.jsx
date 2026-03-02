import { useState } from 'react';
import { Input, Btn } from './ui';
import ForgotPasswordModal from './modals/ForgotPasswordModal';
import s from './Login.module.css';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}api/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('token', data.data.token);
        sessionStorage.setItem('user', JSON.stringify(data.data.user));
        onLogin(data.data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.wrapper}>
      <div className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>Interview</h1>
          <h1 className={s.titleAccent}>Hub</h1>
          <p className={s.subtitle}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && (
            <div className={s.error}>
              {error}
            </div>
          )}

          <Btn type="submit" disabled={loading} className={s.fullBtn}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Btn>

          <button 
            type="button" 
            onClick={() => setShowForgotPassword(true)} 
            className={s.forgotLink}
          >
            Forgot Password?
          </button>
        </form>

        {showForgotPassword && (
          <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
        )}

        {/* <div className={s.accounts}> */}
        {/* <p className={s.accountsTitle}>Test Accounts:</p> */}
        {/* <p className={s.accountRow}>HR: bjadhav@xtsworld.in / hr@123</p> */}
        {/* <p className={s.accountRow}>Panel: sjambhekar@xtsworld.com / sanket@123</p> */}
        {/* <p className={s.accountRow}>Admin: globaladmin@xtsworld.in / admin123</p> */}
        {/* </div> */}
      </div>
    </div>
  );
}

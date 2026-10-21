import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const field = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-200/50">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Welcome back 🙏</h1>
          <p className="mt-1 text-sm text-stone-500">Log in to borrow and lend tools.</p>
        </div>
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        <div>
          <label className="mb-1 block text-xs font-bold text-stone-700">Email</label>
          <input className={field} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-stone-700">Password</label>
          <input className={field} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button disabled={busy} className="w-full rounded-xl bg-emerald-800 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-900 disabled:opacity-60">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-center text-xs text-stone-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-emerald-800 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="rounded-xl bg-stone-50 px-3 py-2 text-center text-[11px] text-stone-500">
          Demo (after seeding): <strong>prabhat@example.com</strong> / <strong>password123</strong>
        </p>
      </form>
    </div>
  );
}

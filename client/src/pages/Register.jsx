import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const field = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none';
const label = 'mb-1 block text-xs font-bold text-stone-700';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', country: 'India' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/dashboard');
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
          <h1 className="text-2xl font-extrabold text-stone-900">Join ToolShare India</h1>
          <p className="mt-1 text-sm text-stone-500">Borrow from neighbours. Lend what you own.</p>
        </div>
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        <div>
          <label className={label}>Full name</label>
          <input className={field} value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className={label}>Email</label>
          <input className={field} type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label className={label}>Password (min 6 characters)</label>
          <input className={field} type="password" minLength={6} value={form.password} onChange={set('password')} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>City</label>
            <input className={field} value={form.city} onChange={set('city')} placeholder="Greater Noida" />
          </div>
          <div>
            <label className={label}>Country</label>
            <input className={field} value={form.country} onChange={set('country')} />
          </div>
        </div>
        <button disabled={busy} className="w-full rounded-xl bg-emerald-800 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-900 disabled:opacity-60">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-xs text-stone-500">
          Already a member?{' '}
          <Link to="/login" className="font-semibold text-emerald-800 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

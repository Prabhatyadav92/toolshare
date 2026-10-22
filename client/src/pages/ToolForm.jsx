import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';
import { CATEGORY_IDS, CONDITIONS } from '../constants.js';

const field = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none';
const label = 'mb-1 block text-xs font-bold text-stone-700';

export default function ToolForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Power Tools',
    condition: 'Good',
    city: user?.city || '',
    locality: '',
    country: user?.country || 'India',
    imageUrl: '',
    pricePerDay: 0,
    deposit: 0,
    instantBook: false,
    available: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingTool, setLoadingTool] = useState(editing);

  // Image preview: debounced so we don't request an image on every keystroke,
  // and failures are tracked per-URL so a bad URL doesn't hide the next valid one.
  const [previewUrl, setPreviewUrl] = useState('');
  const [failedUrl, setFailedUrl] = useState('');

  useEffect(() => {
    const url = form.imageUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setPreviewUrl('');
      return;
    }
    const t = setTimeout(() => setPreviewUrl(url), 500);
    return () => clearTimeout(t);
  }, [form.imageUrl]);

  useEffect(() => {
    if (!editing) return;
    api(`/tools/${id}`)
      .then(({ tool }) => {
        if (String(tool.owner?._id) !== String(user.id)) return navigate('/', { replace: true });
        setForm({
          name: tool.name,
          description: tool.description || '',
          category: tool.category,
          condition: tool.condition,
          city: tool.city,
          locality: tool.locality || '',
          country: tool.country || 'India',
          imageUrl: tool.imageUrl || '',
          pricePerDay: tool.pricePerDay,
          deposit: tool.deposit,
          instantBook: tool.instantBook,
          available: tool.available,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingTool(false));
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { ...form, pricePerDay: Number(form.pricePerDay) || 0, deposit: Number(form.deposit) || 0 };
      const d = editing ? await api(`/tools/${id}`, { method: 'PUT', body }) : await api('/tools', { method: 'POST', body });
      toast(editing ? 'Changes saved' : '🎉 Your tool is now listed for your neighbours!');
      navigate(`/tools/${d.tool._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingTool) return <p className="py-20 text-center text-stone-500">Loading…</p>;

  const previewFailed = previewUrl && failedUrl === previewUrl;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/50 sm:p-8">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">{editing ? 'Edit your tool' : 'Share a tool with neighbours'}</h1>
          <p className="mt-1 text-sm text-stone-500">Put idle tools to good use and help nearby projects.</p>
        </div>

        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

        <div>
          <label className={label}>Tool title *</label>
          <input className={field} value={form.name} onChange={set('name')} required maxLength={90} placeholder="e.g. Bosch Cordless Drill 18V" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Category</label>
            <select className={field} value={form.category} onChange={set('category')}>
              {CATEGORY_IDS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Condition</label>
            <select className={field} value={form.condition} onChange={set('condition')}>
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>City *</label>
            <input className={field} value={form.city} onChange={set('city')} required maxLength={60} placeholder="e.g. Greater Noida" />
          </div>
          <div>
            <label className={label}>Area / sector / society</label>
            <input className={field} value={form.locality} onChange={set('locality')} placeholder="e.g. Alpha 1, Sector 62" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Borrow fee per day (₹)</label>
            <input className={field} type="number" min="0" value={form.pricePerDay} onChange={set('pricePerDay')} />
            <span className="text-[11px] text-stone-400">Set 0 to lend for free</span>
          </div>
          <div>
            <label className={label}>Refundable deposit (₹)</label>
            <input className={field} type="number" min="0" value={form.deposit} onChange={set('deposit')} />
          </div>
        </div>

        <div>
          <label className={label}>Description and accessories</label>
          <textarea
            className={field}
            rows={4}
            maxLength={1000}
            value={form.description}
            onChange={set('description')}
            placeholder="What's included (bits, batteries, charger) and any usage tips"
          />
        </div>

        <div>
          <label className={label}>Image URL (optional)</label>
          <input className={field} type="url" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" />
          {previewUrl && !previewFailed && (
            <img
              src={previewUrl}
              alt="Preview"
              onError={() => setFailedUrl(previewUrl)}
              className="mt-2 h-28 w-44 rounded-xl border border-stone-200 object-cover"
            />
          )}
          {previewFailed && <p className="mt-2 text-xs text-rose-700">Couldn't load this image. Check the URL.</p>}
        </div>

        <div className="space-y-2 rounded-xl border border-stone-200/60 bg-stone-50/70 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
            <input type="checkbox" className="h-4 w-4 accent-emerald-700" checked={form.instantBook} onChange={set('instantBook')} />
            Instant book: auto-approve requests when the dates are free
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
            <input type="checkbox" className="h-4 w-4 accent-emerald-700" checked={form.available} onChange={set('available')} />
            Available to borrow
          </label>
        </div>

        <button
          disabled={saving}
          className="w-full rounded-xl bg-emerald-800 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish tool'}
        </button>
      </form>
    </div>
  );
}
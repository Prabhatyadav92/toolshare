import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Calendar, Info, CheckCircle2, Sparkles } from 'lucide-react';
import { api, inr, todayISO } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { ToolImage } from './ToolCard.jsx';

const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function BorrowModal({ tool, onClose, onDone }) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(addDays(todayISO(), 1));
  const [message, setMessage] = useState('');
  const [pickupWindow, setPickupWindow] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const days = useMemo(() => {
    const ms = new Date(endDate) - new Date(startDate);
    return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 86400000) + 1 : 0;
  }, [startDate, endDate]);

  const rental = days * (tool.pricePerDay || 0);
  const owner = tool.owner?.name || 'the owner';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (days < 1) return setError('Return date must be on or after the pick-up date');
    setBusy(true);
    try {
      const d = await api('/bookings', { method: 'POST', body: { toolId: tool._id, startDate, endDate, message, pickupWindow } });
      onDone(d.booking, tool);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        className="modal-in max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-stone-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-xl border border-stone-200">
              <ToolImage tool={tool} emojiSize="text-xl" />
            </div>
            <div>
              <h3 className="text-sm leading-tight font-bold text-stone-900">{tool.name}</h3>
              <p className="text-xs text-stone-500">
                Lent by {owner} • {tool.locality ? `${tool.locality}, ` : ''}
                {tool.city}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!user ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-stone-900">Log in to borrow this tool</p>
            <p className="mt-1 text-sm text-stone-500">It only takes a minute to create an account.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Link to="/login" className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
                Log in
              </Link>
              <Link to="/register" className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50">
                Sign up
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="space-y-4 p-6 text-sm">
              {tool.instantBook && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Instant book: confirmed immediately if your dates are free.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-700">Pick-up date</label>
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                    <Calendar className="h-4 w-4 text-emerald-700" />
                    <input
                      type="date"
                      min={todayISO()}
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value > endDate) setEndDate(e.target.value);
                      }}
                      required
                      className="w-full bg-transparent text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-700">Return date</label>
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                    <Calendar className="h-4 w-4 text-emerald-700" />
                    <input
                      type="date"
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full bg-transparent text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">Preferred pick-up time (optional)</label>
                <input
                  maxLength={60}
                  value={pickupWindow}
                  onChange={(e) => setPickupWindow(e.target.value)}
                  placeholder="e.g. Evening after 6 PM"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">Message to {owner}</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What will you use it for? When can you pick it up?"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>
                    Lending fee ({days || 0} day{days === 1 ? '' : 's'} × {tool.pricePerDay === 0 ? 'free' : inr(tool.pricePerDay)})
                  </span>
                  <span>{rental === 0 ? 'Free' : inr(rental)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span className="flex items-center gap-1">
                    Refundable deposit <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  </span>
                  <span className="font-medium">{tool.deposit ? `${inr(tool.deposit)} (paid to the lender directly)` : 'None'}</span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-bold text-stone-900">
                  <span>Lending fee total</span>
                  <span className="text-emerald-800">{rental === 0 ? 'Free' : inr(rental)}</span>
                </div>
                <p className="flex items-start gap-1 pt-1 text-[11px] text-stone-500">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  ToolShare doesn't process payments. Fee and deposit are settled between you and the lender at pick-up.
                </p>
              </div>

              {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-stone-100 bg-stone-50/70 p-4">
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-200/60">
                Cancel
              </button>
              <button
                disabled={busy}
                className="rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-emerald-900 active:scale-95 disabled:opacity-60"
              >
                {busy ? 'Sending…' : tool.instantBook ? 'Book now' : 'Send borrow request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

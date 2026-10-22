import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate, inr } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-stone-200 text-stone-700',
  returned: 'bg-sky-100 text-sky-800',
};

const Badge = ({ status, children }) => (
  <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${STATUS_STYLE[status] || 'bg-stone-100 text-stone-700'}`}>
    {children || status}
  </span>
);

const btn = 'rounded-lg px-3 py-1.5 text-xs font-semibold transition';

function ReviewForm({ booking, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api(`/bookings/${booking._id}/review`, { method: 'POST', body: { rating, comment } });
      onDone();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <form className="mt-2 flex flex-wrap gap-2" onSubmit={submit}>
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs">
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} ★
          </option>
        ))}
      </select>
      <input
        placeholder="How was it? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-w-40 flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs"
      />
      <button className={`${btn} bg-stone-900 text-white hover:bg-emerald-800`}>Submit review</button>
      {err && <span className="w-full text-xs text-rose-700">{err}</span>}
    </form>
  );
}

function Empty({ children }) {
  return <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">{children}</div>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('requests');
  const [tools, setTools] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [mine, setMine] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([api('/tools/mine/list'), api('/bookings/incoming'), api('/bookings/mine')])
      .then(([t, i, m]) => {
        setTools(t.tools);
        setIncoming(i.bookings);
        setMine(m.bookings);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (id, status, okMsg, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try {
      await api(`/bookings/${id}/status`, { method: 'PATCH', body: { status } });
      toast(okMsg);
      load();
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const toggleAvailable = async (tool) => {
    try {
      await api(`/tools/${tool._id}`, { method: 'PUT', body: { available: !tool.available } });
      toast(tool.available ? 'Listing paused' : 'Listing is live again');
      load();
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const pendingCount = incoming.filter((b) => b.status === 'pending').length;
  const tabCls = (t) =>
    `border-b-[3px] px-4 py-2.5 text-sm font-semibold transition ${tab === t ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Namaste, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-sm text-stone-500">Manage your tools, requests and borrowings.</p>
        </div>
        <Link to="/tools/new" className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-900">
          + Lend a tool
        </Link>
      </div>

      {error && <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

      <div className="mt-8 flex flex-wrap gap-1 border-b border-stone-200">
        <button className={tabCls('requests')} onClick={() => setTab('requests')}>
          Requests for my tools
          {pendingCount > 0 && <span className="ml-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">{pendingCount}</span>}
        </button>
        <button className={tabCls('borrowing')} onClick={() => setTab('borrowing')}>
          My borrowings ({mine.length})
        </button>
        <button className={tabCls('tools')} onClick={() => setTab('tools')}>
          My tools ({tools.length})
        </button>
      </div>

      {loading && <p className="mt-6 text-stone-500">Loading…</p>}

      <div className="mt-6 space-y-3">
        {tab === 'requests' && (
          <>
            {!loading && incoming.length === 0 && <Empty>No requests yet. Once neighbours request your tools they will appear here.</Empty>}
            {incoming.map((b) => (
              <div key={b._id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4">
                <div className="min-w-0">
                  <div className="flex items-center">
                    <strong className="text-stone-900">{b.tool?.name || 'Deleted tool'}</strong>
                    <Badge status={b.status} />
                    {b.instant && <span className="ml-2 text-[10px] font-bold text-amber-600 uppercase">instant</span>}
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {fmtDate(b.startDate)} → {fmtDate(b.endDate)} ({b.days} day{b.days === 1 ? '' : 's'}) • {b.rentalCost ? inr(b.rentalCost) : 'Free'}
                  </p>
                  <p className="text-xs text-stone-500">
                    From {b.borrower?.name} ({b.borrower?.email})
                  </p>
                  {b.pickupWindow && <p className="mt-1 text-xs text-stone-500">Pick-up: {b.pickupWindow}</p>}
                  {b.message && <p className="mt-1 text-xs text-stone-500 italic">“{b.message}”</p>}
                  {b.review?.rating && (
                    <p className="mt-1 text-xs text-stone-600">
                      Review: {'★'.repeat(b.review.rating)} {b.review.comment}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {b.status === 'pending' && (
                    <>
                      <button className={`${btn} bg-emerald-700 text-white hover:bg-emerald-800`} onClick={() => changeStatus(b._id, 'approved', 'Request approved')}>
                        Approve
                      </button>
                      <button className={`${btn} border border-rose-300 text-rose-700 hover:bg-rose-50`} onClick={() => changeStatus(b._id, 'declined', 'Request declined', 'Decline this request?')}>
                        Decline
                      </button>
                    </>
                  )}
                  {b.status === 'approved' && (
                    <button className={`${btn} border border-stone-300 text-stone-800 hover:bg-stone-50`} onClick={() => changeStatus(b._id, 'returned', 'Marked as returned', 'Mark this tool as returned? Borrower will then be able to review it.')}>
                      Mark returned
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'borrowing' && (
          <>
            {!loading && mine.length === 0 && (
              <Empty>
                You haven’t borrowed anything yet.{' '}
                <Link to="/" className="font-semibold text-emerald-800 hover:underline">
                  Browse tools
                </Link>
              </Empty>
            )}
            {mine.map((b) => (
              <div key={b._id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4">
                <div className="min-w-0">
                  <div className="flex items-center">
                    {b.tool ? (
                      <Link to={`/tools/${b.tool._id}`} className="font-bold text-stone-900 hover:text-emerald-800">
                        {b.tool.name}
                      </Link>
                    ) : (
                      <strong>Deleted tool</strong>
                    )}
                    <Badge status={b.status} />
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {fmtDate(b.startDate)} → {fmtDate(b.endDate)} ({b.days} day{b.days === 1 ? '' : 's'}) • {b.rentalCost ? inr(b.rentalCost) : 'Free'}
                    {b.deposit ? ` • deposit ${inr(b.deposit)}` : ''}
                  </p>
                  <p className="text-xs text-stone-500">
                    Owner: {b.owner?.name} ({b.owner?.email})
                  </p>
                  {b.pickupWindow && <p className="text-xs text-stone-500">Pick-up: {b.pickupWindow}</p>}
                  {b.status === 'returned' && !b.review?.rating && <ReviewForm booking={b} onDone={load} />}
                  {b.review?.rating && (
                    <p className="mt-1 text-xs text-stone-600">
                      Your review: {'★'.repeat(b.review.rating)} {b.review.comment}
                    </p>
                  )}
                </div>
                {(b.status === 'pending' || b.status === 'approved') && (
                  <button className={`${btn} border border-rose-300 text-rose-700 hover:bg-rose-50`} onClick={() => changeStatus(b._id, 'cancelled', 'Booking cancelled', 'Cancel this booking?')}>
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'tools' && (
          <>
            {!loading && tools.length === 0 && (
              <Empty>
                You haven’t listed a tool yet.{' '}
                <Link to="/tools/new" className="font-semibold text-emerald-800 hover:underline">
                  Lend your first tool
                </Link>
              </Empty>
            )}
            {tools.map((t) => (
              <div key={t._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4">
                <div>
                  <div className="flex items-center">
                    <Link to={`/tools/${t._id}`} className="font-bold text-stone-900 hover:text-emerald-800">
                      {t.name}
                    </Link>
                    <Badge status={t.available ? 'approved' : 'declined'}>{t.available ? 'live' : 'paused'}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {t.category} • {t.locality ? `${t.locality}, ` : ''}
                    {t.city} • {t.pricePerDay ? `${inr(t.pricePerDay)}/day` : 'Free'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className={`${btn} border border-stone-300 text-stone-800 hover:bg-stone-50`} onClick={() => toggleAvailable(t)}>
                    {t.available ? 'Pause' : 'Resume'}
                  </button>
                  <Link to={`/tools/${t._id}/edit`} className={`${btn} bg-stone-900 text-white hover:bg-emerald-800`}>
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

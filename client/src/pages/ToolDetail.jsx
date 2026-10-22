import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Pencil, Trash2, Sparkles, Heart, ShieldCheck, Calendar } from 'lucide-react';
import { api, fmtDate, inr, initials } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';
import { useFavorites } from '../useFavorites.js';
import { Stars, ToolImage } from '../components/ToolCard.jsx';
import BorrowModal from '../components/BorrowModal.jsx';

export default function ToolDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { favs, toggle } = useFavorites();

  const [tool, setTool] = useState(null);
  const [booked, setBooked] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [borrowing, setBorrowing] = useState(false);

  const load = () =>
    Promise.all([api(`/tools/${id}`), api(`/tools/${id}/availability`), api(`/tools/${id}/reviews`)])
      .then(([t, a, r]) => {
        setTool(t.tool);
        setBooked(a.booked);
        setReviews(r.reviews);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    setTool(null);
    setError('');
    load();
  }, [id]);

  useEffect(() => {
    if (tool) document.title = `${tool.name} – ToolShare India`;
    return () => {
      document.title = 'ToolShare India – Borrow tools from your neighbours';
    };
  }, [tool]);

  const remove = async () => {
    if (!window.confirm('Delete this tool permanently?')) return;
    try {
      await api(`/tools/${id}`, { method: 'DELETE' });
      toast('Tool deleted');
      navigate('/dashboard');
    } catch (err) {
      toast(err.message, 'err');
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-rose-700">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-emerald-800 hover:underline">
          ← Back to all tools
        </Link>
      </div>
    );
  }
  if (!tool) return <p className="py-20 text-center text-stone-500">Loading…</p>;

  const isOwner = user && tool.owner && String(tool.owner._id) === String(user.id);
  const isFav = favs.includes(tool._id);
  const memberYear = tool.owner?.createdAt ? new Date(tool.owner.createdAt).getFullYear() : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-emerald-800">
        <ArrowLeft className="h-4 w-4" /> Back to all tools
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-stone-200 bg-stone-100">
            <ToolImage tool={tool} emojiSize="text-8xl" />
          </div>

          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">
                {tool.category} • {tool.condition}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">{tool.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-600">
                <MapPin className="h-4 w-4 text-emerald-700" />
                {tool.locality ? `${tool.locality}, ` : ''}
                {tool.city}
                {tool.country ? `, ${tool.country}` : ''}
              </p>
              <div className="mt-2">
                <Stars avg={tool.ratingAvg} count={tool.ratingCount} />
              </div>
            </div>
            <button
              onClick={() => {
                toggle(tool._id);
                toast(isFav ? 'Removed from saved tools' : 'Saved to your wishlist');
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-xs transition hover:text-rose-600"
              title="Save"
            >
              <Heart className={`h-5 w-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          <p className="mt-5 leading-relaxed text-stone-700">{tool.description || 'No description provided.'}</p>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900">
              {initials(tool.owner?.name)}
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">Shared by {tool.owner?.name || 'a neighbour'}</div>
              <div className="text-xs text-stone-500">
                {tool.owner?.city}
                {memberYear ? ` • Member since ${memberYear}` : ''}
              </div>
            </div>
          </div>

          <h2 className="mt-10 text-lg font-bold text-stone-900">Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">No reviews yet. Borrowers can review after the tool is returned.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-stone-900">{r.borrower}</strong>
                    <Stars avg={r.rating} count={1} />
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-stone-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-2">
          <div className="sticky top-28 space-y-5">
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/50">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black text-stone-900">{tool.pricePerDay === 0 ? 'Free' : inr(tool.pricePerDay)}</div>
                  {tool.pricePerDay > 0 && <div className="text-xs text-stone-500">per day</div>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase">Refundable deposit</div>
                  <div className="text-sm font-bold text-stone-800">{tool.deposit ? inr(tool.deposit) : 'None'}</div>
                </div>
              </div>

              {tool.instantBook && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Instant book: no waiting for approval
                </div>
              )}

              {isOwner ? (
                <div className="mt-5 flex gap-3">
                  <Link to={`/tools/${tool._id}/edit`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                  <button onClick={remove} className="flex items-center justify-center gap-2 rounded-xl border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setBorrowing(true)}
                  disabled={!tool.available}
                  className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    tool.available ? 'bg-stone-900 text-white shadow-md hover:bg-emerald-800' : 'cursor-not-allowed bg-stone-100 text-stone-400'
                  }`}
                >
                  {tool.available ? (tool.instantBook ? 'Book instantly' : 'Request to borrow') : 'Currently unavailable'}
                </button>
              )}

              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-stone-500">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                Fee and deposit are settled directly with the lender at pick-up.
              </p>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900">
                <Calendar className="h-4 w-4 text-emerald-700" /> Already booked
              </h2>
              {booked.length === 0 ? (
                <p className="mt-2 text-xs text-stone-500">No approved bookings yet. All dates are open.</p>
              ) : (
                <ul className="mt-3 space-y-1.5 text-sm text-stone-700">
                  {booked.map((b) => (
                    <li key={b._id} className="rounded-lg bg-stone-50 px-3 py-1.5">
                      {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      {borrowing && (
        <BorrowModal
          tool={tool}
          onClose={() => setBorrowing(false)}
          onDone={(booking) => {
            setBorrowing(false);
            toast(booking.status === 'approved' ? 'Booked! See it on your dashboard.' : 'Request sent! The owner will review it.');
            load();
          }}
        />
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Clock, Sparkles, X, Layers, Navigation, Wrench, Zap, Hammer, Leaf, UtensilsCrossed,
  Ruler, Tent, Heart, ShieldCheck, UserCheck, Star, PlusCircle, Handshake, Calendar,
} from 'lucide-react';
import { api, useStats } from '../api.js';
import { BUILDER } from '../constants.js';
import { useFavorites } from '../useFavorites.js';
import { useToast } from '../ToastContext.jsx';
import ToolCard from '../components/ToolCard.jsx';
import BorrowModal from '../components/BorrowModal.jsx';

const CATEGORIES = [
  { id: 'all', name: 'All Tools', icon: Wrench },
  { id: 'Power Tools', name: 'Power Tools', icon: Zap },
  { id: 'Hand Tools', name: 'Hand Tools', icon: Hammer },
  { id: 'Gardening', name: 'Gardening', icon: Leaf },
  { id: 'Home & Cleaning', name: 'Home & Cleaning', icon: Sparkles },
  { id: 'Kitchen', name: 'Kitchen', icon: UtensilsCrossed },
  { id: 'Ladders', name: 'Ladders', icon: Ruler },
  { id: 'Outdoor', name: 'Outdoor & Travel', icon: Tent },
];

const QUICK = ['Drill', 'Ladder', 'Pressure Washer', 'Mixer', 'Tent'];

const hash = (s) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};
const pinPos = (key) => ({ left: `${12 + (hash(key) % 76)}%`, top: `${18 + ((hash(key + 'y') >> 3) % 64)}%` });

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 select-none">
      <span className="relative inline-flex items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-5 w-9 rounded-full bg-stone-300 transition-colors peer-checked:bg-emerald-700 peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:border-white" />
      </span>
      <span className="text-xs font-semibold text-stone-700">{label}</span>
    </label>
  );
}

export default function Home() {
  const stats = useStats();
  const toast = useToast();
  const { favs, toggle } = useFavorites();

  const [filters, setFilters] = useState({ q: '', city: '', category: 'all', available: false, free: false });
  const [showSaved, setShowSaved] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [pin, setPin] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [borrowing, setBorrowing] = useState(null);

  useEffect(() => {
    let ignore = false; // set when filters change/unmount so an older, slower response can't overwrite newer results
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      if (filters.q) p.set('q', filters.q);
      if (filters.city) p.set('city', filters.city);
      if (filters.category !== 'all') p.set('category', filters.category);
      if (filters.available) p.set('available', 'true');
      if (filters.free) p.set('free', 'true');
      setLoading(true);
      api('/tools?' + p.toString())
        .then((d) => {
          if (ignore) return;
          setTools(d.tools);
          setError('');
        })
        .catch((e) => {
          if (!ignore) setError(e.message);
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }, 250);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [filters]);

  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));

  const visible = useMemo(() => (showSaved ? tools.filter((t) => favs.includes(t._id)) : tools), [tools, showSaved, favs]);

  const pins = useMemo(() => {
    // Map (not a plain object): locality is user-supplied, and keys like "constructor" or "__proto__" would crash a plain {}
    const groups = new Map();
    visible.forEach((t) => {
      const key = t.locality || t.city;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(t);
    });
    return [...groups.entries()];
  }, [visible]);

  const onToggleFav = (id) => {
    toggle(id);
    toast(favs.includes(id) ? 'Removed from saved tools' : 'Saved to your wishlist');
  };

  const onBorrowDone = (booking, tool) => {
    setBorrowing(null);
    toast(
      booking.status === 'approved'
        ? `Booked! ${tool.name} is yours for ${booking.days} day${booking.days === 1 ? '' : 's'}.`
        : `Request sent to ${tool.owner?.name || 'the owner'}. Track it on your dashboard.`
    );
  };

  const resetAll = () => {
    setFilters({ q: '', city: '', category: 'all', available: false, free: false });
    setShowSaved(false);
  };

  const gridOf = (list) => (
    <div className="my-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((t) => (
        <ToolCard key={t._id} tool={t} isFav={favs.includes(t._id)} onToggleFav={onToggleFav} onBorrow={setBorrowing} />
      ))}
    </div>
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EFF6F2] via-[#F7FAF8] to-[#FDFBF7] pt-10 pb-16 lg:pt-14 lg:pb-24">
        <div className="pointer-events-none absolute top-10 left-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute top-40 right-10 -z-10 h-80 w-80 rounded-full bg-orange-100/70 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
              <span>Built for Indian neighbourhoods and housing societies</span>
            </div>

            <h1 className="text-4xl leading-[1.12] font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Why buy a drill you’ll{' '}
              <span className="underline decoration-emerald-500/70 decoration-wavy decoration-2">use once</span>?
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-stone-600 sm:text-xl">
              Borrow drills, ladders, mixers and more from neighbours in your city. Save money, declutter your store room and
              meet the people next door. Padosi se maango, padosi ko do.
            </p>

            <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3 text-left">
              {[
                { v: stats?.tools, l: 'Tools listed', c: 'text-emerald-800' },
                { v: stats?.members, l: 'Neighbours joined', c: 'text-stone-900' },
                { v: stats?.cities, l: 'Cities covered', c: 'text-orange-700' },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-stone-200/70 bg-white/80 p-3.5 shadow-xs backdrop-blur-xs">
                  <div className={`text-2xl font-black ${s.c}`}>{s.v ?? '–'}</div>
                  <div className="text-xs font-medium text-stone-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Search card */}
          <div className="mx-auto max-w-5xl rounded-3xl border border-stone-200/90 bg-white p-4 shadow-xl shadow-stone-200/60 sm:p-6">
            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
              <div className="relative md:col-span-5">
                <label className="mb-1 block text-[11px] font-bold tracking-wider text-stone-600 uppercase">What do you need to fix or build?</label>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-stone-600" />
                  <input
                    type="text"
                    value={filters.q}
                    onChange={(e) => set('q')(e.target.value)}
                    placeholder="Search tools (drill, ladder, mixer…)"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pr-9 pl-11 text-sm font-medium text-stone-900 transition placeholder:text-stone-500 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  {filters.q && (
                    <button onClick={() => set('q')('')} className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="mb-1 block text-[11px] font-bold tracking-wider text-stone-600 uppercase">Your city or area</label>
                <div className="relative">
                  <MapPin className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-emerald-700" />
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => set('city')(e.target.value)}
                    placeholder="e.g. Greater Noida, Pune, Koramangala"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pr-4 pl-10 text-sm font-medium text-stone-900 transition placeholder:text-stone-500 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-row justify-between gap-2 rounded-xl border border-stone-200/60 bg-stone-50/70 p-2.5 md:col-span-3 md:flex-col md:items-end md:justify-center">
                <Toggle checked={filters.available} onChange={set('available')} label="Available now" />
                <Toggle checked={filters.free} onChange={set('free')} label="Free to borrow" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
              <span className="mr-1 flex items-center gap-1 text-xs font-semibold text-stone-600">
                <Clock className="h-3.5 w-3.5" /> Try searching:
              </span>
              {QUICK.map((tag) => (
                <button
                  key={tag}
                  onClick={() => set('q')(tag)}
                  className={`rounded-lg border px-3 py-1 text-xs transition ${
                    filters.q === tag
                      ? 'border-emerald-300 bg-emerald-100 font-semibold text-emerald-900'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {(filters.q || filters.city) && (
                <button onClick={() => setFilters((f) => ({ ...f, q: '', city: '' }))} className="ml-auto text-xs font-medium text-rose-600 hover:underline">
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Browse */}
      <section id="browse" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = filters.category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => set('category')(cat.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
                    active ? 'bg-stone-900 text-white shadow-md' : 'border border-stone-200/80 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-stone-600'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowSaved((s) => !s)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
                showSaved ? 'bg-rose-600 text-white shadow-md' : 'border border-stone-200/80 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Heart className={`h-4 w-4 ${showSaved ? 'fill-white' : 'text-rose-500'}`} />
              Saved ({favs.length})
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="text-sm font-medium text-stone-500">
              Showing <strong className="font-bold text-stone-900">{visible.length}</strong> tools
            </span>
            <div className="flex items-center rounded-xl border border-stone-200 bg-stone-100 p-1">
              {[
                { id: 'grid', label: 'Grid', icon: Layers },
                { id: 'map', label: 'Neighbourhood Map', icon: Navigation },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setViewMode(m.id);
                    setPin(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === m.id ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <m.icon className="h-3.5 w-3.5" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

        {loading ? (
          <p className="py-16 text-center text-stone-500">Loading tools…</p>
        ) : visible.length === 0 ? (
          <div className="my-8 rounded-3xl border border-stone-200 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">No matching tools found</h3>
            <p className="mx-auto mt-1 mb-6 max-w-md text-sm text-stone-500">
              Try a different keyword or city, browse other categories, or be the first in your area to lend one.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={resetAll} className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800">
                Reset all filters
              </button>
              <Link to="/tools/new" className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50">
                Lend a tool
              </Link>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <div className="my-8">
            <div className="relative flex min-h-[460px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 p-6 shadow-lg">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-40 [background-size:16px_16px]" />
              <div className="relative h-[400px] w-full max-w-4xl overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#E8EDE8] shadow-inner">
                <svg className="absolute inset-0 h-full w-full stroke-emerald-800/15" fill="none" preserveAspectRatio="none" viewBox="0 0 1200 450">
                  <path d="M0,120 Q300,90 600,200 T1200,250" strokeWidth="24" strokeLinecap="round" />
                  <path d="M250,0 Q260,250 450,450" strokeWidth="16" />
                  <path d="M600,0 C650,200 700,300 900,450" strokeWidth="12" />
                </svg>
                {pins.map(([key, list]) => (
                  <button
                    key={key}
                    style={pinPos(key)}
                    onClick={() => setPin(key)}
                    className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <div
                      className={`flex items-center gap-1.5 rounded-full border-2 border-white px-3 py-1.5 text-xs font-bold text-white shadow-xl transition-transform group-hover:scale-110 ${
                        pin === key ? 'bg-emerald-700' : 'bg-stone-900'
                      }`}
                    >
                      <Wrench className="h-3 w-3 text-emerald-400" />
                      <span>{key}</span>
                      <span className="rounded-full bg-white/20 px-1.5">{list.length}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="relative mt-4 text-xs font-medium text-stone-500">
                Illustrated map: pins are grouped by locality (not GPS). Click a pin to see the tools there.
              </p>
            </div>
            {pin ? (
              <>
                <h3 className="mt-8 text-lg font-bold text-stone-900">Tools in {pin}</h3>
                {gridOf(pins.find(([k]) => k === pin)?.[1] || [])}
              </>
            ) : (
              <p className="mt-6 text-center text-sm text-stone-500">Pick a locality pin above to see what neighbours are lending.</p>
            )}
          </div>
        ) : (
          gridOf(visible)
        )}
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">How ToolShare works</h2>
          <p className="mt-2 text-stone-600">Three simple steps, no middlemen.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: PlusCircle, t: '1. List what you own', d: 'That drill in your almirah or the ladder in the store room? Add it in a minute with a price (or free) and a refundable deposit.' },
            { icon: Calendar, t: '2. Request dates', d: 'Neighbours pick pick-up and return dates. Approved dates are blocked, so there is no double booking.' },
            { icon: Handshake, t: '3. Meet, borrow, review', d: 'Hand over in person, mark it returned, and leave a rating so the next neighbour can trust the listing.' },
          ].map((s) => (
            <div key={s.t} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-stone-900">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-950 p-8 text-white shadow-2xl sm:p-12">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-800/80 px-3 py-1 text-xs font-semibold text-emerald-200">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Built for trust between neighbours</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Borrow and lend with confidence.</h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-300 sm:text-base">
              Every request goes to the lender, dates can’t be double-booked, and every return can be reviewed. Fees and deposits are settled
              directly between neighbours at hand-over.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { icon: UserCheck, t: 'Lender approval', d: 'You decide who borrows your tools (or switch on instant book).' },
                { icon: Calendar, t: 'No double booking', d: 'Approved dates are blocked automatically.' },
                { icon: Star, t: 'Ratings and reviews', d: 'Borrowers rate every return, building trust over time.' },
              ].map((x) => (
                <div key={x.t} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-800">
                    <x.icon className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{x.t}</div>
                    <div className="mt-0.5 text-xs text-stone-300">{x.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-xs md:flex-row md:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-black text-orange-800">PY</div>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-wider text-orange-700 uppercase">🇮🇳 Built in India</p>
            <h2 className="mt-1 text-xl font-extrabold text-stone-900">Made by {BUILDER.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
              ToolShare is a full-stack MERN project (MongoDB, Express, React, Node) by {BUILDER.name}, a {BUILDER.role} student at {BUILDER.college}. It
              started from a simple question: why does every flat in a society own a drill that gets used twice a year?
            </p>
          </div>
          <div className="flex gap-3">
            <a href={BUILDER.github} target="_blank" rel="noreferrer" className="rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800">
              GitHub ↗
            </a>
            <a href={BUILDER.linkedin} target="_blank" rel="noreferrer" className="rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50">
              LinkedIn ↗
            </a>
          </div>
        </div>
      </section>

      {borrowing && <BorrowModal tool={borrowing} onClose={() => setBorrowing(null)} onDone={onBorrowDone} />}
    </>
  );
}

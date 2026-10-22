import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Navigation, Sparkles, ArrowRight, MapPin } from 'lucide-react';
import { CATEGORY_EMOJI } from '../constants.js';
import { inr, initials } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export function Stars({ avg, count, className = '' }) {
  if (!count) return <span className={`text-xs font-medium text-stone-500 ${className}`}>New listing</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${className}`}>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {avg} <span className="font-normal text-stone-500">({count})</span>
    </span>
  );
}

export function ToolImage({ tool, className = '', emojiSize = 'text-5xl' }) {
  const [broken, setBroken] = useState(false);
  if (tool.imageUrl && !broken) {
    return <img src={tool.imageUrl} alt={tool.name} onError={() => setBroken(true)} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-stone-100 ${emojiSize}`}>
      {CATEGORY_EMOJI[tool.category] || '🧰'}
    </div>
  );
}

export function PriceTag({ tool }) {
  return tool.pricePerDay === 0 ? 'Free to Borrow' : `${inr(tool.pricePerDay)}/day`;
}

export default function ToolCard({ tool, isFav, onToggleFav, onBorrow }) {
  const { user } = useAuth();
  const owner = tool.owner;
  const isOwner = Boolean(user && owner && String(owner._id) === String(user.id));
  const memberYear = owner?.createdAt ? new Date(owner.createdAt).getFullYear() : null;

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/80 bg-white transition-all duration-300 hover:border-emerald-700/40 hover:shadow-xl hover:shadow-emerald-950/5">
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
          <Link to={`/tools/${tool._id}`} className="block h-full w-full">
            <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
              <ToolImage tool={tool} />
            </div>
          </Link>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

          <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold tracking-tight text-white shadow-sm backdrop-blur-md ${
                  tool.pricePerDay === 0 ? 'bg-emerald-600/95' : 'bg-orange-600/95'
                }`}
              >
                <PriceTag tool={tool} />
              </span>
              {tool.instantBook && (
                <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold tracking-wider text-stone-800 uppercase shadow-sm backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Instant
                </span>
              )}
            </div>
            <button
              onClick={() => onToggleFav(tool._id)}
              aria-label={isFav ? 'Remove from saved' : 'Save for later'}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md backdrop-blur-md transition-all hover:bg-white hover:text-rose-600 active:scale-90"
              title={isFav ? 'Remove from saved' : 'Save for later'}
            >
              <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between text-xs text-white">
            <span className="rounded-md border border-white/20 bg-stone-900/70 px-2 py-0.5 text-[11px] font-medium backdrop-blur-md">
              {tool.condition}
            </span>
            <div className="rounded-md border border-white/20 bg-stone-900/70 px-2 py-0.5 backdrop-blur-md">
              {tool.ratingCount ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {tool.ratingAvg} <span className="font-normal text-stone-300">({tool.ratingCount})</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium">New</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-stone-500">
            <span className="truncate text-[10px] font-semibold tracking-wider text-emerald-800 uppercase">{tool.category}</span>
            <span className="flex shrink-0 items-center gap-1 text-stone-600">
              <MapPin className="h-3 w-3 text-emerald-700" />
              {tool.locality ? `${tool.locality}, ` : ''}
              {tool.city}
            </span>
          </div>

          <Link to={`/tools/${tool._id}`}>
            <h3 className="line-clamp-1 text-lg leading-snug font-bold text-stone-900 transition-colors group-hover:text-emerald-800">{tool.name}</h3>
          </Link>
          <p className="mt-2 line-clamp-2 min-h-8 text-xs leading-relaxed text-stone-600">{tool.description || 'No description yet.'}</p>

          <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-900 ring-2 ring-stone-100">
                {initials(owner?.name)}
              </div>
              <div>
                <div className="text-xs leading-tight font-bold text-stone-900">{owner?.name || 'Neighbour'}</div>
                <div className="text-[10px] text-stone-500">{memberYear ? `Member since ${memberYear}` : 'Neighbour'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase">Deposit</div>
              <div className="text-xs font-bold text-stone-700">{tool.deposit ? `${inr(tool.deposit)} refundable` : 'None'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 pt-0">
        {isOwner ? (
          <Link
            to={`/tools/${tool._id}/edit`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            This is your tool • Edit
          </Link>
        ) : (
        <button
          onClick={() => onBorrow(tool)}
          disabled={!tool.available}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            tool.available ? 'bg-stone-900 text-white shadow-md hover:bg-emerald-800 active:scale-[0.99]' : 'cursor-not-allowed bg-stone-100 text-stone-400'
          }`}
        >
          {tool.available ? (
            <>
              <span>{tool.instantBook ? 'Book Instantly' : 'Request to Borrow'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          ) : (
            <span>Currently unavailable</span>
          )}
        </button>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Wrench, PlusCircle, Bell, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { api, initials, useStats } from '../api.js';
import { BUILDER } from '../constants.js';

export function AnnouncementBar() {
  const stats = useStats();
  return (
    <div className="border-b border-emerald-900/60 bg-emerald-950 px-4 py-2 text-xs text-emerald-100 sm:text-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-800/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
            🇮🇳 Made in India
          </span>
          <span className="truncate">Borrow from neighbours in Greater Noida, Delhi NCR, Bengaluru, Pune and beyond</span>
        </div>
        {stats && (
          <div className="hidden shrink-0 items-center gap-3 text-xs text-emerald-200/80 md:flex">
            <span>{stats.tools} tools listed</span>
            <span>•</span>
            <span>{stats.members} neighbours</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!user) {
      setPending(0);
      return;
    }
    api('/bookings/incoming')
      .then((d) => setPending(d.bookings.filter((b) => b.status === 'pending').length))
      .catch(() => {});
  }, [user]);

  const linkCls = ({ isActive }) =>
    `transition-colors hover:text-stone-950 ${isActive ? 'text-emerald-800' : 'text-stone-600'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg ring-4 shadow-emerald-900/20 ring-emerald-50">
            <Wrench className="h-5 w-5 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-stone-900">
                Tool<span className="text-emerald-700">Share</span>
              </span>
              <span className="rounded-md border border-orange-200/70 bg-orange-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-orange-800 uppercase">
                India
              </span>
            </div>
            <p className="hidden text-[11px] font-medium text-stone-600 sm:block">Padosi se maango • Borrow locally, lend generously</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
          <NavLink to="/" end className={linkCls}>
            Browse Tools
          </NavLink>
          <a href="/#how-it-works" className="text-stone-600 transition-colors hover:text-stone-950">
            How it works
          </a>
          <a href="/#about" className="text-stone-600 transition-colors hover:text-stone-950">
            About
          </a>
          {user && (
            <NavLink to="/dashboard" className={linkCls}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/tools/new"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-emerald-800 hover:to-emerald-900 hover:shadow-lg active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Lend a Tool</span>
            <span className="sm:hidden">Lend</span>
          </Link>

          {user ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="relative rounded-xl p-2.5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                title={pending ? `${pending} pending request(s)` : 'Dashboard'}
              >
                <Bell className="h-5 w-5" />
                {pending > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {pending}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2 border-l border-stone-200 pl-2 sm:pl-3">
                <Link
                  to="/dashboard"
                  title={user.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900 ring-2 ring-emerald-600/20"
                >
                  {initials(user.name)}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="rounded-xl p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 border-l border-stone-200 pl-2 sm:gap-2 sm:pl-3">
              <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100">
                Login
              </Link>
              <Link
                to="/register"
                className="hidden rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 sm:block"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-800 text-white">
                <Wrench className="h-4 w-4 -rotate-45" />
              </div>
              <span className="text-xl font-black text-stone-900">ToolShare</span>
            </div>
            <p className="text-xs leading-relaxed text-stone-500">
              A neighbourhood tool-sharing network for Indian cities. Why buy a drill for one weekend job when your neighbour already owns one?
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold tracking-wider text-stone-900 uppercase">Explore</h4>
            <ul className="space-y-2 text-xs text-stone-600">
              <li><Link to="/" className="hover:text-emerald-800">Browse tools</Link></li>
              <li><Link to="/tools/new" className="hover:text-emerald-800">Lend a tool</Link></li>
              <li><Link to="/dashboard" className="hover:text-emerald-800">My dashboard</Link></li>
              <li><a href="/#how-it-works" className="hover:text-emerald-800">How it works</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold tracking-wider text-stone-900 uppercase">Built by</h4>
            <p className="text-xs font-semibold text-stone-800">{BUILDER.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {BUILDER.role}
              <br />
              {BUILDER.college}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold tracking-wider text-stone-900 uppercase">Connect</h4>
            <ul className="space-y-2 text-xs text-stone-600">
              <li>
                <a href={BUILDER.github} target="_blank" rel="noreferrer" className="hover:text-emerald-800">
                  GitHub ↗
                </a>
              </li>
              <li>
                <a href={BUILDER.linkedin} target="_blank" rel="noreferrer" className="hover:text-emerald-800">
                  LinkedIn ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-stone-100 pt-6 text-xs text-stone-400 sm:flex-row">
          <div>© {new Date().getFullYear()} ToolShare India. Made with ❤️ in Greater Noida by {BUILDER.name}.</div>
          <div>MERN stack project · MongoDB · Express · React · Node</div>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || '/api';

export function getToken() {
  return localStorage.getItem('toolshare_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('toolshare_token', token);
  else localStorage.removeItem('toolshare_token');
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    /* empty body */
  }
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ₹ with Indian digit grouping, e.g. ₹1,50,000
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const todayISO = () => new Date().toISOString().slice(0, 10);

// Live stats from the API (cached per page load)
let statsCache = null;
export function useStats() {
  const [stats, setStats] = useState(statsCache);
  useEffect(() => {
    if (statsCache) return;
    api('/stats')
      .then((s) => {
        statsCache = s;
        setStats(s);
      })
      .catch(() => {});
  }, []);
  return stats;
}

import { useCallback, useEffect, useState } from 'react';
export function usePortalNavigation(portal: string, initialPage: string) {
  const read = () => { const requested = new URLSearchParams(window.location.search).get('page'); return !requested || portal !== 'public' && ['login','register','website'].includes(requested) ? initialPage : requested; };
  const [page, setPage] = useState(read);
  useEffect(() => { const update = () => setPage(read()); window.addEventListener('popstate', update); window.addEventListener('nanolabs_navigation', update); return () => { window.removeEventListener('popstate', update); window.removeEventListener('nanolabs_navigation', update); }; }, [initialPage]);
  const navigate = useCallback((next: string, bookingId?: string) => {
    const url = new URL(window.location.href); url.searchParams.set('portal', portal); url.searchParams.set('page', next);
    if (bookingId) url.searchParams.set('booking', bookingId);
    window.history.pushState({}, '', url); window.dispatchEvent(new Event('nanolabs_navigation'));
  }, [portal]);
  return [page, navigate] as const;
}

'use client';
import { Search } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce'; // If you have this lib, otherwise use custom hook. 
// I will write a custom hook implementation here to save you an install.

import { useState, useEffect } from 'react';

export default function SearchInput({ placeholder }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [term, setTerm] = useState(searchParams.get('query')?.toString() || '');

  // Custom debounce logic to avoid extra dependencies
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1'); // Reset to page 1 on new search
        
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300); // Wait 300ms after typing stops

    return () => clearTimeout(delayDebounceFn);
  }, [term, searchParams, pathname, replace]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => setTerm(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
      />
    </div>
  );
}
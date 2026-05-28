import { useEffect, useMemo, useRef, useState } from 'react';
import { Country, State, City } from 'country-state-city';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AddressOption = { value: string; label: string; meta?: any };

const MAX_VISIBLE = 100;

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  testId,
  className,
}: {
  options: AddressOption[];
  value: string;
  onChange: (opt: AddressOption | null) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  testId?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, MAX_VISIBLE);
    const out: AddressOption[] = [];
    for (let i = 0; i < options.length && out.length < MAX_VISIBLE; i++) {
      if (options[i].label.toLowerCase().includes(q)) out.push(options[i]);
    }
    return out;
  }, [options, query]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          data-testid={testId}
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left',
            'h-12 text-base sm:h-10 sm:text-sm',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            className,
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width] max-w-[95vw] z-[100]"
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 border-0 px-0 text-base sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid={testId ? `${testId}-search` : undefined}
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            <>
              {filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-3 text-left text-sm outline-none sm:py-2',
                    'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    value === opt.value && 'bg-accent/50',
                  )}
                  data-testid={testId ? `${testId}-option-${opt.value}` : undefined}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === opt.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
              {!query.trim() && options.length > MAX_VISIBLE && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Showing first {MAX_VISIBLE} of {options.length} — type to search
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

let countryCache: AddressOption[] | null = null;
function getCountryOptions(): AddressOption[] {
  if (!countryCache) {
    countryCache = Country.getAllCountries().map((c) => ({
      value: c.isoCode,
      label: `${c.flag ? c.flag + ' ' : ''}${c.name}`,
      meta: { name: c.name, isoCode: c.isoCode, iso2: c.isoCode },
    }));
  }
  return countryCache;
}

const stateCache = new Map<string, AddressOption[]>();
function getStateOptions(countryIso: string): AddressOption[] {
  const cached = stateCache.get(countryIso);
  if (cached) return cached;
  const list = State.getStatesOfCountry(countryIso).map((s) => ({
    value: s.isoCode,
    label: s.name,
    meta: { name: s.name, isoCode: s.isoCode, state_code: s.isoCode },
  }));
  stateCache.set(countryIso, list);
  return list;
}

const cityCache = new Map<string, AddressOption[]>();
function getCityOptions(countryIso: string, stateIso: string): AddressOption[] {
  const key = `${countryIso}:${stateIso}`;
  const cached = cityCache.get(key);
  if (cached) return cached;
  const list = City.getCitiesOfState(countryIso, stateIso).map((c) => ({
    value: c.name,
    label: c.name,
    meta: { name: c.name },
  }));
  cityCache.set(key, list);
  return list;
}

export function useCountryOptions(): AddressOption[] {
  return useMemo(() => getCountryOptions(), []);
}

export function useStateOptions(countryIso: string | undefined | null): AddressOption[] {
  return useMemo(() => {
    if (!countryIso) return [];
    return getStateOptions(countryIso);
  }, [countryIso]);
}

export function useCityOptions(
  countryIso: string | undefined | null,
  stateIso: string | undefined | null,
): AddressOption[] {
  return useMemo(() => {
    if (!countryIso || !stateIso) return [];
    return getCityOptions(countryIso, stateIso);
  }, [countryIso, stateIso]);
}

export function findCountry(codeOrName: string | undefined) {
  if (!codeOrName) return null;
  const byCode = Country.getCountryByCode(codeOrName);
  if (byCode) return byCode;
  return Country.getAllCountries().find((c) => c.name === codeOrName) || null;
}

export function findState(countryIso: string, codeOrName: string | undefined) {
  if (!countryIso || !codeOrName) return null;
  const byCode = State.getStateByCodeAndCountry(codeOrName, countryIso);
  if (byCode) return byCode;
  return State.getStatesOfCountry(countryIso).find((s) => s.name === codeOrName) || null;
}

export function preloadAddressData() {
  if (typeof window === 'undefined') return;
  const run = () => {
    try {
      getCountryOptions();
    } catch {
      /* noop */
    }
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 0);
  }
}

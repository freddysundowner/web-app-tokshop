import { useMemo, useState } from 'react';
import { Country, State, City } from 'country-state-city';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AddressOption = { value: string; label: string; meta?: any };

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
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        className="p-0 w-[--radix-popover-trigger-width] max-w-[95vw]"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-11" />
          <CommandList className="max-h-[50vh]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.value}`}
                  onSelect={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className="py-3 sm:py-2"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === opt.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function useCountryOptions(): AddressOption[] {
  return useMemo(
    () =>
      Country.getAllCountries().map((c) => ({
        value: c.isoCode,
        label: `${c.flag ? c.flag + ' ' : ''}${c.name}`,
        meta: { name: c.name, isoCode: c.isoCode, iso2: c.isoCode },
      })),
    [],
  );
}

export function useStateOptions(countryIso: string | undefined | null): AddressOption[] {
  return useMemo(() => {
    if (!countryIso) return [];
    return State.getStatesOfCountry(countryIso).map((s) => ({
      value: s.isoCode,
      label: s.name,
      meta: { name: s.name, isoCode: s.isoCode, state_code: s.isoCode },
    }));
  }, [countryIso]);
}

export function useCityOptions(
  countryIso: string | undefined | null,
  stateIso: string | undefined | null,
): AddressOption[] {
  return useMemo(() => {
    if (!countryIso || !stateIso) return [];
    return City.getCitiesOfState(countryIso, stateIso).map((c) => ({
      value: c.name,
      label: c.name,
      meta: { name: c.name },
    }));
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

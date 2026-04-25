import { useEffect, useMemo, useRef, useState } from "react";

export type GhlContact = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type ClientPickerProps = {
  value: string;
  email: string;
  onSelect: (contact: { name: string; email: string; ghlContactId: string } | null) => void;
  onNameChange: (name: string) => void;
  inputClassName?: string;
  labelClassName?: string;
};

// Endpoint for the GHL contacts proxy on the FSF dashboard
const CONTACTS_API = "https://fsf-dashboard.vercel.app/api/contacts";

export default function ClientPicker({
  value,
  email,
  onSelect,
  onNameChange,
  inputClassName = "",
  labelClassName = "",
}: ClientPickerProps) {
  const [contacts, setContacts] = useState<GhlContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep input in sync if parent changes the name
  useEffect(() => {
    if (value !== query) setQuery(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Load contacts once on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(CONTACTS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setContacts(data.contacts || []);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load contacts";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    // Only consider contacts that actually have a real first or last name
    // (skip phone-only / nameless contacts that show as "(260) 481-6820")
    const namedContacts = contacts.filter(
      (c) => (c.firstName && c.firstName.trim().length > 0) ||
             (c.lastName && c.lastName.trim().length > 0)
    );

    const q = query.trim().toLowerCase();
    if (!q) return namedContacts.slice(0, 20);

    return namedContacts
      .filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
        );
      })
      .slice(0, 20);
  }, [query, contacts]);

  function handlePick(c: GhlContact) {
    setQuery(c.name);
    setSelectedId(c.id);
    setOpen(false);
    onSelect({ name: c.name, email: c.email, ghlContactId: c.id });
  }

  function handleInputChange(v: string) {
    setQuery(v);
    setOpen(true);
    setSelectedId(null);
    onNameChange(v); // keep parent's clientName in sync for manual typing
  }

  function handleClear() {
    setQuery("");
    setSelectedId(null);
    onSelect(null);
    onNameChange("");
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className={labelClassName}>Client Name</label>
      <div className="relative">
        <input
          className={inputClassName}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={loading ? "Loading contacts..." : "Search GHL contacts..."}
          autoComplete="off"
        />
        {selectedId && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            aria-label="Clear selection"
          >
            ✕
          </button>
        )}
      </div>

      {selectedId && email && (
        <div className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
          <span>✓ Linked to GHL:</span>
          <span className="font-medium">{email}</span>
        </div>
      )}

      {error && (
        <div className="mt-1 text-xs text-red-600">
          Could not load GHL contacts — you can still type a name manually. ({error})
        </div>
      )}

      {open && !loading && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handlePick(c)}
              className="flex w-full flex-col items-start gap-0.5 border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
            >
              <span className="text-sm font-medium text-slate-900">{c.name}</span>
              <span className="text-xs text-slate-500">
                {c.email || "no email"}
                {c.phone ? ` · ${c.phone}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && filtered.length === 0 && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-lg">
          No GHL contacts match — you can still type the name manually.
        </div>
      )}
    </div>
  );
}

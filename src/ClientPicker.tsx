import { useEffect, useMemo, useRef, useState } from "react";

export type GhlContact = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type BookedLead = {
  name: string;
  phone: string;
  email: string;
  contactId: string;
  stage: string;
  daysInStage: number;
};

type ClientPickerProps = {
  value: string;
  email: string;
  onSelect: (contact: { name: string; email: string; ghlContactId: string } | null) => void;
  onNameChange: (name: string) => void;
  onEmailChange?: (email: string) => void;
  inputClassName?: string;
  labelClassName?: string;
};

const DASHBOARD_BASE = "https://fsf-dashboard.vercel.app";
const CONTACTS_API = `${DASHBOARD_BASE}/api/contacts`;
const LEADS_API = `${DASHBOARD_BASE}/api/leads`;

export default function ClientPicker({
  value,
  email,
  onSelect,
  onNameChange,
  onEmailChange,
  inputClassName = "",
  labelClassName = "",
}: ClientPickerProps) {
  const [bookedSessions, setBookedSessions] = useState<BookedLead[]>([]);
  const [contacts, setContacts] = useState<GhlContact[]>([]);
  const [loadingBooked, setLoadingBooked] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep input synced if parent changes the name
  useEffect(() => {
    if (value !== query) setQuery(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Load booked sessions immediately on mount (fast — small list)
  useEffect(() => {
    let cancelled = false;
    async function loadBooked() {
      setLoadingBooked(true);
      try {
        const res = await fetch(LEADS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setBookedSessions(data.bookedSessions || []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load booked sessions";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoadingBooked(false);
      }
    }
    loadBooked();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lazy-load full contacts list only when user starts typing
  async function ensureContactsLoaded() {
    if (contactsLoaded || loadingContacts) return;
    setLoadingContacts(true);
    try {
      const res = await fetch(CONTACTS_API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setContacts(data.contacts || []);
      setContactsLoaded(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load contacts";
      setError(msg);
    } finally {
      setLoadingContacts(false);
    }
  }

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

  type DisplayItem = {
    id: string;
    name: string;
    email: string;
    phone: string;
    contactId: string;
    stage?: string;
    daysInStage?: number;
    isBooked: boolean;
  };

  // Build the filtered list to show in the dropdown:
  // - No query: show booked sessions only
  // - Query present: search booked sessions first, then all contacts (deduped)
  const filtered: DisplayItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    const bookedItems: DisplayItem[] = bookedSessions.map((b) => ({
      id: `booked:${b.email || b.phone || b.name}`,
      name: b.name,
      email: b.email || "",
      phone: b.phone || "",
      contactId: b.contactId || "",
      stage: b.stage,
      daysInStage: b.daysInStage,
      isBooked: true,
    }));

    if (!q) {
      return bookedItems.slice(0, 20);
    }

    const matchedBooked = bookedItems.filter((b) => {
      return (
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
      );
    });

    const bookedEmails = new Set(matchedBooked.map((b) => b.email.toLowerCase()).filter(Boolean));
    const namedContacts = contacts.filter(
      (c) =>
        ((c.firstName && c.firstName.trim().length > 0) ||
          (c.lastName && c.lastName.trim().length > 0)) &&
        !bookedEmails.has((c.email || "").toLowerCase())
    );

    const matchedContacts: DisplayItem[] = namedContacts
      .filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
        );
      })
      .map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email || "",
        phone: c.phone || "",
        contactId: c.id,
        isBooked: false,
      }));

    return [...matchedBooked, ...matchedContacts].slice(0, 25);
  }, [query, bookedSessions, contacts]);

  function handlePick(item: DisplayItem) {
    setQuery(item.name);
    setSelectedId(item.id);
    setOpen(false);
    onSelect({
      name: item.name,
      email: item.email,
      ghlContactId: item.contactId || "",
    });
  }

  function handleInputChange(v: string) {
    setQuery(v);
    setOpen(true);
    setSelectedId(null);
    onNameChange(v);
    if (v.trim().length > 0 && !contactsLoaded) {
      ensureContactsLoaded();
    }
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
          placeholder={
            loadingBooked
              ? "Loading scheduled assessments..."
              : "Pick from scheduled assessments or type to search..."
          }
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

      {/* Walk-in mode: when no GHL contact selected and user has typed a name,
          show an email field so the assessment can still be saved with a real email */}
      {!selectedId && query.trim().length > 0 && !open && (
        <div className="mt-2">
          <label className={labelClassName}>Email (walk-in)</label>
          <input
            type="email"
            className={inputClassName}
            value={email}
            onChange={(e) => onEmailChange && onEmailChange(e.target.value)}
            placeholder="walk-in client email"
            autoComplete="off"
          />
          <div className="mt-1 text-[11px] text-amber-700">
            ⚠ Walk-in: not linked to GHL. Email is required to save.
          </div>
        </div>
      )}

      {error && (
        <div className="mt-1 text-xs text-red-600">
          Could not load list — you can still type a name manually. ({error})
        </div>
      )}

      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {!query.trim() && filtered.some((f) => f.isBooked) && (
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Scheduled Assessments
            </div>
          )}
          {filtered.map((item, idx) => {
            const showContactsHeader =
              query.trim() &&
              !item.isBooked &&
              idx > 0 &&
              filtered[idx - 1]?.isBooked;
            return (
              <div key={item.id}>
                {showContactsHeader && (
                  <div className="border-b border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Other GHL Contacts
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handlePick(item)}
                  className="flex w-full flex-col items-start gap-0.5 border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900">{item.name}</span>
                    {item.isBooked && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Booked
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {item.email || "no email"}
                    {item.phone ? ` · ${item.phone}` : ""}
                    {item.isBooked && item.daysInStage !== undefined
                      ? ` · ${item.daysInStage}d in stage`
                      : ""}
                  </span>
                </button>
              </div>
            );
          })}
          {loadingContacts && query.trim() && (
            <div className="px-3 py-2 text-center text-xs text-slate-500">
              Loading more contacts...
            </div>
          )}
        </div>
      )}

      {open && !loadingBooked && filtered.length === 0 && (
        <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-lg">
          {query.trim().length > 0
            ? "No matches — you can still type the name manually for a walk-in client."
            : "No scheduled assessments. Type a name to search all GHL contacts."}
        </div>
      )}
    </div>
  );
}

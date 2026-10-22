"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const fieldBase =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** Text input that also behaves like a <select>: clicking it (not just typing)
 *  shows every option, typing filters them, and any free-text value is still
 *  accepted on blur. Works around Safari/Firefox not opening <datalist>
 *  suggestions until the user types. */
export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  ...aria
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered =
    value.trim().length === 0
      ? options
      : options.filter((o) => o.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const select = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-autocomplete="list"
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
        autoComplete="off"
        placeholder={placeholder}
        className={`${fieldBase} pr-9`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onFocus={() => {
          setOpen(true);
          setHighlighted(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            if (open && filtered[highlighted]) {
              e.preventDefault();
              select(filtered[highlighted]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => {
          setOpen((o) => !o);
          setHighlighted(0);
        }}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400"
        aria-label="Toggle options"
      >
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && filtered.length > 0 && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-10 mt-1.5 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
        >
          {filtered.map((option, i) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              onMouseDown={(e) => {
                e.preventDefault();
                select(option);
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={`cursor-pointer px-3.5 py-2 ${
                i === highlighted ? "bg-slate-100" : ""
              } ${option === value ? "font-medium text-slate-900" : "text-slate-700"}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

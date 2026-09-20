"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import type { TextLayerAttribute } from "../_lib/editor-types";
import { fonts } from "./fonts";

interface FontFamilyPickerProps {
  attribute: TextLayerAttribute;
  currentFont: string;
  handleAttributeChange: (attribute: TextLayerAttribute, value: string) => void;
}

export default function FontFamilyPicker({
  attribute,
  currentFont,
  handleAttributeChange,
}: FontFamilyPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase());
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const filteredFonts = useMemo(
    () =>
      deferredSearch
        ? fonts.filter((font) => font.toLowerCase().includes(deferredSearch))
        : fonts,
    [deferredSearch],
  );

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const chooseFont = (font: string) => {
    handleAttributeChange(attribute, font);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="editor-label" id={`${listId}-label`}>Typeface</label>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${listId}-label`}
        onClick={() => setOpen((value) => !value)}
        className="editor-input flex items-center justify-between text-left"
        style={{ fontFamily: currentFont }}
      >
        <span className="truncate">{currentFont}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 fill-none stroke-current transition ${open ? "rotate-180" : ""}`}>
          <path d="m5 7.5 5 5 5-5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(39,28,74,.2)]">
          <div className="border-b border-black/[.07] p-3">
            <div className="relative">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-[#716b7a] stroke-2">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
              </svg>
              <input
                autoFocus
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search 250 fonts…"
                className="h-10 w-full rounded-xl bg-[#f3f0f8] pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#7557ff]/30"
              />
            </div>
            <p className="mt-2 px-1 text-[11px] font-bold uppercase tracking-[.1em] text-[#8a8490]">
              {filteredFonts.length} {filteredFonts.length === 1 ? "font" : "fonts"}
            </p>
          </div>
          <div id={listId} role="listbox" aria-label="Font family" className="max-h-72 overflow-y-auto overscroll-contain p-2">
            {filteredFonts.length ? filteredFonts.map((font) => (
              <button
                type="button"
                role="option"
                aria-selected={currentFont === font}
                key={font}
                onClick={() => chooseFont(font)}
                className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-base transition [content-visibility:auto] hover:bg-[#f0ecff] ${currentFont === font ? "bg-[#ebe5ff] text-[#6544f2]" : "text-[#2c2731]"}`}
                style={{ fontFamily: font }}
              >
                <span className="truncate">{font}</span>
                {currentFont === font ? <span className="ml-3 font-sans text-sm font-black" aria-hidden="true">✓</span> : null}
              </button>
            )) : <div className="px-4 py-8 text-center text-sm text-[#716b7a]">No matching font found.</div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

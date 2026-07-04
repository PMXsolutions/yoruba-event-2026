"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalShellProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** `dialog` for centred modals; `drawer` for right-side panels */
  variant?: "dialog" | "drawer";
  className?: string;
  /** When set, `aria-labelledby` uses this id (title rendered in children). */
  labelledBy?: string;
  /** Show the dialog title visibly instead of screen-reader only */
  showTitle?: boolean;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessible modal/drawer shell with dialog semantics, Escape, and focus restore. */
export function ModalShell({
  title,
  onClose,
  children,
  variant = "dialog",
  className = "",
  labelledBy,
  showTitle = false,
}: ModalShellProps) {
  const generatedTitleId = useId();
  const titleId = labelledBy ?? generatedTitleId;
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusables?.[0];
    if (first) {
      first.focus();
    } else {
      panel?.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab" || !panel) return;
      const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (items.length === 0) return;

      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const titleNode = !labelledBy ? (
    <h2
      id={titleId}
      className={
        showTitle
          ? "font-display text-lg font-semibold text-mahogany"
          : "sr-only"
      }
    >
      {title}
    </h2>
  ) : null;

  if (variant === "drawer") {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          className="absolute inset-0 bg-espresso/40 backdrop-blur-sm"
          aria-label="Close panel"
          onClick={onClose}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden border-l border-mahogany/[0.08] bg-white shadow-2xl outline-none sm:max-w-lg ${className}`}
        >
          {titleNode}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-espresso/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-lg rounded-2xl border border-mahogany/[0.08] bg-white p-6 shadow-xl outline-none ${className}`}
      >
        {titleNode}
        {children}
      </div>
    </div>
  );
}

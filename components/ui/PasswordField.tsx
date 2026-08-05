"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "id"
> & {
  id?: string;
  label: string;
  /** Extra classes for the outer wrapper */
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
};

/**
 * Password input with show / hide toggle for all password sections.
 */
export function PasswordField({
  id,
  label,
  className = "",
  inputClassName = "",
  labelClassName = "",
  disabled,
  ...inputProps
}: PasswordFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  const defaultLabel =
    "mb-2 block font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-muted";
  const defaultInput =
    "w-full rounded-xl border border-white/10 bg-espresso/80 py-3 pl-4 pr-12 font-sans text-sm text-cream outline-none transition focus:border-gold-bright/50 focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className={className}>
      <label htmlFor={fieldId} className={labelClassName || defaultLabel}>
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={fieldId}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={inputClassName || defaultInput}
        />
        <button
          type="button"
          tabIndex={0}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center px-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-gold-muted transition-colors hover:text-gold-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold-bright disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

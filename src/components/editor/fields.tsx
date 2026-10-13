"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

const control =
  "w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-base text-ink transition-colors hover:border-brand-200 focus:border-brand-500 focus:outline-none";

type FieldProps = {
  label: string;
  hint?: string;
  /** Shown under the control and announced with it. */
  error?: string;
  className?: string;
};

function describedBy(id: string, hint?: string, error?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  className,
  counter,
  children,
}: FieldProps & { id: string; counter?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
        {counter}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm font-bold text-miss-700">
          {error}
        </p>
      )}
    </div>
  );
}

function Counter({ value, max }: { value: string; max?: number }) {
  if (!max || value.length < max * 0.8) return null;
  return (
    <span className={cn("text-sm tabular-nums", value.length > max ? "font-bold text-miss-700" : "text-muted")}>
      {value.length}/{max}
    </span>
  );
}

export function TextField({
  label,
  hint,
  error,
  className,
  value,
  onChange,
  maxLength,
  placeholder,
}: FieldProps & { value: string; onChange: (value: string) => void; maxLength?: number; placeholder?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} counter={<Counter value={value} max={maxLength} />}>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(e) => onChange(e.target.value)}
        className={control}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  className,
  value,
  onChange,
  maxLength,
  rows = 3,
  placeholder,
}: FieldProps & {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  rows?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} counter={<Counter value={value} max={maxLength} />}>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(e) => onChange(e.target.value)}
        className={cn(control, "field-sizing-content min-h-20 resize-y leading-relaxed")}
      />
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  hint,
  className,
  value,
  onChange,
  options,
}: FieldProps & { value: T; onChange: (value: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      <select
        id={id}
        value={value}
        aria-describedby={describedBy(id, hint)}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(control, "min-h-11")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** A bordered group for one item in a list (an option, a key word, a sorting example...). */
export function ListItemCard({
  title,
  onRemove,
  removeLabel,
  children,
}: {
  title: string;
  onRemove?: () => void;
  removeLabel?: string;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <fieldset className="space-y-3 rounded-2xl border-2 border-line bg-paper/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <legend className="float-left font-extrabold text-muted">{title}</legend>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel ?? t.editor.fields.removeItem(title)}
            className="rounded-full px-3 py-1 text-sm font-bold text-miss-700 hover:bg-miss-50"
          >
            {t.editor.fields.remove}
          </button>
        )}
      </div>
      <div className="clear-both space-y-3">{children}</div>
    </fieldset>
  );
}

export function AddButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl border-2 border-dashed border-line px-4 py-3 font-bold text-brand-700 hover:border-brand-500 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      + {children}
    </button>
  );
}

export function EditorGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <header>
        <h3 className="text-lg font-extrabold">{title}</h3>
        {description && <p className="text-sm text-muted">{description}</p>}
      </header>
      {children}
    </section>
  );
}

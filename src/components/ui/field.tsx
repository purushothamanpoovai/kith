import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * Form primitives (§17).
 *
 * Every field has a real <label>. Helper text and error messages are wired to
 * the control with `aria-describedby` / `aria-errormessage` so assistive tech
 * receives them, and the error state is announced rather than only coloured.
 */

type FieldState = "default" | "error" | "success";

type FieldProps = {
  id: string;
  label: string;
  /** Persistent guidance, shown whether or not there is an error. */
  hint?: string;
  error?: string;
  success?: string;
  optional?: boolean;
  optionalLabel?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  /**
   * Keeps the <label> in the accessibility tree but removes it visually —
   * for a field whose placeholder already reads as its own label (a title
   * field at the top of a composer, say). The label element is still
   * required: this is a presentation choice, not a way to skip one.
   */
  labelHidden?: boolean;
};

export function Field({
  id,
  label,
  hint,
  error,
  success,
  optional = false,
  optionalLabel,
  required = false,
  children,
  className,
  labelHidden = false,
}: FieldProps) {
  const state: FieldState = error ? "error" : success ? "success" : "default";

  return (
    <div
      className={["ds-field", className].filter(Boolean).join(" ")}
      data-state={state}
    >
      <label
        className={labelHidden ? "ds-sr-only" : "ds-field__label"}
        htmlFor={id}
      >
        <span>
          {label}
          {required ? (
            <span className="ds-field__required" aria-hidden>
              {" *"}
            </span>
          ) : null}
        </span>
        {optional ? (
          <span className="ds-field__optional">{optionalLabel ?? "optional"}</span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p className="ds-field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          className="ds-field__message ds-field__message--error"
          id={`${id}-error`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {success && !error ? (
        <p className="ds-field__message ds-field__message--success" id={`${id}-success`}>
          {success}
        </p>
      ) : null}
    </div>
  );
}

/** Builds the aria wiring a control needs from its field's ids. */
export function describedBy(
  id: string,
  { hint, error }: { hint?: boolean; error?: boolean } = {},
): { "aria-describedby"?: string; "aria-invalid"?: true } {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(
    Boolean,
  );
  return {
    ...(ids.length ? { "aria-describedby": ids.join(" ") } : {}),
    ...(error ? { "aria-invalid": true as const } : {}),
  };
}

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={["ds-input", className].filter(Boolean).join(" ")} />;
}

export function Textarea({
  className,
  ref,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
}) {
  return (
    <textarea
      {...rest}
      ref={ref}
      className={["ds-textarea", className].filter(Boolean).join(" ")}
    />
  );
}

export function Select({
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={["ds-select", className].filter(Boolean).join(" ")} />;
}

/**
 * A radio or checkbox presented as a card with a description — used where a
 * choice needs explaining, so the form stays progressive rather than dense.
 */
export function Choice({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  /** The <input>, supplied by the caller so name/value stay with the form. */
  children: ReactNode;
}) {
  return (
    <label className="ds-choice">
      {children}
      <span className="ds-choice__text">
        <span className="ds-choice__title">{title}</span>
        {description ? (
          <span className="ds-choice__desc">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

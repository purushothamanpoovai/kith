import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Link } from "@/i18n/navigation";

/**
 * The button system (§16). One height scale, one radius scale, five states.
 *
 * `Button` renders a <button>; `ButtonLink` renders a locale-aware <Link> with
 * identical styling, so navigation and actions can look alike without an
 * anchor pretending to be a button.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

function classes({
  variant = "secondary",
  size = "md",
  block,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}) {
  return [
    "ds-btn",
    `ds-btn--${variant}`,
    size !== "md" ? `ds-btn--${size}` : "",
    block ? "ds-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  /** Shows a spinner and blocks input while an action is in flight. */
  loading?: boolean;
  icon?: ReactNode;
  /** Places the icon after the label — use for "forward" affordances. */
  iconEnd?: ReactNode;
};

export function Button({
  variant,
  size,
  block,
  loading = false,
  icon,
  iconEnd,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={classes({ variant, size, block, className })}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
    >
      {icon ? (
        <span className="ds-btn__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
      {iconEnd ? (
        <span className="ds-btn__icon" aria-hidden>
          {iconEnd}
        </span>
      ) : null}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  className?: string;
  children: ReactNode;
  /** Set for links leaving the platform. */
  external?: boolean;
};

export function ButtonLink({
  href,
  variant,
  size,
  block,
  icon,
  iconEnd,
  className,
  children,
  external = false,
}: ButtonLinkProps) {
  const content = (
    <>
      {icon ? (
        <span className="ds-btn__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
      {iconEnd ? (
        <span className="ds-btn__icon" aria-hidden>
          {iconEnd}
        </span>
      ) : null}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        className={classes({ variant, size, block, className })}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes({ variant, size, block, className })}>
      {content}
    </Link>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required: an icon-only control has no visible text to name it (§38). */
  label: string;
  size?: "sm" | "md" | "lg";
  outlined?: boolean;
  round?: boolean;
  active?: boolean;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

export function IconButton({
  label,
  size = "md",
  outlined = false,
  round = false,
  active,
  className,
  children,
  type = "button",
  ref,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      data-active={active || undefined}
      aria-pressed={active !== undefined ? active : undefined}
      className={[
        "ds-icon-btn",
        size !== "md" ? `ds-icon-btn--${size}` : "",
        outlined ? "ds-icon-btn--outlined" : "",
        round ? "ds-icon-btn--round" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

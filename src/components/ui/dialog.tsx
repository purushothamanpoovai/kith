"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/button";

/**
 * Dialog built on the native <dialog> element, which gives focus trapping,
 * Escape handling and the top layer for free — all things a hand-rolled modal
 * usually gets wrong. On phones it presents as a bottom sheet (§14).
 */
export function Dialog({
  open,
  onClose,
  title,
  closeLabel,
  footer,
  sheet = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  footer?: ReactNode;
  /** Present as a bottom sheet on small screens. */
  sheet?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  // `cancel` covers Escape; `close` covers every other dismissal path.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const handleClose = () => onClose();
    node.addEventListener("close", handleClose);
    return () => node.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={["ds-dialog", sheet ? "ds-dialog--sheet" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby="ds-dialog-title"
      // Clicking the backdrop (the dialog's own box outside the panel) closes.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="ds-dialog__head">
        <h2 className="ds-dialog__title" id="ds-dialog-title">
          {title}
        </h2>
        <IconButton label={closeLabel} size="sm" onClick={onClose}>
          <X size={16} strokeWidth={1.75} />
        </IconButton>
      </div>
      <div className="ds-dialog__body">{children}</div>
      {footer ? <div className="ds-dialog__foot">{footer}</div> : null}
    </dialog>
  );
}

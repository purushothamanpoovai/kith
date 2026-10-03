import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  narrow?: boolean;
  className?: string;
};

export function Container({ children, narrow, className }: Props) {
  return (
    <div
      className={[narrow ? "ds-container ds-container--narrow" : "ds-container", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

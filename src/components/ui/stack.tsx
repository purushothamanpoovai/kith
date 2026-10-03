import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  gap?: "default" | "lg";
  className?: string;
};

export function Stack({ children, gap = "default", className }: Props) {
  return (
    <div
      className={[
        gap === "lg" ? "ds-stack ds-stack--lg" : "ds-stack",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

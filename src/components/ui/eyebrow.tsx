import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function Eyebrow({ children }: Props) {
  return <p className="ds-eyebrow">{children}</p>;
}

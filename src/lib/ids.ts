import { randomBytes } from "node:crypto";

export function createId(): string {
  return randomBytes(9).toString("hex");
}

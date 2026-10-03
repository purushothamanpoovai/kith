interface MessageTree {
  [key: string]: string | MessageTree;
}

export function mergeMessages(base: MessageTree, override: MessageTree): MessageTree {
  const merged: MessageTree = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      merged[key] &&
      typeof merged[key] === "object" &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = mergeMessages(merged[key] as MessageTree, value as MessageTree);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

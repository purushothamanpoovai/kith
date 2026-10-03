"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ScopeTreeNode } from "@/services/scope-service";
import { scopeHref } from "@/domain/scope/routes";
import { pickLocalized } from "@/lib/localized";

/**
 * Religion → Tradition → Sacred Entity as a literal, collapsible tree
 * (§ Explore redesign), replacing a card grid for the one dimension that
 * actually has real parent/child structure. A journalist or researcher
 * scanning "what belongs under what" wants this shape, not a rail of
 * equally-weighted cards with no visible relationship between them.
 *
 * Collapsed by default past the first level so the page opens compact; each
 * religion expands to reveal its traditions and sacred entities in place,
 * without a page navigation, so the structure itself stays visible while
 * browsing.
 */
export function ScopeTree({
  nodes,
  locale,
  formatCount,
}: {
  nodes: ScopeTreeNode[];
  locale: string;
  /** A translated label per node id, e.g. { "scope-1": "12 entries" } —
   *  computed server-side, since a Server Component cannot pass a function
   *  down into this Client Component. */
  formatCount: Record<string, string>;
}) {
  return (
    <ul className="ds-scope-tree">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} locale={locale} formatCount={formatCount} depth={0} />
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  locale,
  formatCount,
  depth,
}: {
  node: ScopeTreeNode;
  locale: string;
  formatCount: Record<string, string>;
  depth: number;
}) {
  // Depth 0 (religions) open by default — there are only a handful, and
  // seeing their traditions/entities immediately is the point of a tree view.
  // Deeper levels start collapsed so a fully expanded page doesn't dump every
  // sacred entity under every religion at once.
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const label = pickLocalized(node.title, locale);

  return (
    <li>
      <div className="ds-scope-tree__row" style={{ ["--ds-tree-depth" as string]: depth }}>
        {hasChildren ? (
          <button
            type="button"
            className="ds-scope-tree__toggle"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse" : "Expand"}
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronRight
              size={14}
              strokeWidth={2}
              className="ds-flip-rtl"
              style={{
                transform: expanded ? "rotate(90deg)" : undefined,
                transition: "transform var(--ds-duration) var(--ds-ease)",
              }}
            />
          </button>
        ) : (
          <span className="ds-scope-tree__toggle ds-scope-tree__toggle--leaf" aria-hidden />
        )}
        <Link href={scopeHref(node.type, node.slug) as `/${string}`} className="ds-scope-tree__link">
          <span className="ds-scope-tree__label">{label}</span>
          <span className="ds-scope-tree__count">{formatCount[node.id]}</span>
        </Link>
      </div>

      {hasChildren && expanded ? (
        <ul className="ds-scope-tree__children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              locale={locale}
              formatCount={formatCount}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

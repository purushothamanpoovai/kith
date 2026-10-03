import { getTranslations } from "next-intl/server";
import { ContentCover } from "@/components/graphics/content-cover";
import type { ProductRecord } from "@/repositories/product-repository";
import { pickLocalized } from "@/lib/localized";

/**
 * The product catalogue (§ products) — catalogue-only, same trust model as
 * `donationUrl`: every card ends at an external link to wherever the
 * institution actually sells the item, never an in-app purchase flow.
 */
export async function ProductGrid({
  products,
  locale,
}: {
  products: ProductRecord[];
  locale: string;
}) {
  if (products.length === 0) return null;
  const t = await getTranslations("organizations");

  return (
    <ul className="ds-grid ds-grid--3">
      {products.map((product) => {
        const name = pickLocalized(product.name, locale);
        const description = product.description ? pickLocalized(product.description, locale) : null;
        return (
          <li key={product.id}>
            <article className="ds-card ds-product-card">
              <ContentCover
                seed={product.id}
                src={product.imageUrl}
                alt=""
                className="ds-product-card__cover"
              />
              <div className="ds-product-card__body">
                <p className="ds-product-card__name" dir="auto">{name}</p>
                {product.price ? (
                  <p className="ds-product-card__price">{product.price}</p>
                ) : null}
                {description ? (
                  <p className="ds-product-card__desc ds-clamp-2" dir="auto">
                    {description}
                  </p>
                ) : null}
                <a
                  href={product.purchaseUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="ds-btn ds-btn--secondary ds-btn--sm ds-product-card__cta"
                >
                  {t("buyLink")}
                </a>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

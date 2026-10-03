"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { pickLocalized } from "@/lib/localized";
import type { ProductRecord } from "@/repositories/product-repository";

/**
 * Product catalogue CRUD (§ manage console). A flat list with an inline "add"
 * form at the top — no modal, since the field count is small enough to sit
 * directly in the page (matches this console's other managers).
 */
export function ProductManager({
  slug,
  locale,
  products,
}: {
  slug: string;
  locale: string;
  products: ProductRecord[];
}) {
  const t = useTranslations("organizations");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");

  function addProduct() {
    setError(null);
    startTransition(async () => {
      const result = await createProductAction({
        slug,
        name,
        description,
        imageUrl: imageUrl || null,
        price,
        purchaseUrl,
      });
      if (!result.ok) {
        setError(t("saveFailed"));
        return;
      }
      setName("");
      setDescription("");
      setImageUrl("");
      setPrice("");
      setPurchaseUrl("");
    });
  }

  function toggleActive(product: ProductRecord) {
    startTransition(async () => {
      await updateProductAction({ slug, id: product.id, active: !product.active });
    });
  }

  function remove(product: ProductRecord) {
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteProductAction(slug, product.id);
    });
  }

  return (
    <div className="ds-stack">
      <ul className="ds-stack">
        {products.map((product) => (
          <li key={product.id} className="ds-card ds-card--pad ds-manage-row">
            <div>
              <p className="ds-manage-row__title" dir="auto">
                {pickLocalized(product.name, locale)}
                {!product.active ? (
                  <span className="ds-hint"> · {t("productHidden")}</span>
                ) : null}
              </p>
              {product.price ? <p className="ds-hint">{product.price}</p> : null}
            </div>
            <div className="ds-row ds-row--tight">
              <Button size="sm" onClick={() => toggleActive(product)} disabled={pending}>
                {product.active ? t("productActiveLabel") : t("productHidden")}
              </Button>
              <Button size="sm" variant="danger" onClick={() => remove(product)} disabled={pending}>
                {t("deleteProduct")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="ds-card ds-card--pad ds-stack">
        <h3 className="ds-heading-3">{t("addProduct")}</h3>
        <div className="ds-field-row">
          <Field id="product-name" label={t("productNameLabel")}>
            <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="product-price" label={t("productPriceLabel")}>
            <Input id="product-price" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
        </div>
        <Field id="product-description" label={t("productDescriptionLabel")} optional>
          <Textarea
            id="product-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="ds-field-row">
          <Field id="product-image" label={t("productImageLabel")} optional>
            <Input
              id="product-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/media/…"
            />
          </Field>
          <Field id="product-purchase-url" label={t("productPurchaseUrlLabel")}>
            <Input
              id="product-purchase-url"
              type="url"
              value={purchaseUrl}
              onChange={(e) => setPurchaseUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </div>
        {error ? (
          <p className="ds-field__message ds-field__message--error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="ds-row">
          <Button
            variant="primary"
            loading={pending}
            disabled={!name.trim() || !purchaseUrl.trim()}
            onClick={addProduct}
          >
            {t("addProduct")}
          </Button>
        </div>
      </div>
    </div>
  );
}

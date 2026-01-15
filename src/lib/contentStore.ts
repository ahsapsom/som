import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { SiteContentSchema, type SiteContent } from "@/lib/contentSchema";
import {
  normalizeImageSrc,
  normalizeOptionalImageSrc,
} from "@/lib/imagePath";

const CONTENT_PATH = path.join(process.cwd(), "data", "content.json");

export async function readContent(): Promise<SiteContent> {
  const raw = await readFile(CONTENT_PATH, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const validated = SiteContentSchema.parse(parsed);
  return normalizeContentImages(validated);
}

export async function writeContent(next: SiteContent): Promise<void> {
  const validated = SiteContentSchema.parse(next);
  const normalized = normalizeContentImages(validated);
  const dir = path.dirname(CONTENT_PATH);
  const tmp = path.join(dir, `content.${Date.now()}.tmp.json`);
  await writeFile(tmp, JSON.stringify(normalized, null, 2), "utf8");
  await rename(tmp, CONTENT_PATH);
}

export function getContentPath() {
  return CONTENT_PATH;
}

function normalizeContentImages(content: SiteContent): SiteContent {
  return {
    ...content,
    seo: {
      ...content.seo,
      ogImage: normalizeOptionalImageSrc(content.seo.ogImage),
    },
    brand: {
      ...content.brand,
      logo: normalizeOptionalImageSrc(content.brand.logo),
    },
    hero: {
      ...content.hero,
      heroImage: content.hero.heroImage
        ? {
            ...content.hero.heroImage,
            src: normalizeImageSrc(content.hero.heroImage.src),
            thumb: normalizeOptionalImageSrc(content.hero.heroImage.thumb),
          }
        : undefined,
    },
    about: {
      ...content.about,
      image: content.about.image
        ? {
            ...content.about.image,
            src: normalizeImageSrc(content.about.image.src),
            thumb: normalizeOptionalImageSrc(content.about.image.thumb),
          }
        : undefined,
    },
    products: {
      ...content.products,
      cards: content.products.cards.map((card) => ({
        ...card,
        image: card.image
          ? {
              ...card.image,
              src: normalizeImageSrc(card.image.src),
              thumb: normalizeOptionalImageSrc(card.image.thumb),
            }
          : undefined,
      })),
    },
    gallery: {
      ...content.gallery,
      images: content.gallery.images.map((image) => ({
        ...image,
        src: normalizeImageSrc(image.src),
        thumb: normalizeOptionalImageSrc(image.thumb),
      })),
    },
  };
}

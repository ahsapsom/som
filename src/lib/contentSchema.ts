import { z } from "zod";

export const ImageSchema = z.object({
  src: z.string().min(0),
  alt: z.string().min(0),
  thumb: z.string().optional(),
});

export const SiteContentSchema = z.object({
  version: z.number().int().min(1),
  seo: z.object({
    title: z.string().min(0).max(120),
    description: z.string().min(0).max(300),
    keywords: z.array(z.string().min(0).max(40)).max(30),
    ogImage: z.string().optional(),
    googleSiteVerification: z.string().optional(),
    gaMeasurementId: z.string().optional(),
  }),
  brand: z.object({
    name: z.string().min(0).max(60),
    tagline: z.string().min(0).max(120),
    city: z.string().min(0).max(60),
    address: z.string().max(200).optional(),
    phone: z.string().min(0).max(30),
    email: z.string().email(),
    whatsapp: z.string().optional(),
    logo: z.string().optional(),
    logoHeight: z.number().int().positive().optional(),
    logoMaxWidth: z.number().int().positive().optional(),
  }),
  theme: z.object({
    colors: z.object({
      background: z.string().min(0).max(120),
      foreground: z.string().min(0).max(120),
      surface: z.string().min(0).max(120),
      card: z.string().min(0).max(120),
      muted: z.string().min(0).max(120),
      border: z.string().min(0).max(120),
      accent: z.string().min(0).max(120),
      accentSoft: z.string().min(0).max(120),
      danger: z.string().min(0).max(120),
      woodBark: z.string().min(0).max(120),
      woodCore: z.string().min(0).max(120),
      woodHalo: z.string().min(0).max(120),
    }),
    typography: z.object({
      sans: z.string().min(0).max(160),
      display: z.string().min(0).max(160),
    }),
  }),
  hero: z.object({
    eyebrow: z.string().min(0).max(80),
    headline: z.string().min(0).max(80),
    subhead: z.string().min(0).max(220),
    ctaPrimaryLabel: z.string().min(0).max(30),
    ctaPrimaryHref: z.string().min(0),
    ctaSecondaryLabel: z.string().min(0).max(30),
    ctaSecondaryHref: z.string().min(0),
    highlights: z.array(z.object({ title: z.string(), value: z.string() })).max(8),
    note: z.string().max(280),
    heroImage: ImageSchema.optional(),
    heroVideo: z
      .object({
        url: z.string().url(),
        title: z.string().min(0).max(120).optional(),
        description: z.string().max(200).optional(),
      })
      .optional(),
    quickOptions: z
      .array(
        z.object({
          label: z.string().min(0).max(40),
          placeholder: z.string().min(0).max(80).optional(),
          options: z.array(z.string().min(0).max(80)).min(0).max(10),
          note: z.string().max(120).optional(),
        }),
      )
      .max(6),
  }),
  about: z.object({
    heading: z.string().min(0).max(80),
    text: z.string().min(0).max(600),
    bullets: z.array(z.string().min(0).max(120)).max(8),
    image: ImageSchema.optional(),
  }),
  products: z.object({
    heading: z.string().min(0).max(80),
    intro: z.string().min(0).max(400),
    cards: z
      .array(
        z.object({
          title: z.string().min(0).max(80),
          desc: z.string().min(0).max(240),
          details: z.string().max(800).optional(),
          image: ImageSchema.optional(),
        }),
      )
      .max(12),
  }),
  services: z.object({
    heading: z.string().min(0).max(80),
    intro: z.string().min(0).max(400),
    steps: z
      .array(
        z.object({
          key: z.string().min(0).max(10),
          title: z.string().min(0).max(60),
          desc: z.string().min(0).max(200),
        }),
      )
      .max(10),
  }),
    calculator: z.object({
    usageAreas: z.array(z.string().min(0).max(60)).min(0).max(20),
    woodTypes: z.array(z.string().min(0).max(60)).min(0).max(30),
    thicknessOptions: z
      .array(z.number().int().min(12).max(120))
      .min(1)
      .max(12),
    thicknessDefaultMm: z.number().int().min(12).max(120),
    thicknessMinMm: z.number().int().min(12).max(120),
    thicknessMaxMm: z.number().int().min(12).max(120),
  }),
  gallery: z.object({
    heading: z.string().min(0).max(80),
    intro: z.string().min(0).max(280),
    images: z.array(ImageSchema).max(24),
  }),
  serviceArea: z.object({
    heading: z.string().min(0).max(80),
    intro: z.string().min(0).max(280),
    mapEmbedUrl: z.string().min(0),
    areas: z.array(z.string().min(0).max(60)).max(40),
  }),
  trust: z.object({
    heading: z.string().min(0).max(80),
    items: z
      .array(
        z.object({
          title: z.string().min(0).max(60),
          text: z.string().min(0).max(240),
        }),
      )
      .max(12),
  }),
  testimonials: z.object({
    heading: z.string().min(0).max(80),
    items: z
      .array(
        z.object({
          name: z.string().min(0).max(60),
          title: z.string().max(80).optional(),
          text: z.string().min(0).max(320),
        }),
      )
      .max(12),
  }),
  faq: z.object({
    heading: z.string().min(0).max(80),
    items: z
      .array(
        z.object({
          q: z.string().min(0).max(120),
          a: z.string().min(0).max(500),
        }),
      )
      .max(20),
  }),
  footer: z.object({
    blurb: z.string().min(0).max(220),
    fineprint: z.string().max(120).optional(),
  }),
});

export type SiteContent = z.infer<typeof SiteContentSchema>;

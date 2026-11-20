import { z } from "zod";

const phone = z.string().trim().max(32).regex(/^[+\d\s()-]{6,}$/, "Please enter a valid phone number");
const dataImage = z.string().regex(/^data:image\/(png|jpe?g|webp);base64,/, "Invalid image").max(4_500_000, "Image is too large");

export const BUDGET_RANGES = ["Under $2,500", "$2,500 – $5,000", "$5,000 – $10,000", "$10,000 – $20,000", "$20,000+", "Not sure yet"] as const;

export const designSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(200),
  phone,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date"),
  location: z.string().trim().min(2, "Where will it take place?").max(200),
  guestCount: z.coerce.number().int().min(1).max(5000),
  budgetRange: z.enum(BUDGET_RANGES),
  concept: z.string().trim().max(2000).optional().default(""),
  specialRequests: z.string().trim().max(2000).optional().default(""),
  configuration: z.record(z.unknown()),
  previewImage: dataImage,
  preview3dImage: dataImage.optional(),
  references: z.array(z.object({ name: z.string().max(200), dataUrl: dataImage })).max(6).default([]),
  website: z.string().max(0).optional(), // honeypot
});

export const bookingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: phone.optional().or(z.literal("")),
  startsAt: z.string().datetime({ offset: true }),
  topic: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  website: z.string().max(0).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: phone.optional().or(z.literal("")),
  eventType: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(10, "A few more words, please").max(4000),
  website: z.string().max(0).optional(),
});

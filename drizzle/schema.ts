import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'
import type { ProjectEditorial } from '@/lib/projects'

export const projects = pgTable(
  'projects',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    year: text('year').notNull(),
    client: text('client').notNull(),
    image: text('image').notNull(),
    aspect: text('aspect').notNull(),
    colorized: boolean('colorized').notNull().default(false),
    visible: boolean('visible').notNull().default(true),
    order: integer('order').notNull().default(0),
    // Long-form magazine content (nullable — static registry is the fallback).
    editorial: jsonb('editorial').$type<ProjectEditorial | null>(),
  },
  (t) => [index('projects_visible_order_idx').on(t.visible, t.order)],
)

export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  client_name: text('client_name').notNull(),
  company: text('company').notNull(),
  role: text('role').notNull(),
  body: text('body').notNull(),
  rating: integer('rating').notNull().default(5),
  visible: boolean('visible').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const page_views = pgTable(
  'page_views',
  {
    id: serial('id').primaryKey(),
    path: text('path').notNull(),
    referrer: text('referrer'),
    country: text('country'),
    visited_at: timestamp('visited_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('page_views_path_idx').on(t.path),
    index('page_views_visited_at_idx').on(t.visited_at),
  ],
)

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Testimonial = typeof testimonials.$inferSelect
export type NewTestimonial = typeof testimonials.$inferInsert
export type PageView = typeof page_views.$inferSelect

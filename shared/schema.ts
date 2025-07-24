import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const lineGroups = pgTable("line_groups", {
  id: serial("id").primaryKey(),
  groupId: text("group_id").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  groupId: text("group_id").notNull(),
  keyword: text("keyword").notNull(),
  responseText: text("response_text").notNull(),
  images: json("images").$type<string[]>().notNull().default([]),
});

export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  targetGroups: json("target_groups").$type<string[]>().notNull(),
  message: text("message").notNull(),
  images: json("images").$type<string[]>().notNull().default([]),
  sentAt: text("sent_at").notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'auto_reply', 'broadcast', 'keyword_update'
  groupId: text("group_id"),
  message: text("message").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const insertLineGroupSchema = createInsertSchema(lineGroups).omit({ id: true });
export const insertKeywordSchema = createInsertSchema(keywords).omit({ id: true });
export const insertBroadcastSchema = createInsertSchema(broadcasts).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });

export type LineGroup = typeof lineGroups.$inferSelect;
export type InsertLineGroup = z.infer<typeof insertLineGroupSchema>;
export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Broadcast = typeof broadcasts.$inferSelect;
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

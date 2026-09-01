import { z } from "zod";

export const EMOJIS = ["❤️", "😊", "🥰", "😍", "💕", "😘", "🎉", "🔥", "😂", "👍", "💪", "🌟"] as const;

export const createPostSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000),
});

export const updatePostSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1).max(10000).optional(),
});

export const reactionSchema = z.object({
  emoji: z.enum(EMOJIS),
});
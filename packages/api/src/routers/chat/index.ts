import { conversations } from "@doca/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../index";
import { runDoctorSearchAgent } from "./helpers/agent/graph";
import { chatSystemRegistry } from "./helpers/chat-systems";
import type { Suggestion } from "./helpers/chat-systems";

export interface ChatMessage {
  content: string;
  id: string;
  role: "user" | "assistant" | "system";
  suggestions?: Suggestion[];
  system?: string;
  timestamp: string;
}

export const chatHttpRouter = {
  getConversations: protectedProcedure
    .input(z.object({}))
    .handler(async ({ context }) => {
      const userId = context.auth?.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      const results = await context.db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));
      return results;
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.number().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.auth?.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const [conversation] = await context.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found or access denied");
      }

      const key = `chat:${input.conversationId}:messages`;
      const messagesRaw = await context.chatMessagesKv.get(key);
      const allMessages: ChatMessage[] = messagesRaw
        ? JSON.parse(messagesRaw)
        : [];

      const reversed = [...allMessages].reverse();
      const start = input.cursor ?? 0;
      const end = start + input.limit;
      const items = reversed.slice(start, end);

      const nextCursor = end < reversed.length ? end : null;

      return {
        items,
        nextCursor,
      };
    }),

  getChatSystems: protectedProcedure.input(z.object({})).handler(async () => ({
    systems: chatSystemRegistry.getActive(),
  })),
};

export const chatWsRouter = {
  subscribeMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
      })
    )
    .handler(async function* ({ context, input }) {
      const userId = context.auth?.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const [conversation] = await context.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found or access denied");
      }

      yield { type: "connected", conversationId: input.conversationId };

      const key = `chat:${input.conversationId}:messages`;
      let lastCount = 0;

      while (true) {
        const messagesRaw = await context.chatMessagesKv.get(key);
        const messages: ChatMessage[] = messagesRaw
          ? JSON.parse(messagesRaw)
          : [];

        if (messages.length > lastCount) {
          const newMessages = messages.slice(lastCount);
          for (const msg of newMessages) {
            yield { type: "message", data: msg };
          }
          lastCount = messages.length;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(5000),
        conversationId: z.string().optional(),
        system: z.string().optional().default("doctor_search"),
      })
    )
    .handler(async function* ({ context, input }) {
      const userId = context.auth?.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      let conversationId = input.conversationId;

      if (conversationId) {
        const [conversation] = await context.db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conversationId))
          .limit(1);

        if (!conversation || conversation.userId !== userId) {
          throw new Error("Conversation not found or access denied");
        }

        await context.db
          .update(conversations)
          .set({ updatedAt: new Date().toISOString() })
          .where(eq(conversations.id, conversationId));
      } else {
        conversationId = crypto.randomUUID();
        await context.db.insert(conversations).values({
          id: conversationId,
          userId,
          title: input.message.slice(0, 50),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const key = `chat:${conversationId}:messages`;
      const messagesRaw = await context.chatMessagesKv.get(key);
      const allMessages: ChatMessage[] = messagesRaw
        ? JSON.parse(messagesRaw)
        : [];

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input.message,
        timestamp: new Date().toISOString(),
        system: input.system,
      };

      allMessages.push(userMessage);
      yield { type: "message", data: userMessage };

      // Get AI response based on system
      let assistantContent = "";
      let suggestions: Suggestion[] | undefined;
      if (input.system === "doctor_search") {
        try {
          const result = await runDoctorSearchAgent(input.message, context);
          assistantContent = result.content;
          suggestions = result.suggestions;
        } catch (e) {
          console.error("Agent error:", e, (e as Error).stack);
          assistantContent = "I'm sorry, I encountered an error while processing your request. Please try again.";
        }
      } else {
        assistantContent = "Chat system not configured";
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantContent,
        suggestions,
        timestamp: new Date().toISOString(),
        system: input.system,
      };

      allMessages.push(assistantMessage);
      await context.chatMessagesKv.put(key, JSON.stringify(allMessages));

      yield { type: "message", data: assistantMessage };
      yield { type: "done", conversationId };
    }),
};

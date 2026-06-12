import { type } from "@orpc/server"
import { protectedProcedure } from '../../../index'

export const getChatHistoryRoute = protectedProcedure
  .input(type<{ chatId: string }>())
  .handler(async ({ context, input }) => {
    if (!context.auth?.userId) {
      return { messages: [] }
    }

    try {
      const stored = await context.chatHistoryKv.get(
        `chat:${input.chatId}:${context.auth.userId}`,
        'text'
      )
      if (!stored) {
        return { messages: [] }
      }

      return { messages: JSON.parse(stored) as Array<{ role: string; content: string }> }
    } catch {
      return { messages: [] }
    }
  })

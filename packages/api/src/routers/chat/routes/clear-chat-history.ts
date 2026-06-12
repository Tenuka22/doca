import { type } from "@orpc/server"
import { protectedProcedure } from '../../../index'

export const clearChatHistoryRoute = protectedProcedure
  .input(type<{ chatId: string }>())
  .handler(async ({ context, input }) => {
    if (!context.auth?.userId) {
      return { ok: false }
    }

    await context.chatHistoryKv.delete(`chat:${input.chatId}:${context.auth.userId}`)

    return { ok: true }
  })

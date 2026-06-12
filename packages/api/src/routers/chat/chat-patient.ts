import { type } from "@orpc/server"
import type { UIMessage } from "ai"
import { publicProcedure } from "../../index"
import { streamChatWorkflow } from "../../services/chat-workflow"

function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export const chatPatient = publicProcedure
  .input(type<{ chatId: string; messages: UIMessage[] }>())
  .handler(async function* ({ context, input }) {
    const lastMsg = input.messages.at(-1)
    console.log("chatPatient:stream:start", { chatId: input.chatId, lastMsgRole: lastMsg?.role })

    try {
      const workflow = streamChatWorkflow(
        input.messages
          .slice(-1)
          .map((m) => ({
            role: m.role,
            content: getMessageText(m),
          })),
        {
          userId: context.auth?.userId ?? null,
          chatId: input.chatId,
          db: context.db,
          chatHistoryKv: context.chatHistoryKv,
          doctorEmbeddingsKv: context.doctorEmbeddingsKv,
        },
      )

      let eventCount = 0
      for await (const event of workflow) {
        eventCount++
        console.log("chatPatient:event", { type: event.type, eventCount })
        yield event
      }

      console.log("chatPatient:stream:end", { eventCount })
    } catch (error) {
      console.error("chatPatient:stream:error", error)
      throw error
    }
  })

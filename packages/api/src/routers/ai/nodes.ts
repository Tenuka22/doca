import type { BaseMessage } from "@langchain/core/messages";
import { SystemMessage } from "@langchain/core/messages";
import type { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { MessagesAnnotation } from "@langchain/langgraph";
import type { ToolNode } from "@langchain/langgraph/prebuilt";

type GraphState = typeof MessagesAnnotation.State;

export interface AgentConfig {
  llm: ChatGoogleGenerativeAI;
  systemPrompts: Record<string, string>;
  toolNode: ToolNode;
  tools: ReturnType<typeof import("./tools").createAiTools>;
}

export function createCoordinatorNode(config: AgentConfig) {
  return async (state: GraphState) => {
    const llm = config.llm.bindTools([config.tools.transferToAgent]);
    const result = await llm.invoke([
      new SystemMessage(config.systemPrompts.coordinator!),
      ...state.messages,
    ]);
    return { messages: [result] };
  };
}

export function createDbAgentNode(config: AgentConfig) {
  return async (state: GraphState) => {
    const tools = [
      config.tools.searchDoctors,
      config.tools.getDoctorProfile,
      config.tools.checkAvailability,
      config.tools.getUpcomingSessions,
    ].filter(Boolean);
    const llm = tools.length > 0 ? config.llm.bindTools(tools) : config.llm;
    const result = await llm.invoke([
      new SystemMessage(config.systemPrompts.db!),
      ...state.messages,
    ]);
    return { messages: [result] };
  };
}

export function createGeneralAgentNode(config: AgentConfig) {
  return async (state: GraphState) => {
    const tools = [
      config.tools.getWellnessInfo,
      config.tools.getStressTips,
    ].filter(Boolean);
    const llm = tools.length > 0 ? config.llm.bindTools(tools) : config.llm;
    const result = await llm.invoke([
      new SystemMessage(config.systemPrompts.general!),
      ...state.messages,
    ]);
    return { messages: [result] };
  };
}

export function createRouter(_config: AgentConfig) {
  return (state: GraphState) => {
    const last = state.messages[state.messages.length - 1] as BaseMessage & {
      tool_calls?: Array<{ name: string; args: Record<string, unknown> }>;
    };
    const calls = last?.tool_calls ?? [];
    if (calls.length === 0) {
      return "__end__";
    }
    const transfer = calls.find((tc) => tc.name === "transfer_to_agent");
    if (transfer) {
      const agent = transfer.args.agent;
      if (typeof agent === "string" && ["db", "general"].includes(agent)) {
        return agent;
      }
    }
    return "tools";
  };
}

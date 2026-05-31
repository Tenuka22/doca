import {
  completeWellnessActionRoute,
  getMoonlightCreditsRoute,
  getRecentTransactionsRoute,
  getSpriteStateRoute,
  getTodayTasksRoute,
  getWellnessHistoryRoute,
} from "./routes/index";

export const gamificationRouter = {
  getSpriteState: getSpriteStateRoute,
  completeWellnessAction: completeWellnessActionRoute,
  getMoonlightCredits: getMoonlightCreditsRoute,
  getWellnessHistory: getWellnessHistoryRoute,
  getRecentTransactions: getRecentTransactionsRoute,
  getTodayTasks: getTodayTasksRoute,
};

import { createHubChannelRoute } from "./routes/create-hub-channel";
import { deleteHubChannelRoute } from "./routes/delete-hub-channel";
import { getHubChannelRoute } from "./routes/get-hub-channel";
import { listHubChannelsRoute } from "./routes/list-hub-channels";
import { updateHubChannelRoute } from "./routes/update-hub-channel";

export const hubChannelsRouter = {
  createHubChannel: createHubChannelRoute,
  listHubChannels: listHubChannelsRoute,
  getHubChannel: getHubChannelRoute,
  updateHubChannel: updateHubChannelRoute,
  deleteHubChannel: deleteHubChannelRoute,
};

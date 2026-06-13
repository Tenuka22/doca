import { completeHubUploadRoute } from "./routes/complete-hub-upload";
import { getHubUploadStatusRoute } from "./routes/get-hub-upload-status";
import { initHubUploadRoute } from "./routes/init-hub-upload";
import { uploadHubChunkRoute } from "./routes/upload-hub-chunk";

export const hubUploadRouter = {
  initHubUpload: initHubUploadRoute,
  uploadHubChunk: uploadHubChunkRoute,
  completeHubUpload: completeHubUploadRoute,
  getHubUploadStatus: getHubUploadStatusRoute,
};

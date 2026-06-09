import { acknowledgeDownloadRoute } from "./routes/acknowledge-download";
import { getPatientStressDataGuardianRoute } from "./routes/get-patient-stress-data-guardian";
import { getStressDataRoute } from "./routes/get-stress-data";
import { guardianAcknowledgeDownloadRoute } from "./routes/guardian-acknowledge-download";
import { ingestIoTDataRoute } from "./routes/ingest-iot-data";
import { startSimulationRoute } from "./routes/start-simulation";
import { stopSimulationRoute } from "./routes/stop-simulation";
import { subscribePatientStressStreamRoute } from "./routes/subscribe-patient-stress-stream";
import { subscribeStressStreamRoute } from "./routes/subscribe-stress-stream";

export const stressHubRouter = {
  ingestIoTData: ingestIoTDataRoute,
  getStressData: getStressDataRoute,
  acknowledgeStressDownload: acknowledgeDownloadRoute,
  guardianAcknowledgeStressDownload: guardianAcknowledgeDownloadRoute,
  getPatientStressData: getPatientStressDataGuardianRoute,
  startStressSimulation: startSimulationRoute,
  stopStressSimulation: stopSimulationRoute,
  subscribeStressStream: subscribeStressStreamRoute,
  subscribePatientStressStream: subscribePatientStressStreamRoute,
};

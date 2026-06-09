import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStressStore } from "../in-memory-store";
import { getBundles, getRedis } from "../simulation";

export const getStressDataRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);
    const redis = getRedis();
    const store = getStressStore();

    const [bundles, buf] = await Promise.all([
      getBundles(redis, userId, 100),
      Promise.resolve(store.getBuffer(userId)),
    ]);

    return {
      bundles,
      totalSamples: buf?.totalSamples ?? 0,
      fetchedAt: Date.now(),
    };
  }
);

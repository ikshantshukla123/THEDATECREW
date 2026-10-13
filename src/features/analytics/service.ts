import "server-only";
import * as repo from "./repo";

export async function getDashboardAnalytics(matchmakerId: string) {
  const [kpis, pipeline, needsAttention, tiers] = await Promise.all([
    repo.getKpis(matchmakerId),
    repo.getPipeline(matchmakerId),
    repo.getNeedsAttention(matchmakerId),
    repo.getTierDistribution(matchmakerId),
  ]);
  return { kpis, pipeline, needsAttention, tiers };
}

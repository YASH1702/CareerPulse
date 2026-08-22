import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RecommendationFeed } from "@/components/recommendations/RecommendationFeed";
import { getRecommendations } from "@/actions/recommendations";

export const metadata: Metadata = { title: "Matches & Recommendations | JobPilot AI" };

export default async function RecommendationsPage() {
  const data = await getRecommendations();

  return (
    <div className="space-y-6">
      <DashboardHeader title="AI Recommendations" />
      <RecommendationFeed
        topMatches={data.topMatches}
        goodMatches={data.goodMatches}
        considerMatches={data.considerMatches}
        allMatches={data.allMatches}
        unanalyzedCount={data.unanalyzedCount}
      />
    </div>
  );
}
export interface TrendingTopic {
  id: string;
  category: string;
  tag: string;
  summary: string;
}

export const MOCK_TRENDING_TOPICS: TrendingTopic[] = [
  {
    id: "t-001",
    category: "Technology",
    tag: "#AIResearch",
    summary: "1.2k students discussing",
  },
  {
    id: "t-002",
    category: "Volunteering",
    tag: "#CleanupDrive",
    summary: "847 members joining",
  },
  {
    id: "t-003",
    category: "Entrepreneurship",
    tag: "#PitchNight",
    summary: "312 RSVPs this week",
  },
];

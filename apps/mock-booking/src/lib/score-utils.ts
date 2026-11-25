import { BookingReview, ReviewScores } from "./types";

export function getScoreLabel(score: number): string {
  if (score >= 9.0) return "Wonderful";
  if (score >= 8.5) return "Fabulous";
  if (score >= 8.0) return "Very Good";
  if (score >= 7.0) return "Good";
  if (score >= 6.0) return "Pleasant";
  return "Review score";
}

export function getCountryFlag(code?: string): string {
  switch (code) {
    case "GB":
      return "🇬🇧";
    case "AE":
      return "🇦🇪";
    case "IN":
      return "🇮🇳";
    case "QA":
      return "🇶🇦";
    case "DE":
      return "🇩🇪";
    case "FR":
      return "🇫🇷";
    case "SG":
      return "🇸🇬";
    default:
      return "🌍";
  }
}

export function computeCategoryAverages(reviews: BookingReview[]): {
  overall: number;
  categories: { key: keyof ReviewScores; label: string; score: number }[];
} {
  if (reviews.length === 0) {
    return {
      overall: 9.0,
      categories: [
        { key: "staff", label: "Staff", score: 9.2 },
        { key: "facilities", label: "Facilities", score: 9.3 },
        { key: "cleanliness", label: "Cleanliness", score: 9.4 },
        { key: "comfort", label: "Comfort", score: 9.5 },
        { key: "value_for_money", label: "Value for money", score: 8.5 },
        { key: "location", label: "Location", score: 9.0 },
        { key: "free_wifi", label: "Free Wifi", score: 9.6 },
      ],
    };
  }

  const sum = reviews.reduce(
    (acc, r) => {
      acc.overall += r.review_score;
      acc.staff += r.scores.staff;
      acc.facilities += r.scores.facilities;
      acc.cleanliness += r.scores.cleanliness;
      acc.comfort += r.scores.comfort;
      acc.value_for_money += r.scores.value_for_money;
      acc.location += r.scores.location;
      acc.free_wifi += r.scores.free_wifi ?? 9.5;
      return acc;
    },
    {
      overall: 0,
      staff: 0,
      facilities: 0,
      cleanliness: 0,
      comfort: 0,
      value_for_money: 0,
      location: 0,
      free_wifi: 0,
    }
  );

  const n = reviews.length;
  const round1 = (v: number) => Math.round((v / n) * 10) / 10;

  return {
    overall: round1(sum.overall),
    categories: [
      { key: "staff", label: "Staff", score: round1(sum.staff) },
      { key: "facilities", label: "Facilities", score: round1(sum.facilities) },
      { key: "cleanliness", label: "Cleanliness", score: round1(sum.cleanliness) },
      { key: "comfort", label: "Comfort", score: round1(sum.comfort) },
      {
        key: "value_for_money",
        label: "Value for money",
        score: round1(sum.value_for_money),
      },
      { key: "location", label: "Location", score: round1(sum.location) },
      { key: "free_wifi", label: "Free Wifi", score: round1(sum.free_wifi) },
    ],
  };
}


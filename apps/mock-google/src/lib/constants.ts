import { StarRating } from "@/types";

export const STAR_MAP: Record<StarRating, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export const NUMBER_TO_STAR: Record<number, StarRating> = {
  1: "ONE",
  2: "TWO",
  3: "THREE",
  4: "FOUR",
  5: "FIVE",
};

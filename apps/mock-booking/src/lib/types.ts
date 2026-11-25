export type PropertyId = "800101" | "800102" | "800103";

export type TravelerType = "Business" | "Couple" | "Family" | "Solo" | "Group";

export type ReplyStatus = "PENDING_MODERATION" | "PUBLISHED";

export interface ReviewReply {
  reply_id: string;
  created_timestamp: string;
  text: string;
  language_code: string;
  publish_after_ms: number;
  status: ReplyStatus;
}

export interface ReviewScores {
  cleanliness: number;
  comfort: number;
  location: number;
  facilities: number;
  staff: number;
  value_for_money: number;
  free_wifi?: number;
}

export interface ReviewContent {
  language_code: string;
  headline: string;
  positive: string;
  negative: string;
}

export interface BookingReview {
  review_id: string;
  property_id: PropertyId;
  reservation_id: string;
  reviewer_name: string;
  country?: string;
  country_code?: string;
  room_name?: string;
  stay_nights?: number;
  stay_date?: string;
  created_timestamp: string;
  last_change_timestamp: string;
  review_score: number;
  content: ReviewContent;
  scores: ReviewScores;
  traveler_type: TravelerType;
  topics?: string[];
  reply: ReviewReply | null;
}

export interface RoomOption {
  id: string;
  name: string;
  category: "room" | "suite";
  sizeSqm: number;
  bedInfo: string;
  maxGuests: number;
  priceInr: number;
  taxesInr: number;
  breakfastIncluded: boolean;
  freeCancellation: boolean;
  noPrepayment: boolean;
  highlights: string[];
  availableCount: number;
}

export interface PropertyInfo {
  property_id: PropertyId;
  canonical_id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  address: string;
  tagline: string;
  stars: number;
  baseReviewCount: number;
  breadcrumbCity: string;
  quoteHeader: string;
  descriptionParagraphs: string[];
  heroImages: {
    main: string;
    topRight: string;
    midRight: string;
    thumbs: string[];
    extraCount: number;
  };
  rooms: RoomOption[];
}


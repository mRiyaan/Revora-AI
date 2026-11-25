export type StarRating = "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";

export interface Reviewer {
  profilePhotoUrl: string;
  displayName: string;
  isAnonymous: boolean;
}

export interface ReviewReply {
  comment: string;
  updateTime: string;
}

export interface SubRatings {
  rooms?: number;
  service?: number;
  location?: number;
}

export interface GbpReview {
  reviewId: string;
  locationId: string;
  reviewer: Reviewer;
  starRating: StarRating;
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply: ReviewReply | null;
  tripType?: string;
  subRatings?: SubRatings;
  hotelHighlights?: string;
  noteworthyDetails?: string;
  roomDetails?: string;
  foodDetails?: string;
}

export interface HotelProperty {
  canonicalId: string;
  locationId: string;
  name: string;
  fullName: string;
  category: string;
  address: string;
  breadcrumbs: string[];
  city: string;
  searchTag: string;
  pricePerNight: number;
  priceDisplay: string;
  dates: string;
  amenities: string[];
  competitors: Array<{
    name: string;
    price: string;
    rating: number;
    reviews: string;
    badge: string;
    image: string;
  }>;
  otherTravelSites: Array<{
    platform: string;
    rating: string;
    reviews: string;
    icon: "tripadvisor" | "tripcom" | "booking";
  }>;
}

export interface ReviewsResponse {
  reviews: GbpReview[];
  averageRating: number;
  totalReviewCount: number;
  nextPageToken: string | null;
}

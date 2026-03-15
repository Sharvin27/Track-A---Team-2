export type PlacementTargetStatus =
  | "not_started"
  | "verified"
  | "pending_review"
  | "rejected";

export interface PlacementTarget {
  id: string;
  hotspotId?: string | null;
  name: string;
  zoneName: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  allowedFlyering: boolean;
  busyLevel: "low" | "medium" | "high";
  status: PlacementTargetStatus;
  latestSubmissionAt?: string | null;
  latestVerificationScore?: number | null;
  latestSubmissionId?: string | null;
  latestReviewReason?: string | null;
  verifiedCount?: number;
  expectedFlyerKeywords?: string[];
  campaignRef?: string | null;
}

export interface PlacementSubmissionResult {
  submissionId: string;
  targetId: string;
  hotspotId?: string;
  status: "verified" | "pending_review" | "rejected";
  verificationScore: number;
  reviewReason: string;
  verificationBreakdown: {
    gpsScore: number;
    ocrScore: number;
    qrScore: number;
    imageQualityScore: number;
    duplicateScore: number;
  };
  distanceMeters: number | null;
  ocrMatches: string[];
  qrDetected: boolean;
  qrValue: string | null;
  imageUrl: string;
}

export interface PlacementSubmission {
  id: string;
  targetId: string;
  hotspotId: string | null;
  userId: string;
  campaignRef: string | null;
  imagePath: string;
  imageHash: string;
  mimeType: string;
  fileSizeBytes: number;
  submittedAt: string;
  capturedAt: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  gpsAccuracy: number | null;
  distanceMeters: number | null;
  ocrText: string;
  ocrMatches: string[];
  qrDetected: boolean;
  qrValue: string | null;
  imageQualityScore: number;
  duplicateScore: number;
  gpsScore: number;
  ocrScore: number;
  qrScore: number;
  verificationScore: number;
  status: "verified" | "pending_review" | "rejected";
  reviewReason: string | null;
  notes: string | null;
}

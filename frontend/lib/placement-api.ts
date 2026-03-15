import type {
  PlacementSubmission,
  PlacementSubmissionResult,
  PlacementTarget,
} from "@/types/placement";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
};

export async function fetchPlacementTargets() {
  const payload = await request<ApiResponse<PlacementTarget[]>>(
    `${API_BASE}/api/placement-targets`,
  );
  return payload.data;
}

export async function fetchPlacementTarget(id: string) {
  const payload = await request<ApiResponse<PlacementTarget>>(
    `${API_BASE}/api/placement-targets/${encodeURIComponent(id)}`,
  );
  return payload.data;
}

export async function fetchPlacementSubmissions(targetId: string) {
  const payload = await request<ApiResponse<PlacementSubmission[]>>(
    `${API_BASE}/api/placement-targets/${encodeURIComponent(targetId)}/submissions`,
  );
  return payload.data;
}

export async function createPlacementSubmission(formData: FormData) {
  const payload = await request<ApiResponse<PlacementSubmissionResult>>(
    `${API_BASE}/api/placement-submissions`,
    {
      method: "POST",
      body: formData,
    },
  );

  return {
    ...payload.data,
    imageUrl: normalizeImageUrl(payload.data.imageUrl),
  };
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const payload = (await response.json()) as T & {
    success?: boolean;
    message?: string;
  };

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Placement request failed.");
  }

  return payload;
}

function normalizeImageUrl(imageUrl: string) {
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return `${API_BASE}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

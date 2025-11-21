import { toast } from "@/hooks/use-toast";
import { formatGetReqJson, removeNulls } from "@/services/utils";
import { FeatureFlag, CreateFeatureFlagRequest, UpdateFeatureFlagRequest } from "@/models/featureFlags/featureFlag";

interface FeatureFlagsResponse {
  data?: FeatureFlag[];
  amount?: number;
  pagination?: {
    page_size: number;
    page_number: number;
    total_pages: number;
  };
  error?: string;
}

export async function handleFetchFeatureFlags(
  token: string,
  page_number: number,
  page_size: number
): Promise<FeatureFlagsResponse> {
  try {
    const params = {
      page_number,
      page_size,
    };

    removeNulls(params);

    const rawResponse = await fetch(
      `/api/feature-flags?${formatGetReqJson(params)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const response = (await rawResponse.json()) as FeatureFlagsResponse;
    return response;
  } catch (e) {
    toast({
      title: "Error fetching feature flags",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Feature Flags error", e);
    return { error: "Failed to fetch feature flags" };
  }
}

export async function handleCreateFeatureFlag(
  token: string,
  featureFlagData: CreateFeatureFlagRequest
): Promise<{ data?: FeatureFlag; error?: string }> {
  try {
    const rawResponse = await fetch(`/api/feature-flags`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(featureFlagData),
    });

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create feature flag");
    }

    const response = (await rawResponse.json()) as { data: FeatureFlag };
    return response;
  } catch (e: any) {
    toast({
      title: e.message || "Error creating feature flag",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Feature Flags error", e);
    return { error: e.message || "Failed to create feature flag" };
  }
}

export async function handleFetchFeatureFlagById(
  token: string,
  featureFlagId: string
): Promise<{ data?: FeatureFlag; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/feature-flags/${featureFlagId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch feature flag");
    }

    // The API returns the feature flag directly, not wrapped in { data: ... }
    const featureFlag = (await rawResponse.json()) as FeatureFlag;
    return { data: featureFlag };
  } catch (e: any) {
    toast({
      title: e.message || "Error fetching feature flag",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Feature Flags error", e);
    return { error: e.message || "Failed to fetch feature flag" };
  }
}

export async function handleUpdateFeatureFlag(
  token: string,
  featureFlagId: string,
  featureFlagData: UpdateFeatureFlagRequest
): Promise<{ data?: FeatureFlag; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/feature-flags/${featureFlagId}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(featureFlagData),
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update feature flag");
    }

    const response = (await rawResponse.json()) as { data: FeatureFlag };
    return response;
  } catch (e: any) {
    toast({
      title: e.message || "Error updating feature flag",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Feature Flags error", e);
    return { error: e.message || "Failed to update feature flag" };
  }
}

export async function handleDeleteFeatureFlag(
  token: string,
  featureFlagId: string
): Promise<{ error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/feature-flags/${featureFlagId}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to delete feature flag");
    }

    return {};
  } catch (e: any) {
    toast({
      title: e.message || "Error deleting feature flag",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Feature Flags error", e);
    return { error: e.message || "Failed to delete feature flag" };
  }
}


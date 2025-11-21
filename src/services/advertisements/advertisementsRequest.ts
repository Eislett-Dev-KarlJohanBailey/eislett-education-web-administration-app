import { toast } from "@/hooks/use-toast";
import { formatGetReqJson, removeNulls } from "@/services/utils";
import { Advertisement, CreateAdvertisementRequest, UpdateAdvertisementRequest } from "@/models/advertisements/advertisement";

interface AdvertisementsResponse {
  data?: Advertisement[];
  amount?: number;
  pagination?: {
    page_size: number;
    page_number: number;
    total_pages: number;
  };
  error?: string;
}

export async function handleFetchAdvertisements(
  token: string,
  page_number: number,
  page_size: number
): Promise<AdvertisementsResponse> {
  try {
    const params = {
      page_number,
      page_size,
    };

    removeNulls(params);

    const rawResponse = await fetch(
      `/api/advertisements?${formatGetReqJson(params)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const response = (await rawResponse.json()) as AdvertisementsResponse;
    return response;
  } catch (e) {
    toast({
      title: "Error fetching advertisements",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Advertisements error", e);
    return { error: "Failed to fetch advertisements" };
  }
}

export async function handleCreateAdvertisement(
  token: string,
  advertisementData: CreateAdvertisementRequest
): Promise<{ data?: Advertisement; error?: string }> {
  try {
    const formData = new FormData();
    
    // Append required fields
    formData.append("image", advertisementData.image);
    formData.append("title", advertisementData.title);
    formData.append("description", advertisementData.description);
    formData.append("type", advertisementData.type);
    formData.append("mediaAlt", advertisementData.mediaAlt);
    formData.append("placements", advertisementData.placements);

    // Append optional fields
    if (advertisementData.ctaLabel) {
      formData.append("ctaLabel", advertisementData.ctaLabel);
    }
    if (advertisementData.ctaUrl) {
      formData.append("ctaUrl", advertisementData.ctaUrl);
    }
    if (advertisementData.rules) {
      formData.append("rules", advertisementData.rules);
    }
    if (advertisementData.timePeriodStart) {
      formData.append("timePeriodStart", advertisementData.timePeriodStart);
    }
    if (advertisementData.timePeriodEnd) {
      formData.append("timePeriodEnd", advertisementData.timePeriodEnd);
    }
    if (advertisementData.active !== undefined) {
      formData.append("active", advertisementData.active.toString());
    }

    const rawResponse = await fetch(`/api/advertisements`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type, let browser set it with boundary for FormData
      },
      body: formData,
    });

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create advertisement");
    }

    const response = (await rawResponse.json()) as { data: Advertisement };
    return response;
  } catch (e: any) {
    toast({
      title: e.message || "Error creating advertisement",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Advertisements error", e);
    return { error: e.message || "Failed to create advertisement" };
  }
}

export async function handleFetchAdvertisementById(
  token: string,
  advertisementId: string
): Promise<{ data?: Advertisement; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/advertisements/${advertisementId}`,
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
      throw new Error(errorData.error || "Failed to fetch advertisement");
    }

    // The API returns the advertisement directly, not wrapped in { data: ... }
    const advertisement = (await rawResponse.json()) as Advertisement;
    return { data: advertisement };
  } catch (e: any) {
    toast({
      title: e.message || "Error fetching advertisement",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Advertisements error", e);
    return { error: e.message || "Failed to fetch advertisement" };
  }
}

export async function handleUpdateAdvertisement(
  token: string,
  advertisementId: string,
  advertisementData: UpdateAdvertisementRequest
): Promise<{ data?: Advertisement; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/advertisements/${advertisementId}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(advertisementData),
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update advertisement");
    }

    const response = (await rawResponse.json()) as { data: Advertisement };
    return response;
  } catch (e: any) {
    toast({
      title: e.message || "Error updating advertisement",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Advertisements error", e);
    return { error: e.message || "Failed to update advertisement" };
  }
}


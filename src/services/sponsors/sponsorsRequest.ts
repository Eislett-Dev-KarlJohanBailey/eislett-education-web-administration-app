import { toast } from "@/hooks/use-toast";
import { formatGetReqJson, removeNulls } from "@/services/utils";
import { Sponsor, CreateSponsorRequest, UpdateSponsorRequest } from "@/models/sponsors/sponsor";

interface SponsorsResponse {
  data?: Sponsor[];
  amount?: number;
  pagination?: {
    page_size: number;
    page_number: number;
    total_pages: number;
  };
  error?: string;
}

export async function handleFetchSponsors(
  token: string,
  page_number: number,
  page_size: number
): Promise<SponsorsResponse> {
  try {
    const params = {
      page_number,
      page_size,
    };

    removeNulls(params);

    const rawResponse = await fetch(
      `/api/sponsors?${formatGetReqJson(params)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const response = (await rawResponse.json()) as SponsorsResponse;
    return response;
  } catch (e) {
    toast({
      title: "Error fetching sponsors",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Sponsors error", e);
    return { error: "Failed to fetch sponsors" };
  }
}

export async function handleCreateSponsor(
  token: string,
  sponsorData: CreateSponsorRequest
): Promise<{ data?: Sponsor; error?: string }> {
  try {
    const formData = new FormData();
    
    // Append required fields
    formData.append("logo", sponsorData.logo);
    formData.append("title", sponsorData.title);
    formData.append("description", sponsorData.description);
    formData.append("logoAlt", sponsorData.logoAlt);
    formData.append("websiteUrl", sponsorData.websiteUrl);

    // Append optional fields
    if (sponsorData.rules) {
      formData.append("rules", sponsorData.rules);
    }
    if (sponsorData.timePeriodStart) {
      formData.append("timePeriodStart", sponsorData.timePeriodStart);
    }
    if (sponsorData.timePeriodEnd) {
      formData.append("timePeriodEnd", sponsorData.timePeriodEnd);
    }
    if (sponsorData.active !== undefined) {
      formData.append("active", sponsorData.active.toString());
    }

    const rawResponse = await fetch(`/api/sponsors`, {
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
      throw new Error(errorData.error || "Failed to create sponsor");
    }

    const response = (await rawResponse.json()) as { data: Sponsor };
    return response;
  } catch (e: any) {
    toast({
      title: e.message || "Error creating sponsor",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Sponsors error", e);
    return { error: e.message || "Failed to create sponsor" };
  }
}

export async function handleFetchSponsorById(
  token: string,
  sponsorId: string
): Promise<{ data?: Sponsor; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/sponsors/${sponsorId}`,
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
      throw new Error(errorData.error || "Failed to fetch sponsor");
    }

    // The API returns the sponsor directly, not wrapped in { data: ... }
    const sponsor = (await rawResponse.json()) as Sponsor;
    return { data: sponsor };
  } catch (e: any) {
    toast({
      title: e.message || "Error fetching sponsor",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Sponsors error", e);
    return { error: e.message || "Failed to fetch sponsor" };
  }
}

export async function handleUpdateSponsor(
  token: string,
  sponsorId: string,
  sponsorData: UpdateSponsorRequest
): Promise<{ data?: Sponsor; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/sponsors/${sponsorId}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sponsorData),
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update sponsor");
    }

    const response = (await rawResponse.json()) as { data: Sponsor };
    return response;
  } catch (e: any) {
    toast({
      title: e.message || "Error updating sponsor",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Sponsors error", e);
    return { error: e.message || "Failed to update sponsor" };
  }
}

export async function handleDeleteSponsor(
  token: string,
  sponsorId: string
): Promise<{ deleted?: boolean; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/sponsors/${sponsorId}`,
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
      throw new Error(errorData.error || "Failed to delete sponsor");
    }

    return { deleted: true };
  } catch (e: any) {
    toast({
      title: e.message || "Error deleting sponsor",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Sponsors error", e);
    return { error: e.message || "Failed to delete sponsor" };
  }
}


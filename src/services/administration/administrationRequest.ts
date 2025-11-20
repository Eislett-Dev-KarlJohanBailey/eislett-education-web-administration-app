import { toast } from "@/hooks/use-toast";
import { AuthUserDetails } from "@/models/Auth/authUserDetails";

export async function handleFetchCurrentUser(
  token: string
): Promise<{ data?: AuthUserDetails; error?: string }> {
  try {
    const rawResponse = await fetch(`/api/administrators/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch user details");
    }

    const response = (await rawResponse.json()) as AuthUserDetails;
    return { data: response };
  } catch (e: any) {
    console.log("Administration error", e);
    return { error: e.message || "Failed to fetch user details" };
  }
}


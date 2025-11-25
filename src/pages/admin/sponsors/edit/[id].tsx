import { useEffect, useState, useCallback, useContext } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { handleFetchSponsorById, handleUpdateSponsor } from "@/services/sponsors/sponsorsRequest";
import { UpdateSponsorRequest } from "@/models/sponsors/sponsor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SponsorTargetingRule, Sponsor } from "@/models/sponsors/sponsor";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { MediaPicker } from "@/components/data/MediaPicker";

const RULE_TYPES: SponsorTargetingRule["type"][] = [
  "country",
  "student",
  "teacher",
  "cidr",
  "school",
  "grade",
  "user_type",
];

export default function EditSponsorPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());
  const { id } = router.query;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<UpdateSponsorRequest>({
    title: "",
    description: "",
    logoUrl: "",
    logoAlt: "",
    websiteUrl: "",
    active: true,
  });
  const [rules, setRules] = useState<SponsorTargetingRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<SponsorTargetingRule>>({
    type: "country",
    value: "",
    rollout: 100,
  });

  // Fetch sponsor by ID
  useEffect(() => {
    if (!router.isReady || !id || !authContext?.token) return;

    const fetchSponsor = async () => {
      setIsLoading(true);
      try {
        const response = await handleFetchSponsorById(authContext.token, id as string);

        if (response.error) {
          toast({
            title: response.error,
            style: { background: "red", color: "white" },
            duration: 3500,
          });
          router.push("/admin/sponsors");
        } else if (response.data) {
          const sponsor = response.data;
          console.log("Fetched sponsor:", sponsor);
          setFormData({
            title: sponsor.title || "",
            description: sponsor.description || "",
            logoUrl: sponsor.logoUrl || "",
            logoAlt: sponsor.logoAlt || "",
            websiteUrl: sponsor.websiteUrl || "",
            timePeriod: sponsor.timePeriod,
            active: sponsor.active ?? true,
          });
          setRules(sponsor.rules || []);
        }
      } catch (error) {
        console.error("Error fetching sponsor:", error);
        toast({
          title: "Error fetching sponsor",
          style: { background: "red", color: "white" },
          duration: 3500,
        });
        router.push("/admin/sponsors");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSponsor();
  }, [router.isReady, id, authContext?.token, router]);

  const handleFormChange = useCallback((field: keyof UpdateSponsorRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addRule = useCallback(() => {
    if (newRule.type && newRule.value !== undefined && newRule.value !== "") {
      setRules((prev) => [...prev, newRule as SponsorTargetingRule]);
      setNewRule({ type: "country", value: "", rollout: 100 });
    }
  }, [newRule]);

  const removeRule = useCallback((index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle media selection from MediaPicker
  const handleMediaSelect = useCallback((markdown: string) => {
    // Extract URL from markdown format: ![name](url "name")
    const urlMatch = markdown.match(/!\[.*?\]\((.*?)(?:\s+"[^"]*")?\)/);
    if (urlMatch && urlMatch[1]) {
      const url = urlMatch[1];
      handleFormChange("logoUrl", url);
      
      toast({
        title: "Logo URL updated",
        description: "Logo URL has been set from the selected image",
      });
    }
  }, [handleFormChange]);

  const handleFormSubmit = useCallback(async () => {
    if (!authContext?.token || !id) {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      // Build update data with all fields (all optional)
      const updateData: UpdateSponsorRequest = {
        title: formData.title,
        description: formData.description,
        logoUrl: formData.logoUrl,
        logoAlt: formData.logoAlt,
        websiteUrl: formData.websiteUrl,
        rules: rules,
        timePeriod: formData.timePeriod,
        active: formData.active,
      };

      const response = await handleUpdateSponsor(authContext.token, id as string, updateData);

      if (response.error) {
        toast({
          title: response.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      } else {
        toast({
          title: "Sponsor updated successfully!",
          style: { background: "green", color: "white" },
          duration: 3500,
        });
        router.push("/admin/sponsors");
      }
    } catch (error) {
      console.error("Error updating sponsor:", error);
      toast({
        title: "Error updating sponsor",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [authContext?.token, formData, rules, router, id]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading sponsor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/sponsors")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Sponsor</h1>
            <p className="text-muted-foreground">Update sponsor details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sponsor Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.logoUrl && (
              <div className="space-y-2">
                <Label>Current Logo</Label>
                <div className="border rounded-lg p-4">
                  <img
                    src={formData.logoUrl}
                    alt={formData.logoAlt || "Sponsor"}
                    className="max-w-md h-auto rounded"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <MediaPicker onInsert={handleMediaSelect} />
              </div>
              <Input
                id="logoUrl"
                value={formData.logoUrl || ""}
                onChange={(e) => handleFormChange("logoUrl", e.target.value)}
                placeholder="Enter logo URL or use the upload button"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                placeholder="Sponsor title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Sponsor description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoAlt">Logo Alt Text</Label>
              <Input
                id="logoAlt"
                value={formData.logoAlt}
                onChange={(e) => handleFormChange("logoAlt", e.target.value)}
                placeholder="Alt text for the logo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleFormChange("websiteUrl", e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Targeting Rules</Label>
              <div className="space-y-2 border p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-2">
                  <Select
                    value={newRule.type}
                    onValueChange={(value) => setNewRule({ ...newRule, type: value as SponsorTargetingRule["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    value={newRule.value || ""}
                    onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Rollout %"
                    value={newRule.rollout || 100}
                    onChange={(e) => setNewRule({ ...newRule, rollout: parseInt(e.target.value) || 100 })}
                    min="0"
                    max="100"
                  />
                  <Button type="button" onClick={addRule} variant="outline">
                    Add Rule
                  </Button>
                </div>
                {rules.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {rules.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Badge variant="secondary">{rule.type}</Badge>
                        <span className="text-sm">{rule.value}</span>
                        {rule.rollout !== undefined && (
                          <span className="text-sm text-muted-foreground">({rule.rollout}%)</span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(index)}
                          className="ml-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timePeriodStart">Time Period Start</Label>
                <Input
                  id="timePeriodStart"
                  type="datetime-local"
                  value={formData.timePeriod?.start ? new Date(formData.timePeriod.start).toISOString().slice(0, 16) : ""}
                  onChange={(e) => {
                    const start = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                    handleFormChange("timePeriod", {
                      start: start || "",
                      end: formData.timePeriod?.end || "",
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timePeriodEnd">Time Period End</Label>
                <Input
                  id="timePeriodEnd"
                  type="datetime-local"
                  value={formData.timePeriod?.end ? new Date(formData.timePeriod.end).toISOString().slice(0, 16) : ""}
                  onChange={(e) => {
                    const end = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                    handleFormChange("timePeriod", {
                      start: formData.timePeriod?.start || "",
                      end: end || "",
                    });
                  }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active ?? true}
                onCheckedChange={(checked) => handleFormChange("active", checked)}
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/sponsors")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleFormSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Sponsor"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


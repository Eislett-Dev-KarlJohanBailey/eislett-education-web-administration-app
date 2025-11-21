import { useEffect, useState, useCallback, useContext } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { handleFetchAdvertisementById, handleUpdateAdvertisement } from "@/services/advertisements/advertisementsRequest";
import { UpdateAdvertisementRequest } from "@/models/advertisements/advertisement";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdPlacement, AdvertismentTargetingRule, Advertisement } from "@/models/advertisements/advertisement";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const AD_PLACEMENTS: AdPlacement[] = [
  "strand_rhs",
  "section_rhs",
  "quizzes_rhs",
  "sidebar",
];

const RULE_TYPES: AdvertismentTargetingRule["type"][] = [
  "country",
  "student",
  "teacher",
  "percentage",
  "cidr",
  "school",
  "grade",
  "user_type",
];

export default function EditAdvertisementPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());
  const { id } = router.query;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<UpdateAdvertisementRequest>({
    title: "",
    description: "",
    type: "",
    mediaAlt: "",
    placements: [],
    active: true,
  });
  const [selectedPlacements, setSelectedPlacements] = useState<AdPlacement[]>([]);
  const [rules, setRules] = useState<AdvertismentTargetingRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<AdvertismentTargetingRule>>({
    type: "country",
    value: "",
    rollout: 100,
  });

  // Fetch advertisement by ID
  useEffect(() => {
    if (!router.isReady || !id || !authContext?.token) return;

    const fetchAdvertisement = async () => {
      setIsLoading(true);
      try {
        const response = await handleFetchAdvertisementById(authContext.token, id as string);

        if (response.error) {
          toast({
            title: response.error,
            style: { background: "red", color: "white" },
            duration: 3500,
          });
          router.push("/admin/advertisements");
        } else if (response.data) {
          const ad = response.data;
          console.log("Fetched advertisement:", ad);
          setFormData({
            title: ad.title || "",
            description: ad.description || "",
            type: ad.type || "",
            mediaUrl: ad.mediaUrl,
            mediaAlt: ad.mediaAlt || "",
            mediaType: ad.mediaType,
            mediaSize: ad.mediaSize,
            active: ad.active ?? true,
          });
          setSelectedPlacements(ad.placements || []);
          setRules(ad.rules || []);
        }
      } catch (error) {
        console.error("Error fetching advertisement:", error);
        toast({
          title: "Error fetching advertisement",
          style: { background: "red", color: "white" },
          duration: 3500,
        });
        router.push("/admin/advertisements");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvertisement();
  }, [router.isReady, id, authContext?.token, router]);

  const handleFormChange = useCallback((field: keyof UpdateAdvertisementRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const togglePlacement = useCallback((placement: AdPlacement) => {
    setSelectedPlacements((prev) => {
      if (prev.includes(placement)) {
        return prev.filter((p) => p !== placement);
      }
      return [...prev, placement];
    });
  }, []);

  const addRule = useCallback(() => {
    if (newRule.type && newRule.value !== undefined && newRule.value !== "") {
      setRules((prev) => [...prev, newRule as AdvertismentTargetingRule]);
      setNewRule({ type: "country", value: "", rollout: 100 });
    }
  }, [newRule]);

  const removeRule = useCallback((index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFormSubmit = useCallback(async () => {
    if (!authContext?.token || !id) {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      // Build update data with all fields (all optional)
      const updateData: UpdateAdvertisementRequest = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        mediaUrl: formData.mediaUrl,
        mediaAlt: formData.mediaAlt,
        mediaType: formData.mediaType,
        mediaSize: formData.mediaSize,
        rules: rules,
        active: formData.active,
        placements: selectedPlacements,
      };

      const response = await handleUpdateAdvertisement(authContext.token, id as string, updateData);

      if (response.error) {
        toast({
          title: response.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      } else {
        toast({
          title: "Advertisement updated successfully!",
          style: { background: "green", color: "white" },
          duration: 3500,
        });
        router.push("/admin/advertisements");
      }
    } catch (error) {
      console.error("Error updating advertisement:", error);
      toast({
        title: "Error updating advertisement",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [authContext?.token, formData, selectedPlacements, rules, router, id]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading advertisement...</p>
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
            onClick={() => router.push("/admin/advertisements")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Advertisement</h1>
            <p className="text-muted-foreground">Update advertisement details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Advertisement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.mediaUrl && (
              <div className="space-y-2">
                <Label>Current Image</Label>
                <div className="border rounded-lg p-4">
                  <img
                    src={formData.mediaUrl}
                    alt={formData.mediaAlt || "Advertisement"}
                    className="max-w-md h-auto rounded"
                  />
                  {formData.mediaSize && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Size: {formData.mediaSize}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                placeholder="Advertisement title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Advertisement description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => handleFormChange("type", e.target.value)}
                placeholder="e.g., image/png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mediaAlt">Media Alt Text</Label>
              <Input
                id="mediaAlt"
                value={formData.mediaAlt}
                onChange={(e) => handleFormChange("mediaAlt", e.target.value)}
                placeholder="Alt text for the image"
              />
            </div>

            <div className="space-y-2">
              <Label>Placements</Label>
              <div className="flex flex-wrap gap-2">
                {AD_PLACEMENTS.map((placement) => (
                  <Badge
                    key={placement}
                    variant={selectedPlacements.includes(placement) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePlacement(placement)}
                  >
                    {placement.replace("_", " ")}
                  </Badge>
                ))}
              </div>
              {selectedPlacements.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedPlacements.map(p => p.replace("_", " ")).join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Targeting Rules</Label>
              <div className="space-y-2 border p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-2">
                  <Select
                    value={newRule.type}
                    onValueChange={(value) => setNewRule({ ...newRule, type: value as AdvertismentTargetingRule["type"] })}
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
                onClick={() => router.push("/admin/advertisements")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleFormSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Advertisement"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


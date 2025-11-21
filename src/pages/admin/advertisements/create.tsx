import { useState, useCallback, useContext } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { handleCreateAdvertisement } from "@/services/advertisements/advertisementsRequest";
import { CreateAdvertisementRequest } from "@/models/advertisements/advertisement";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdPlacement, AdvertismentTargetingRule } from "@/models/advertisements/advertisement";
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

export default function CreateAdvertisementPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateAdvertisementRequest>>({
    title: "",
    description: "",
    type: "",
    mediaAlt: "",
    placements: "",
    ctaLabel: "",
    ctaUrl: "",
    rules: "",
    timePeriodStart: "",
    timePeriodEnd: "",
    active: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPlacements, setSelectedPlacements] = useState<AdPlacement[]>([]);
  const [rules, setRules] = useState<AdvertismentTargetingRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<AdvertismentTargetingRule>>({
    type: "country",
    value: "",
    rollout: 100,
  });

  const handleFormChange = useCallback((field: keyof CreateAdvertisementRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
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
    if (!authContext?.token) {
      setIsSubmitting(false);
      return;
    }

    if (!selectedImage) {
      toast({
        title: "Image is required",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.title?.trim()) {
      toast({
        title: "Title is required",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.description?.trim()) {
      toast({
        title: "Description is required",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.type?.trim()) {
      toast({
        title: "Type is required",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.mediaAlt?.trim()) {
      toast({
        title: "Media Alt is required",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    if (selectedPlacements.length === 0) {
      toast({
        title: "At least one placement is required",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const advertisementData: CreateAdvertisementRequest = {
        image: selectedImage,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        mediaAlt: formData.mediaAlt,
        placements: JSON.stringify(selectedPlacements),
        ctaLabel: formData.ctaLabel || undefined,
        ctaUrl: formData.ctaUrl || undefined,
        rules: rules.length > 0 ? JSON.stringify(rules) : undefined,
        timePeriodStart: formData.timePeriodStart || undefined,
        timePeriodEnd: formData.timePeriodEnd || undefined,
        active: formData.active ?? true,
      };

      const response = await handleCreateAdvertisement(authContext.token, advertisementData);

      if (response.error) {
        toast({
          title: response.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      } else {
        toast({
          title: "Advertisement created successfully!",
          style: { background: "green", color: "white" },
          duration: 3500,
        });
        router.push("/admin/advertisements");
      }
    } catch (error) {
      console.error("Error creating advertisement:", error);
      toast({
        title: "Error creating advertisement",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [authContext?.token, formData, selectedImage, selectedPlacements, rules, router]);

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
            <h1 className="text-2xl font-bold">Create Advertisement</h1>
            <p className="text-muted-foreground">Create a new advertisement campaign</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Advertisement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="image">Image *</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
              {selectedImage && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedImage.name} ({(selectedImage.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                placeholder="Advertisement title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Advertisement description"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => handleFormChange("type", e.target.value)}
                placeholder="e.g., banner, popup, sidebar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mediaAlt">Media Alt Text *</Label>
              <Input
                id="mediaAlt"
                value={formData.mediaAlt}
                onChange={(e) => handleFormChange("mediaAlt", e.target.value)}
                placeholder="Alt text for the image"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Placements *</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ctaLabel">CTA Label</Label>
                <Input
                  id="ctaLabel"
                  value={formData.ctaLabel}
                  onChange={(e) => handleFormChange("ctaLabel", e.target.value)}
                  placeholder="Call to action label"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaUrl">CTA URL</Label>
                <Input
                  id="ctaUrl"
                  value={formData.ctaUrl}
                  onChange={(e) => handleFormChange("ctaUrl", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Targeting Rules</Label>
              <div className="space-y-2 border p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-2">
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value as AdvertismentTargetingRule["type"] })}
                    className="px-3 py-2 border rounded-md"
                  >
                    {RULE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
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
                  value={formData.timePeriodStart}
                  onChange={(e) => handleFormChange("timePeriodStart", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timePeriodEnd">Time Period End</Label>
                <Input
                  id="timePeriodEnd"
                  type="datetime-local"
                  value={formData.timePeriodEnd}
                  onChange={(e) => handleFormChange("timePeriodEnd", e.target.value)}
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
                onClick={() => router.push("/admin/advertisements")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleFormSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Advertisement"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


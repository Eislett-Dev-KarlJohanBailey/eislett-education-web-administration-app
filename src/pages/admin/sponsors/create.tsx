import { useState, useCallback, useContext } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { handleCreateSponsor } from "@/services/sponsors/sponsorsRequest";
import { CreateSponsorRequest } from "@/models/sponsors/sponsor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SponsorTargetingRule } from "@/models/sponsors/sponsor";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const RULE_TYPES: SponsorTargetingRule["type"][] = [
  "country",
  "student",
  "teacher",
  "cidr",
  "school",
  "grade",
  "user_type",
];

export default function CreateSponsorPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateSponsorRequest>>({
    title: "",
    description: "",
    logoAlt: "",
    websiteUrl: "",
    rules: "",
    timePeriodStart: "",
    timePeriodEnd: "",
    active: true,
  });
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [rules, setRules] = useState<SponsorTargetingRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<SponsorTargetingRule>>({
    type: "country",
    value: "",
    rollout: 100,
  });

  const handleFormChange = useCallback((field: keyof CreateSponsorRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogo(file);
    }
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

  const handleFormSubmit = useCallback(async () => {
    if (!authContext?.token) {
      setIsSubmitting(false);
      return;
    }

    if (!selectedLogo) {
      toast({
        title: "Logo is required",
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

    if (!formData.logoAlt?.trim()) {
      toast({
        title: "Logo Alt is required",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.websiteUrl?.trim()) {
      toast({
        title: "Website URL is required",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const sponsorData: CreateSponsorRequest = {
        logo: selectedLogo,
        title: formData.title,
        description: formData.description,
        logoAlt: formData.logoAlt,
        websiteUrl: formData.websiteUrl,
        rules: rules.length > 0 ? JSON.stringify(rules) : undefined,
        timePeriodStart: formData.timePeriodStart || undefined,
        timePeriodEnd: formData.timePeriodEnd || undefined,
        active: formData.active ?? true,
      };

      const response = await handleCreateSponsor(authContext.token, sponsorData);

      if (response.error) {
        toast({
          title: response.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      } else {
        toast({
          title: "Sponsor created successfully!",
          style: { background: "green", color: "white" },
          duration: 3500,
        });
        router.push("/admin/sponsors");
      }
    } catch (error) {
      console.error("Error creating sponsor:", error);
      toast({
        title: "Error creating sponsor",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [authContext?.token, formData, selectedLogo, rules, router]);

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
            <h1 className="text-2xl font-bold">Create Sponsor</h1>
            <p className="text-muted-foreground">Create a new sponsor partnership</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sponsor Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo *</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                required
              />
              {selectedLogo && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedLogo.name} ({(selectedLogo.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                placeholder="Sponsor title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Sponsor description"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoAlt">Logo Alt Text *</Label>
              <Input
                id="logoAlt"
                value={formData.logoAlt}
                onChange={(e) => handleFormChange("logoAlt", e.target.value)}
                placeholder="Alt text for the logo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL *</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleFormChange("websiteUrl", e.target.value)}
                placeholder="https://example.com"
                required
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
                onClick={() => router.push("/admin/sponsors")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleFormSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Sponsor"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


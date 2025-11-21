import { useEffect, useState, useCallback, useContext } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { handleFetchFeatureFlagById, handleUpdateFeatureFlag } from "@/services/featureFlags/featureFlagsRequest";
import { UpdateFeatureFlagRequest } from "@/models/featureFlags/featureFlag";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeatureFlagRule, FeatureFlag } from "@/models/featureFlags/featureFlag";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const RULE_TYPES: FeatureFlagRule["type"][] = [
  "country",
  "student",
  "teacher",
  "user_type",
  "role",
  "percentage",
  "always_on",
  "always_off",
  "cidr",
  "school",
  "grade",
];

export default function EditFeatureFlagPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());
  const { id } = router.query;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<UpdateFeatureFlagRequest>({
    key: "",
    enabled: true,
    description: "",
  });
  const [rules, setRules] = useState<FeatureFlagRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<FeatureFlagRule>>({
    type: "country",
    value: "",
    rollout: 100,
  });

  // Fetch feature flag by ID
  useEffect(() => {
    if (!router.isReady || !id || !authContext?.token) return;

    const fetchFeatureFlag = async () => {
      setIsLoading(true);
      try {
        const response = await handleFetchFeatureFlagById(authContext.token, id as string);

        if (response.error) {
          toast({
            title: response.error,
            style: { background: "red", color: "white" },
            duration: 3500,
          });
          router.push("/admin/feature-flags");
        } else if (response.data) {
          const flag = response.data;
          console.log("Fetched feature flag:", flag);
          setFormData({
            key: flag.key || "",
            enabled: flag.enabled ?? true,
            description: flag.description || "",
          });
          setRules(flag.rules || []);
        }
      } catch (error) {
        console.error("Error fetching feature flag:", error);
        toast({
          title: "Error fetching feature flag",
          style: { background: "red", color: "white" },
          duration: 3500,
        });
        router.push("/admin/feature-flags");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatureFlag();
  }, [router.isReady, id, authContext?.token, router]);

  const handleFormChange = useCallback((field: keyof UpdateFeatureFlagRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addRule = useCallback(() => {
    if (newRule.type && (newRule.value !== undefined && newRule.value !== "")) {
      setRules((prev) => [...prev, newRule as FeatureFlagRule]);
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
      const updateData: UpdateFeatureFlagRequest = {
        key: formData.key,
        enabled: formData.enabled,
        description: formData.description,
        rules: rules.length > 0 ? rules : undefined,
      };

      const response = await handleUpdateFeatureFlag(authContext.token, id as string, updateData);

      if (response.error) {
        toast({
          title: response.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      } else {
        toast({
          title: "Feature flag updated successfully!",
          style: { background: "green", color: "white" },
          duration: 3500,
        });
        router.push("/admin/feature-flags");
      }
    } catch (error) {
      console.error("Error updating feature flag:", error);
      toast({
        title: "Error updating feature flag",
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
            <p className="text-muted-foreground">Loading feature flag...</p>
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
            onClick={() => router.push("/admin/feature-flags")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Feature Flag</h1>
            <p className="text-muted-foreground">Update feature flag details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feature Flag Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => handleFormChange("key", e.target.value)}
                placeholder="e.g., new_dashboard"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Description of what this feature flag controls"
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled ?? true}
                onCheckedChange={(checked) => handleFormChange("enabled", checked)}
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>

            <div className="space-y-2">
              <Label>Targeting Rules</Label>
              <div className="space-y-2 border p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-2">
                  <Select
                    value={newRule.type}
                    onValueChange={(value) => setNewRule({ ...newRule, type: value as FeatureFlagRule["type"] })}
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
                    placeholder="Value (JSON array or string)"
                    value={typeof newRule.value === 'string' ? newRule.value : JSON.stringify(newRule.value || '')}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setNewRule({ ...newRule, value: parsed });
                      } catch {
                        setNewRule({ ...newRule, value: e.target.value });
                      }
                    }}
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
                        <span className="text-sm">
                          {typeof rule.value === 'string' ? rule.value : JSON.stringify(rule.value)}
                        </span>
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

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/feature-flags")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleFormSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Feature Flag"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


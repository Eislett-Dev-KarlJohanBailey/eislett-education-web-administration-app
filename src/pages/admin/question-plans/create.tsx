import { useEffect, useState, useCallback, useContext } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { handleCreateQuestionPlan, CreateQuestionPlanRequest } from "@/services/questionPlans/questionPlansRequest";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { handleFetchSubTopics } from "@/services/subtopics/subTopicsRequest";
import { SubTopicDetails } from "@/models/subTopic/subTopicDetails";
import { SubtopicCombobox } from "@/components/data/SubtopicCombobox";

export default function CreateQuestionPlanPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subtopics, setSubtopics] = useState<SubTopicDetails[]>([]);
  const [formData, setFormData] = useState<CreateQuestionPlanRequest>({
    subTopicId: "",
    prompt: "",
    bannedList: [],
    creativityLevel: 0.7,
    difficultyLevel: 0.5,
    tags: [],
    quota: 5,
    active: true,
  });
  const [bannedListItem, setBannedListItem] = useState("");
  const [tagItem, setTagItem] = useState("");

  // Fetch subtopics
  useEffect(() => {
    if (!authContext?.token) return;

    const fetchSubtopics = async () => {
      try {
        const results = await handleFetchSubTopics(
          authContext.token,
          1,
          1000
        );

        if ((results as { error: string })?.error) {
          console.error("Error fetching subtopics:", (results as { error: string }).error);
          setSubtopics([]);
        } else {
          setSubtopics(results.data ?? []);
        }
      } catch (error) {
        console.error("Error fetching subtopics:", error);
        setSubtopics([]);
      }
    };

    fetchSubtopics();
  }, [authContext?.token]);

  const handleFormChange = useCallback((field: keyof CreateQuestionPlanRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const formatDecimalInput = useCallback((value: string): number => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    let formatted = parts[0] || "";
    if (parts.length > 1) {
      formatted += "." + parts.slice(1).join("").substring(0, 2);
    }
    const num = parseFloat(formatted);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(1, num));
  }, []);

  const addBannedItem = useCallback(() => {
    if (bannedListItem.trim() && !formData.bannedList?.includes(bannedListItem.trim())) {
      setFormData((prev) => ({
        ...prev,
        bannedList: [...(prev.bannedList || []), bannedListItem.trim()],
      }));
      setBannedListItem("");
    }
  }, [bannedListItem, formData.bannedList]);

  const removeBannedItem = useCallback((item: string) => {
    setFormData((prev) => ({
      ...prev,
      bannedList: prev.bannedList?.filter((i) => i !== item) || [],
    }));
  }, []);

  const addTag = useCallback(() => {
    if (tagItem.trim() && !formData.tags?.includes(tagItem.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagItem.trim()],
      }));
      setTagItem("");
    }
  }, [tagItem, formData.tags]);

  const removeTag = useCallback((tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  }, []);

  const handleFormSubmit = useCallback(async () => {
    if (!authContext?.token) {
      setIsSubmitting(false);
      return;
    }

    if (!formData.subTopicId.trim()) {
      toast({
        title: "SubTopic is required",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.prompt.trim()) {
      toast({
        title: "Prompt is required",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    if (formData.quota < 1) {
      toast({
        title: "Quota must be at least 1",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await handleCreateQuestionPlan(authContext.token, formData);

      if (response.error) {
        toast({
          title: response.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      } else {
        toast({
          title: "Question plan created successfully!",
          style: { background: "green", color: "white" },
          duration: 3500,
        });
        router.push("/admin/question-plans");
      }
    } catch (error) {
      console.error("Error creating question plan:", error);
      toast({
        title: "Error creating question plan",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [authContext?.token, formData, router]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/question-plans")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Question Plan</h1>
            <p className="text-muted-foreground">Generate AI questions based on your prompt</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Question Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Information</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">
                  <strong>Prompt Structure:</strong> Don't worry about the structure of your prompt. 
                  Focus only on describing the questions you want generated and how they should be created.
                </p>
                <p>
                  <strong>Question Titles:</strong> Titles are automatically generated like IDs (e.g., SQR_NUM_Q10). 
                  You don't need to specify titles in your prompt.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="subTopicId">SubTopic *</Label>
              <SubtopicCombobox
                selectedSubtopicId={formData.subTopicId}
                onSelect={(subtopicId) => handleFormChange("subTopicId", subtopicId)}
                subtopics={subtopics}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt *</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => handleFormChange("prompt", e.target.value)}
                placeholder="e.g., generate questions focused on addition and multiplication that are moderately difficult"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Describe the type of questions you want to generate
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                  <span className="text-sm font-medium text-muted-foreground">
                    {(formData.difficultyLevel * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <Slider
                    id="difficultyLevel"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[formData.difficultyLevel]}
                    onValueChange={(values) => handleFormChange("difficultyLevel", values[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.difficultyLevel.toFixed(2)}
                  onChange={(e) => {
                    const value = formatDecimalInput(e.target.value);
                    handleFormChange("difficultyLevel", value);
                  }}
                  placeholder="0.00 - 1.00"
                  className="mt-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="creativityLevel">Creativity Level</Label>
                  <span className="text-sm font-medium text-muted-foreground">
                    {(formData.creativityLevel * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <Slider
                    id="creativityLevel"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[formData.creativityLevel]}
                    onValueChange={(values) => handleFormChange("creativityLevel", values[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.creativityLevel.toFixed(2)}
                  onChange={(e) => {
                    const value = formatDecimalInput(e.target.value);
                    handleFormChange("creativityLevel", value);
                  }}
                  placeholder="0.00 - 1.00"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quota">Quota *</Label>
              <Input
                id="quota"
                type="number"
                min="1"
                value={formData.quota}
                onChange={(e) => handleFormChange("quota", parseInt(e.target.value) || 1)}
                placeholder="Number of questions to generate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bannedList">Banned List</Label>
              <div className="flex gap-2">
                <Input
                  id="bannedList"
                  value={bannedListItem}
                  onChange={(e) => setBannedListItem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBannedItem();
                    }
                  }}
                  placeholder="Add item to ban"
                />
                <Button type="button" variant="outline" onClick={addBannedItem}>
                  Add
                </Button>
              </div>
              {formData.bannedList && formData.bannedList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.bannedList.map((item, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeBannedItem(item)}>
                      {item} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagItem}
                  onChange={(e) => setTagItem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Whether this question plan is active
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleFormChange("active", checked)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/question-plans")}
              >
                Cancel
              </Button>
              <Button onClick={handleFormSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Question Plan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


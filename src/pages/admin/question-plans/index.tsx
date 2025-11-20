import { useEffect, useState, useCallback, useContext } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataManagementLayout } from "@/components/layout/DataManagementLayout";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit, Sparkles, Loader2, Trash2, Check, X } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_PAGE_NUMBER } from "@/constants/tablePageSizes";
import { toast } from "@/hooks/use-toast";
import { handleFetchQuestionPlans, handleGenerateQuestions, handleUpdateQuestionPlan, handleDeleteQuestionPlan, QuestionPlan, CreateQuestionPlanRequest } from "@/services/questionPlans/questionPlansRequest";
import { handleDeleteQuestion } from "@/services/questions/questionsRequest";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DeleteConfirmationDialog } from "@/components/data/DeleteConfirmationDialog";

export default function QuestionPlansPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());

  const isRouterReady = router.isReady;

  const pageNumber = isRouterReady && router.query.page ? parseInt(router.query.page as string, 10) : DEFAULT_PAGE_NUMBER;
  const pageSize = isRouterReady && router.query.pageSize ? parseInt(router.query.pageSize as string, 10) : 10;

  const [questionPlans, setQuestionPlans] = useState<QuestionPlan[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ planId: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const fetchQuestionPlans = useCallback(async () => {
    if (!authContext?.token) return;

    setIsLoading(true);
    try {
      const response = await handleFetchQuestionPlans(
        authContext.token,
        pageNumber,
        pageSize
      );

      if (response.error) {
        toast({
          title: response.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
        setQuestionPlans([]);
        setTotalAmount(0);
      } else {
        setQuestionPlans(response.data ?? []);
        setTotalAmount(response.amount ?? 0);
      }
    } catch (error) {
      toast({
        title: "Error fetching question plans",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setQuestionPlans([]);
      setTotalAmount(0);
    } finally {
      setIsLoading(false);
    }
  }, [authContext?.token, pageNumber, pageSize]);

  useEffect(() => {
    if (router.isReady && authContext?.token) {
      fetchQuestionPlans();
    }
  }, [router.isReady, authContext?.token, pageNumber, pageSize, fetchQuestionPlans]);

  const handlePageChange = useCallback((page: number) => {
    const query = { ...router.query, page: page.toString() };
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  }, [router]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    const query = { ...router.query, pageSize: newPageSize.toString(), page: "1" };
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  }, [router]);

  const toggleRowExpansion = useCallback((planId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUpdateField = useCallback(async (planId: string, field: string, value: any) => {
    if (!authContext?.token) return;

    const plan = questionPlans.find(p => p.id === planId);
    if (!plan) return;

    try {
      // Format created array with question IDs
      const createdArray = (plan.created || [])
        .filter(item => item.question && item.question.id)
        .map(item => ({ question: item.question.id }));

      const updateData: CreateQuestionPlanRequest = {
        id: planId,
        subTopicId: plan.subTopicId,
        prompt: field === "prompt" ? value : plan.prompt,
        bannedList: plan.bannedList || [],
        creativityLevel: plan.creativityLevel,
        difficultyLevel: plan.difficultyLevel,
        tags: plan.tags || [],
        quota: field === "quota" ? parseInt(value) || plan.quota : plan.quota,
        active: field === "active" ? value : plan.active,
        created: createdArray,
        locked: plan.locked || false,
      };

      const response = await handleUpdateQuestionPlan(authContext.token, planId, updateData);

      if (response.error) {
        toast({
          title: response.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      } else {
        toast({
          title: "Successfully updated",
          style: { background: "green", color: "white" },
          duration: 2000,
        });
        await fetchQuestionPlans();
      }
    } catch (error) {
      console.error("Error updating field:", error);
      toast({
        title: "Error updating field",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    } finally {
      setEditingField(null);
      setEditingValue("");
    }
  }, [authContext?.token, questionPlans, fetchQuestionPlans]);

  const handleDeleteQuestionClick = useCallback((questionId: string) => {
    setQuestionToDelete(questionId);
  }, []);

  const handleConfirmDeleteQuestion = useCallback(async () => {
    if (!questionToDelete || !authContext?.token) return;

    try {
      const result = await handleDeleteQuestion(authContext.token, questionToDelete);
      
      if (result.deleted) {
        toast({
          title: "Question deleted successfully",
          style: { background: "green", color: "white" },
          duration: 3500,
        });
        await fetchQuestionPlans();
      } else {
        toast({
          title: result.error || "Failed to delete question",
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error deleting question",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    } finally {
      setQuestionToDelete(null);
    }
  }, [questionToDelete, authContext?.token, fetchQuestionPlans]);

  const handleEditQuestion = useCallback((questionId: string) => {
    router.push(`/admin/topics/subtopics/questions/edit/${questionId}`);
  }, [router]);

  const handleRemoveCorruptedQuestion = useCallback(async (planId: string, questionId: string | null, index: number) => {
    if (!authContext?.token) return;

    const plan = questionPlans.find(p => p.id === planId);
    if (!plan) return;

    try {
      // Filter out the corrupted question from the created array
      // Remove the item at the specified index, or filter by question ID if available
      const filteredCreated = plan.created
        .filter((item, idx) => {
          // Only keep valid questions
          if (!item.question || !item.question.id) {
            return false;
          }
          // If we have a questionId, filter by that
          if (questionId) {
            return item.question.id !== questionId;
          }
          // Otherwise, filter by index
          return idx !== index;
        })
        .map(item => ({ question: item.question.id }));

      // If question has an ID, try to delete it from the backend
      if (questionId) {
        try {
          await handleDeleteQuestion(authContext.token, questionId);
        } catch (error) {
          console.error("Error deleting corrupted question:", error);
          // Continue anyway to update the plan
        }
      }

      // Update the question plan with the filtered created array
      const updateData: CreateQuestionPlanRequest = {
        id: planId,
        subTopicId: plan.subTopicId,
        prompt: plan.prompt,
        bannedList: plan.bannedList || [],
        creativityLevel: plan.creativityLevel,
        difficultyLevel: plan.difficultyLevel,
        tags: plan.tags || [],
        quota: plan.quota,
        active: plan.active,
        created: filteredCreated,
        locked: plan.locked || false,
      };

      const response = await handleUpdateQuestionPlan(authContext.token, planId, updateData);

      if (response.error) {
        toast({
          title: response.error || "Failed to remove question",
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      } else {
        toast({
          title: "Corrupted question removed",
          style: { background: "green", color: "white" },
          duration: 2000,
        });
        await fetchQuestionPlans();
      }
    } catch (error) {
      console.error("Error removing corrupted question:", error);
      toast({
        title: "Error removing question",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    }
  }, [authContext?.token, questionPlans, fetchQuestionPlans]);

  const renderQuestion = (question: QuestionPlan["created"][0]["question"] | null, index: number, planId: string) => {
    // Handle null or corrupted questions
    if (!question || !question.id || !question.title) {
      const questionId = question?.id || null;
      return (
        <Card key={`corrupted-${index}`} className="mb-4 border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2 text-destructive">
                  Question was removed or corrupted
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  This question is no longer available or has been corrupted.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveCorruptedQuestion(planId, questionId, index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from List
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card key={question.id} className="mb-4 border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{question.title || "Untitled Question"}</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize">
                  {question.type?.replace("_", " ") || "Unknown"}
                </Badge>
                {question.difficultyLevel !== undefined && (
                  <Badge variant="secondary">
                    Difficulty: {(question.difficultyLevel * 100).toFixed(0)}%
                  </Badge>
                )}
                {question.totalPotentialMarks !== undefined && (
                  <Badge variant="secondary">
                    {question.totalPotentialMarks} mark{question.totalPotentialMarks !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditQuestion(question.id)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteQuestionClick(question.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {question.content && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Question</h4>
              <div className="text-base">
                <MarkdownRenderer content={question.content} />
              </div>
            </div>
          )}

          {question.type === "multiple_choice" && question.options && question.options.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Answer Options</h4>
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      option.isCorrect
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "bg-background border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      option.isCorrect
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + optIndex)}
                    </div>
                    <div className="flex-1">
                      <MarkdownRenderer content={option.content} />
                    </div>
                    {option.isCorrect && (
                      <div className="flex-shrink-0 text-green-600 dark:text-green-400 font-semibold">
                        ✓ Correct
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.type === "short_answer" && question.shortAnswers && question.shortAnswers.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Expected Answers</h4>
              <div className="space-y-2">
                {question.shortAnswers.map((answer, ansIndex) => (
                  <div
                    key={ansIndex}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-background"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {ansIndex + 1}
                    </div>
                    <div className="flex-1">
                      <MarkdownRenderer content={answer.content} />
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="ml-2">
                        {answer.marks} mark{answer.marks !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.type === "true_or_false" && question.isTrue !== undefined && (
            <div>
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Answer</h4>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={question.isTrue ? "default" : "secondary"}
                  className="text-base px-4 py-2"
                >
                  {question.isTrue ? "True" : "False"}
                </Badge>
              </div>
            </div>
          )}

          {question.explanation && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3 text-sm text-blue-700 dark:text-blue-300 uppercase tracking-wide">Explanation</h4>
              <div className="text-sm">
                <MarkdownRenderer content={question.explanation} />
              </div>
            </div>
          )}

          {question.tags && question.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const PromptCell = ({ plan }: { plan: QuestionPlan }) => {
    const isEditing = editingField?.planId === plan.id && editingField?.field === "prompt";
    
    if (isEditing) {
      return (
        <div className="max-w-md">
          <div className="flex gap-2">
            <Textarea
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="min-h-[60px] text-sm"
              autoFocus
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateField(plan.id, "prompt", editingValue);
                }}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingField(null);
                  setEditingValue("");
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="max-w-md cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setEditingField({ planId: plan.id, field: "prompt" });
          setEditingValue(plan.prompt);
        }}
      >
        <p className="text-sm truncate">{plan.prompt}</p>
      </div>
    );
  };

  const QuotaCell = ({ plan }: { plan: QuestionPlan }) => {
    const isEditing = editingField?.planId === plan.id && editingField?.field === "quota";
    
    if (isEditing) {
      return (
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <Input
              type="number"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-20 h-8 text-sm"
              autoFocus
              min="1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateField(plan.id, "quota", editingValue);
              }}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setEditingField(null);
                setEditingValue("");
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="text-center cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setEditingField({ planId: plan.id, field: "quota" });
          setEditingValue(plan.quota.toString());
        }}
      >
        <Badge variant="outline">
          {plan.created?.filter(item => item.question && item.question.id).length || 0} / {plan.quota}
        </Badge>
      </div>
    );
  };

  const StatusCell = ({ plan }: { plan: QuestionPlan }) => {
    const handleToggle = async (checked: boolean) => {
      await handleUpdateField(plan.id, "active", checked);
    };

    return (
      <div className="flex gap-2 items-center">
        <Switch
          checked={plan.active}
          onCheckedChange={handleToggle}
          disabled={plan.locked}
        />
        {plan.active && <Badge variant="default">Active</Badge>}
        {plan.locked && <Badge variant="destructive">Locked</Badge>}
        {!plan.active && !plan.locked && <Badge variant="outline">Inactive</Badge>}
      </div>
    );
  };

  const columns = [
    {
      id: "prompt",
      header: "Prompt",
      cell: (plan: QuestionPlan) => <PromptCell plan={plan} />,
    },
    {
      id: "quota",
      header: "Quota",
      cell: (plan: QuestionPlan) => <QuotaCell plan={plan} />,
    },
    {
      id: "difficulty",
      header: "Difficulty",
      cell: (plan: QuestionPlan) => (
        <div className="text-center">
          <Badge variant="secondary">
            {(plan.difficultyLevel * 100).toFixed(0)}%
          </Badge>
        </div>
      ),
    },
    {
      id: "creativity",
      header: "Creativity",
      cell: (plan: QuestionPlan) => (
        <div className="text-center">
          <Badge variant="secondary">
            {(plan.creativityLevel * 100).toFixed(0)}%
          </Badge>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (plan: QuestionPlan) => <StatusCell plan={plan} />,
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (plan: QuestionPlan) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(plan.createdAt)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (plan: QuestionPlan) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => toggleRowExpansion(plan.id)}
          >
            {expandedRows.has(plan.id) ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Questions
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                View Questions ({plan.created?.filter(item => item.question && item.question.id).length || 0})
              </>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleGenerate(plan.id)}
            disabled={generatingPlanId === plan.id || plan.locked}
          >
            {generatingPlanId === plan.id ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(plan.id)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeletePlanClick(plan.id)}
            disabled={plan.locked}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = useCallback((planId: string) => {
    router.push(`/admin/question-plans/edit/${planId}`);
  }, [router]);

  const handleDeletePlanClick = useCallback((planId: string) => {
    setPlanToDelete(planId);
  }, []);

  const handleConfirmDeletePlan = useCallback(async () => {
    if (!planToDelete || !authContext?.token) return;

    try {
      const result = await handleDeleteQuestionPlan(authContext.token, planToDelete);
      
      if (result.deleted) {
        toast({
          title: "Question plan deleted successfully",
          style: { background: "green", color: "white" },
          duration: 3500,
        });
        await fetchQuestionPlans();
      } else {
        toast({
          title: result.error || "Failed to delete question plan",
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      }
    } catch (error) {
      console.error("Error deleting question plan:", error);
      toast({
        title: "Error deleting question plan",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    } finally {
      setPlanToDelete(null);
    }
  }, [planToDelete, authContext?.token, fetchQuestionPlans]);

  const handleGenerate = useCallback(async (planId: string) => {
    if (!authContext?.token) return;

    setGeneratingPlanId(planId);
    try {
      const response = await handleGenerateQuestions(authContext.token, planId, 100);

      if (response.error || !response.success) {
        toast({
          title: response.error || "Failed to generate questions",
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      } else {
        toast({
          title: `Successfully generated ${response.total} question${response.total !== 1 ? 's' : ''}!`,
          style: { background: "green", color: "white" },
          duration: 3500,
        });
        // Refresh the question plans list
        await fetchQuestionPlans();
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast({
        title: "Error generating questions",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    } finally {
      setGeneratingPlanId(null);
    }
  }, [authContext?.token, fetchQuestionPlans]);

  const getPaginatedData = questionPlans;

  return (
    <AdminLayout>
      <DataManagementLayout
        title="Question Plans"
        description="View and manage AI-generated question plans"
        isLoading={isLoading}
        onRefresh={fetchQuestionPlans}
        onAddNew={() => router.push("/admin/question-plans/create")}
        addNewLabel="Create Question Plan"
      >
        <div className="space-y-4">
          <DataTable
            data={getPaginatedData}
            columns={columns}
            keyExtractor={(item) => item.id}
            pagination={{
              currentPage: pageNumber,
              totalPages: Math.max(1, Math.ceil(totalAmount / pageSize)),
              totalItems: totalAmount,
              itemsPerPage: pageSize,
              onPageChange: handlePageChange,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [5, 10, 20, 50, 100],
              showPageSizeSelector: true,
              showPageInput: true,
              showFirstLastButtons: true,
            }}
            emptyState={
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No question plans found</p>
              </div>
            }
          />

          {/* Expanded Questions */}
          {questionPlans.map((plan) => (
            expandedRows.has(plan.id) && plan.created && plan.created.length > 0 && (
              <div key={plan.id} className="mt-6 p-6 border rounded-lg bg-card shadow-sm">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">Plan Details</h3>
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Prompt</p>
                    <p className="text-base">{plan.prompt}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-sm">
                      Quota: {plan.created.filter(item => item.question && item.question.id).length} / {plan.quota}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      Difficulty: {(plan.difficultyLevel * 100).toFixed(0)}%
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      Creativity: {(plan.creativityLevel * 100).toFixed(0)}%
                    </Badge>
                    {plan.tags && plan.tags.length > 0 && (
                      <div className="flex gap-1">
                        {plan.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold mb-4">
                    Generated Questions ({plan.created.filter(item => item.question && item.question.id).length} / {plan.created.length})
                  </h4>
                  {plan.created.map((createdItem, index) => 
                    renderQuestion(createdItem.question, index, plan.id)
                  )}
                </div>
              </div>
            )
          ))}
        </div>

        <DeleteConfirmationDialog
          open={questionToDelete !== null}
          onOpenChange={(open) => !open && setQuestionToDelete(null)}
          onConfirm={handleConfirmDeleteQuestion}
          title="Delete Question"
          description="Are you sure you want to delete this question? This action cannot be undone."
        />

        <DeleteConfirmationDialog
          open={planToDelete !== null}
          onOpenChange={(open) => !open && setPlanToDelete(null)}
          onConfirm={handleConfirmDeletePlan}
          title="Delete Question Plan"
          description="Are you sure you want to delete this question plan? This will also delete all associated questions. This action cannot be undone."
        />
      </DataManagementLayout>
    </AdminLayout>
  );
}


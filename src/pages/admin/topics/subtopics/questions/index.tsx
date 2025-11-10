import { useEffect, useState, useCallback, useContext, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataManagementLayout } from "@/components/layout/DataManagementLayout";
import { DataTable } from "@/components/data/DataTable";
import { DeleteConfirmationDialog } from "@/components/data/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Edit, Eye, MoreHorizontal, Trash, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
// import { Question, QuestionType } from "@/lib/types"
import { useAuth } from "@/contexts/AuthContext";
import { useDebouncedCallback } from "use-debounce";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  getFilteredQuestions,
  getQuestionAmt,
  getQuestionReqParams,
  getQuestions,
  getQuestionsIsLoading,
  getQuestionSubtopics,
  getQuestionTableDeleteData,
  getQuestionTableFilters,
  setFilteredQuestions,
  setQuestionAmount,
  setQuestionReqParams,
  setQuestions,
  setQuestionsIsLoading,
  setQuestionSubtopics,
  setQuestionTableDeleteData,
  setQuestionTableFilters,
} from "@/store/questions.slice";
import { DEFAULT_PAGE_NUMBER } from "@/constants/tablePageSizes";
import {
  handleDeleteQuestion,
  handleFetchQuestions,
} from "../../../../../services/questions/questionsRequest";
import { toast } from "@/hooks/use-toast";
import { handleFetchSubTopics } from "@/services/subtopics/subTopicsRequest";
import { QuestionDetails } from "@/models/questions/questionDetails";
import { QuestionType } from "@/lib/types";
import { removeNulls } from "@/services/utils";
import {
  displayErrorMessage,
  displaySuccessMessage,
} from "@/services/displayMessages";

export default function QuestionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authContext = useContext(useAuth());

  // Wait for router to be ready before reading URL params
  const isRouterReady = router.isReady;

  // Read all state from URL params - single source of truth (only when router is ready)
  const pageNumber = isRouterReady && router.query.page ? parseInt(router.query.page as string, 10) : DEFAULT_PAGE_NUMBER;
  const pageSize = isRouterReady && router.query.pageSize ? parseInt(router.query.pageSize as string, 10) : 10;
  const searchQuery = (isRouterReady && router.query.name as string) || "";
  const subtopicFilter = (isRouterReady && router.query.subtopic as string) || undefined;
  const typeFilter = (isRouterReady && router.query.type as string) || undefined;
  const hiddenFilter = (isRouterReady && router.query.hidden as string) || undefined;
  const sortColumn = (isRouterReady && router.query.sortColumn as string) || undefined;
  const sortDirection = (isRouterReady && router.query.sortDirection as "asc" | "desc") || "asc";

  const totalQuestionAmt = useAppSelector(getQuestionAmt);
  const deleteData = useAppSelector(getQuestionTableDeleteData);
  const isLoading = useAppSelector(getQuestionsIsLoading);

  const questions = useAppSelector(getQuestions);
  const filteredQuestions = useAppSelector(getFilteredQuestions);
  const subtopics = useAppSelector(getQuestionSubtopics);

  // URL-synced state
  // const [sortColumn, setSortColumn] = useState<string>("title")
  // const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  // const [currentPage, setCurrentPage] = useState(1)
  // const [searchQuery, setSearchQuery] = useState("")
  // const [subtopicFilter, setSubtopicFilter] = useState<string>("")
  // const [typeFilter, setTypeFilter] = useState<string>("")

  // Delete dialog state
  // const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  // const [isDeleting, setIsDeleting] = useState(false)
  // const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)

  // Apply all filters, sorting, and pagination (client-side filtering for fetched data)
  const applyFilters = useCallback(() => {
    if (questions.length === 0) {
      dispatch(setFilteredQuestions([]));
      return;
    }

    let result = [...questions];

    if (subtopicFilter) {
      result = result.filter((question) =>
        question.subTopics.map((el) => el.id).includes(subtopicFilter)
      );
    }

    if (typeFilter) {
      result = result.filter(
        (question) => question.type === typeFilter
      );
    }

    if (hiddenFilter !== undefined) {
      const isHidden = hiddenFilter === "true";
      result = result.filter((question) => {
        const questionHidden = typeof question.hidden === 'boolean' ? question.hidden : false;
        return questionHidden === isHidden;
      });
    }

    if (sortColumn) {
      result.sort((a, b) => {
        let comparison = 0;
        const valA = a[sortColumn as keyof QuestionDetails];
        const valB = b[sortColumn as keyof QuestionDetails];

        if (sortColumn === "subtopic") {
          const subtopicA =
            subtopics.find((s) =>
              a.subTopics.map((el) => el.id).includes(String(s.id))
            )?.name || "";
          const subtopicB =
            subtopics.find((s) =>
              b.subTopics.map((el) => el.id).includes(String(s.id))
            )?.name || "";
          comparison = subtopicA.localeCompare(subtopicB);
        } else if (sortColumn === "hidden") {
          // Sort booleans: false (visible) comes before true (hidden)
          const boolA = typeof valA === 'boolean' ? (valA ? 1 : 0) : 0;
          const boolB = typeof valB === 'boolean' ? (valB ? 1 : 0) : 0;
          comparison = boolA - boolB;
        } else if (typeof valA === "string" && typeof valB === "string") {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB;
        } else if (sortColumn === "createdAt") {
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    dispatch(setFilteredQuestions(result));
  }, [dispatch, subtopicFilter, typeFilter, hiddenFilter, sortColumn, sortDirection, questions, subtopics]);

  // const handleRefresh = useCallback(() => {
  //   applyFilters()
  // }, [applyFilters])

  // Update Redux state from URL params for API calls (only when URL changes and router is ready)
  useEffect(() => {
    if (!router.isReady) return;

    const pageFromUrl = router.query.page
      ? parseInt(router.query.page as string, 10)
      : DEFAULT_PAGE_NUMBER;
    const pageSizeFromUrl = router.query.pageSize
      ? parseInt(router.query.pageSize as string, 10)
      : 10;
    const nameFromUrl = router.query.name as string;
    const typeFromUrl = router.query.type as string;
    const subtopicFromUrl = router.query.subtopic as string;
    const hiddenFromUrl = router.query.hidden as string;

    const reqParams = {
      page_number: !isNaN(pageFromUrl) ? pageFromUrl : DEFAULT_PAGE_NUMBER,
      page_size: !isNaN(pageSizeFromUrl) ? pageSizeFromUrl : 10,
      name: nameFromUrl && nameFromUrl?.length > 0 ? nameFromUrl : undefined,
      type: typeFromUrl,
      sub_topic_id: subtopicFromUrl,
      hidden: hiddenFromUrl === "true" || hiddenFromUrl === "false" ? hiddenFromUrl : undefined,
    };
    
    dispatch(setQuestionReqParams(reqParams));
  }, [router.isReady, router.query.page, router.query.pageSize, router.query.name, router.query.type, router.query.subtopic, router.query.hidden, dispatch]);

  // Apply filters whenever questions or URL params change (only when router is ready)
  useEffect(() => {
    if (!router.isReady) return;
    // Only apply filters if we have questions to filter
    if (questions.length > 0) {
      applyFilters();
    } else if (questions.length === 0) {
      // Clear filtered results if no questions
      dispatch(setFilteredQuestions([]));
    }
  }, [router.isReady, questions.length, subtopicFilter, typeFilter, hiddenFilter, sortColumn, sortDirection, subtopics.length, applyFilters, dispatch]);

  //GET LIST OF QUESTIONS - triggered by URL params (only when router is ready)
  useEffect(() => {
    if (!router.isReady || !authContext?.token) return;
    
    let cancelled = false;
    
    async function getQuestions() {
      dispatch(setQuestionsIsLoading(true));
      
      try {
        const results = await handleFetchQuestions(
          authContext.token,
          pageNumber,
          pageSize,
          searchQuery || undefined,
          subtopicFilter,
          typeFilter,
          hiddenFilter
        );

        if (cancelled) return;

        if ((results as { error: string })?.error) {
          toast({
            title: (results as { error: string })?.error,
            style: { background: "red", color: "white" },
            duration: 3500,
          });

          dispatch(setQuestions([]));
        } else {
          dispatch(setQuestions(results.data ?? []));
        }

        dispatch(setQuestionAmount(results.amount ?? 0));
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Failed to fetch questions",
            style: { background: "red", color: "white" },
            duration: 3500,
          });
          dispatch(setQuestions([]));
        }
      } finally {
        if (!cancelled) {
          dispatch(setQuestionsIsLoading(false));
        }
      }
    }

    // Add a small delay to batch rapid URL changes
    const timeoutId = setTimeout(() => {
      getQuestions();
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    router.isReady,
    pageNumber,
    pageSize,
    searchQuery,
    subtopicFilter,
    typeFilter,
    hiddenFilter,
    dispatch,
    authContext?.token,
  ]);

  //  GET LIST OF SUB TOPICS
  useEffect(() => {
    console.log("Fetching sub topics");
    async function getSubTopics() {
      const topic_id = undefined;
      const results = await handleFetchSubTopics(
        authContext?.token,
        1,
        1000, // Increased limit to get all subtopics
        topic_id
      );

      if ((results as { error: string })?.error) {
        toast({
          title: (results as { error: string })?.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
        dispatch(setQuestionSubtopics([]));
      } else {
        dispatch(setQuestionSubtopics(results.data ?? []));
      }
    }

    getSubTopics();
  }, [authContext?.token, dispatch]);

  const handleAddNew = useCallback(() => {
    router.push({
      pathname: "/admin/topics/subtopics/questions/create",
      query: subtopicFilter
        ? { subtopic: subtopicFilter }
        : {},
    });
  }, [subtopicFilter, router]);

  const handleEdit = useCallback(
    (id: number | string) => {
      // Pass the current page as returnTo so we can navigate back after editing
      const currentPath = router.asPath || router.pathname;
      router.push({
        pathname: `/admin/topics/subtopics/questions/edit/${id}`,
        query: { returnTo: currentPath },
      });
    },
    [router]
  );

  const handleDuplicate = useCallback(
    (id: number | string) => {
      // Pass the current page as returnTo so we can navigate back after duplicating
      const currentPath = router.asPath || router.pathname;
      router.push({
        pathname: `/admin/topics/subtopics/questions/edit/${id}`,
        query: { duplicate: 'true', returnTo: currentPath },
      });
    },
    [router]
  );

  const handleDeleteClick = useCallback(
    (id: string) => {
      // setQuestionToDelete(id)
      // setDeleteDialogOpen(true)
      dispatch(
        setQuestionTableDeleteData({
          questionId: id,
          showDeleteDialog: true,
          isDeleting: false,
        })
      );
    },
    [dispatch]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteData.questionId) return;
    dispatch(
      setQuestionTableDeleteData({
        questionId: deleteData.questionId,
        showDeleteDialog: true,
        isDeleting: true,
      })
    );

    const result = await handleDeleteQuestion(
      authContext?.token,
      deleteData.questionId
    );

    if (result.deleted) displaySuccessMessage("Deleted Question!");

    setTimeout(() => {
      // setQuestions(questions.filter(question => question.id !== questionToDelete))
      dispatch(
        setQuestionTableDeleteData({
          questionId: undefined,
          showDeleteDialog: false,
          isDeleting: false,
        })
      );
    }, 1000);
  }, [authContext?.token, deleteData.questionId, dispatch]);

  // Update question handler (for partial updates like hidden and difficulty)
  const handleUpdateQuestion = useCallback(async (
    questionId: string,
    updates: { hidden?: boolean; difficultyLevel?: number }
  ) => {
    if (!authContext?.token) return;

    try {
      // Get current question data
      const currentQuestion = questions.find(q => String(q.id) === String(questionId));
      if (!currentQuestion) {
        displayErrorMessage("Question not found");
        return;
      }

      // Prepare update payload
      const questionDetails = {
        ...currentQuestion,
        ...updates,
      };

      const rawResponse = await fetch("/api/questions", {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext.token}`,
        },
        body: JSON.stringify({
          id: questionId,
          questionDetails,
        }),
      });

      if (!rawResponse.ok) {
        throw new Error("Failed to update question");
      }

      const updatedQuestion = await rawResponse.json() as QuestionDetails;

      // Update local state
      dispatch(setQuestions(
        questions.map(q => String(q.id) === String(questionId) ? updatedQuestion : q)
      ));

      displaySuccessMessage("Question updated!");
    } catch (error) {
      console.error("Error updating question:", error);
      displayErrorMessage("Failed to update question");
    }
  }, [authContext?.token, questions, dispatch]);

  // Toggle hidden status
  const handleToggleHidden = useCallback(async (
    questionId: string,
    currentHidden: boolean
  ) => {
    await handleUpdateQuestion(questionId, { hidden: !currentHidden });
  }, [handleUpdateQuestion]);

  // Update difficulty
  const handleUpdateDifficulty = useCallback(async (
    questionId: string,
    newDifficulty: number
  ) => {
    await handleUpdateQuestion(questionId, { difficultyLevel: newDifficulty });
  }, [handleUpdateQuestion]);

  // Update subtopics (link/unlink)
  const handleUpdateSubtopics = useCallback(async (
    questionId: string,
    newSubtopicIds: string[]
  ) => {
    if (!authContext?.token) return;

    try {
      // Get current question
      const currentQuestion = questions.find(q => String(q.id) === String(questionId));
      if (!currentQuestion) {
        displayErrorMessage("Question not found");
        return;
      }

      const currentSubtopicIds = (currentQuestion.subTopics || []).map(st => String(st.id));
      
      // Find subtopics to link (new ones)
      const toLink = newSubtopicIds.filter(id => !currentSubtopicIds.includes(id));
      // Find subtopics to unlink (removed ones)
      const toUnlink = currentSubtopicIds.filter(id => !newSubtopicIds.includes(id));

      // Link new subtopics
      for (const subtopicId of toLink) {
        const response = await fetch(
          `/api/sub-topics/${subtopicId}/question/${questionId}`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${authContext.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to link subtopic ${subtopicId}`);
        }
      }

      // Unlink removed subtopics
      for (const subtopicId of toUnlink) {
        const response = await fetch(
          `/api/sub-topics/${subtopicId}/question/${questionId}`,
          {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${authContext.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to unlink subtopic ${subtopicId}`);
        }
      }

      // Refresh the question to get updated subtopics
      const questionResponse = await fetch(`/api/questions/${questionId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext.token}`,
        },
      });

      if (questionResponse.ok) {
        const updatedQuestion = await questionResponse.json() as QuestionDetails;
        
        // Update local state
        dispatch(setQuestions(
          questions.map(q => String(q.id) === String(questionId) ? updatedQuestion : q)
        ));
      }

      displaySuccessMessage("Subtopics updated!");
    } catch (error) {
      console.error("Error updating subtopics:", error);
      displayErrorMessage("Failed to update subtopics");
    }
  }, [authContext?.token, questions, dispatch]);

  const handleViewQuestion = useCallback(
    (id: number | string) => {
      router.push(`/admin/topics/subtopics/questions/${id}`);
    },
    [router]
  );

  const handleSearch = useDebouncedCallback((value: string) => {
    // Update URL - this is the single source of truth
    const query = {
      ...router.query,
      name: value || undefined,
      page: "1",
    };
    if (!value) delete query.name;
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  }, 1000);

  const handleSubtopicFilterChange = useCallback(
    (value: string) => {
      // Update URL - this is the single source of truth
      const query = {
        ...router.query,
        subtopic: value || undefined,
        page: "1",
      };
      if (!value) delete query.subtopic;
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  const handleTypeFilterChange = useCallback(
    (value: string) => {
      // Update URL - this is the single source of truth
      const query = { ...router.query, type: value || undefined, page: "1" };
      if (!value) delete query.type;
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  const handleHiddenFilterChange = useCallback(
    (value: string) => {
      // Update URL - this is the single source of truth
      const query = { ...router.query, hidden: value || undefined, page: "1" };
      if (!value) delete query.hidden;
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  const handleSort = useCallback(
    (column: string, direction: "asc" | "desc") => {
      // Update URL - this is the single source of truth
      const query = { 
        ...router.query, 
        sortColumn: column, 
        sortDirection: direction 
      };
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      // Update URL - this is the single source of truth
      const query = { 
        ...router.query, 
        page: page.toString() 
      };
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  // const getPaginatedData = () => {
  //   const itemsPerPage = 10
  //   const startIndex = (currentPage - 1) * itemsPerPage
  //   return filteredQuestions.slice(startIndex, startIndex + itemsPerPage)
  // }
  const getPaginatedData = useMemo(() => {
    if (filteredQuestions?.length > 0) return filteredQuestions;

    return questions;
  }, [filteredQuestions, questions]);

  const getSubtopicName = useCallback(
    (subtopicId: string) =>
      subtopics.find((subtopic) => subtopic.id === subtopicId)?.name ||
      "Unknown",
    [subtopics]
  );

  const filterOptions = useMemo(
    () => [
      {
        id: "subtopic",
        label: "Subtopic",
        type: "select" as const,
        value: subtopicFilter,
        onChange: handleSubtopicFilterChange,
        placeholder: "",
        options: [
          { label: "All Subtopics", value: undefined },
          ...subtopics.map((subtopic) => ({
            label: subtopic.name,
            value: `${subtopic.id}`,
          })),
        ],
      },
      {
        id: "type",
        label: "Question Type",
        type: "select" as const,
        value: typeFilter,
        onChange: handleTypeFilterChange,
        placeholder: "",
        options: [
          { label: "All Types", value: undefined },
          { label: "Multiple Choice", value: QuestionType.MULTIPLE_CHOICE },
          { label: "True/False", value: QuestionType.TRUE_FALSE },
          { label: "Short Answer", value: QuestionType.SHORT_ANSWER },
        ],
      },
      {
        id: "hidden",
        label: "Hidden Status",
        type: "select" as const,
        value: hiddenFilter,
        onChange: handleHiddenFilterChange,
        placeholder: "",
        options: [
          { label: "All Questions", value: undefined },
          { label: "Visible Only", value: "false" },
          { label: "Hidden Only", value: "true" },
        ],
      },
    ],
    [
      subtopicFilter,
      typeFilter,
      hiddenFilter,
      handleSubtopicFilterChange,
      handleTypeFilterChange,
      handleHiddenFilterChange,
      subtopics,
    ]
  );

  // Subtopic cell component
  const SubtopicCell = ({ question, allSubtopics, onUpdate }: { 
    question: QuestionDetails; 
    allSubtopics: typeof subtopics;
    onUpdate: (id: string, subtopicIds: string[]) => void;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const currentSubtopicIds = (question.subTopics || []).map(st => String(st.id));
    const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>(currentSubtopicIds);

    // Sync with question prop
    useEffect(() => {
      setSelectedSubtopicIds((question.subTopics || []).map(st => String(st.id)));
    }, [question.subTopics]);

    const filteredSubtopics = allSubtopics.filter(subtopic =>
      subtopic.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggleSubtopic = (subtopicId: string) => {
      setSelectedSubtopicIds(prev => {
        if (prev.includes(subtopicId)) {
          return prev.filter(id => id !== subtopicId);
        } else {
          return [...prev, subtopicId];
        }
      });
    };

    const handleSave = () => {
      onUpdate(String(question.id), selectedSubtopicIds);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setSelectedSubtopicIds(currentSubtopicIds);
      setIsEditing(false);
    };

    return (
      <Popover open={isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <div 
            className="flex flex-wrap gap-1 cursor-pointer hover:opacity-80 transition-opacity min-h-[24px]"
            onClick={() => setIsEditing(true)}
          >
            {question.subTopics && question.subTopics.length > 0 ? (
              question.subTopics.map((subtopic) => (
                <Badge key={subtopic.id} variant="outline" className="text-xs">
                  {getSubtopicName(String(subtopic.id))}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No subtopics</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search subtopics..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No subtopics found.</CommandEmpty>
              <CommandGroup>
                {filteredSubtopics.map((subtopic) => {
                  const isSelected = selectedSubtopicIds.includes(String(subtopic.id));
                  return (
                    <CommandItem
                      key={subtopic.id}
                      onSelect={() => handleToggleSubtopic(String(subtopic.id))}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{subtopic.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="border-t p-2 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {selectedSubtopicIds.length} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Difficulty cell component (separate component to use hooks)
  const DifficultyCell = ({ question, onUpdate }: { question: QuestionDetails; onUpdate: (id: string, difficulty: number) => void }) => {
    const difficulty = question.difficultyLevel;
    const [localDifficulty, setLocalDifficulty] = useState(difficulty);
    const [isEditing, setIsEditing] = useState(false);
    
    let color = "bg-green-500";
    if (difficulty > 0.3 && difficulty <= 0.6) color = "bg-yellow-500";
    if (difficulty > 0.6) color = "bg-red-500";

    // Sync local state with question prop
    useEffect(() => {
      setLocalDifficulty(difficulty);
    }, [difficulty]);

    const handleSliderChange = (value: number[]) => {
      // Round to nearest 0.1 increment
      const rounded = Math.round(value[0] * 10) / 10;
      setLocalDifficulty(rounded);
    };

    const handleSliderCommit = (value: number[]) => {
      // Round to nearest 0.1 increment
      const newDifficulty = Math.round(value[0] * 10) / 10;
      onUpdate(String(question.id), newDifficulty);
      setIsEditing(false);
    };

    return (
      <Popover open={isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity min-w-[100px]"
            onClick={() => setIsEditing(true)}
          >
            <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
            <span>{(localDifficulty * 10).toFixed(1)}/10</span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Difficulty: {(localDifficulty * 10).toFixed(1)}/10</Label>
              <span className="text-sm text-muted-foreground">
                {localDifficulty <= 0.3 ? "Easy" : localDifficulty <= 0.6 ? "Medium" : "Hard"}
              </span>
            </div>
            <Slider
              value={[localDifficulty]}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderCommit}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>0.5</span>
              <span>1.0</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const columns = useMemo(
    () => [
      {
        id: "hidden",
        header: "Hidden",
        cell: (question: QuestionDetails) => {
          const isHidden = typeof question.hidden === 'boolean' ? question.hidden : false;
          return (
            <div className="flex items-center justify-center">
              <Switch
                checked={isHidden}
                onCheckedChange={() => handleToggleHidden(String(question.id), isHidden)}
                className="cursor-pointer"
              />
            </div>
          );
        },
        sortable: true,
      },
      {
        id: "title",
        header: "Title",
        cell: (question: QuestionDetails) => (
          <span className="font-medium">{question.title}</span>
        ),
        sortable: true,
      },
      {
        id: "type",
        header: "Type",
        cell: (question: QuestionDetails) => {
          const getTypeLabel = () => {
            if (question.type === QuestionType.MULTIPLE_CHOICE) return "Multiple Choice";
            if (question.type === QuestionType.TRUE_FALSE) return "True/False";
            if (question.type === QuestionType.SHORT_ANSWER) return "Short Answer";
            return "Unknown";
          };
          
          const getVariant = () => {
            if (question.type === QuestionType.MULTIPLE_CHOICE) return "default";
            if (question.type === QuestionType.SHORT_ANSWER) return "outline";
            return "secondary";
          };
          
          return (
            <Badge variant={getVariant()}>
              {getTypeLabel()}
            </Badge>
          );
        },
        sortable: true,
      },
      {
        id: "subtopic",
        header: "Subtopic",
        cell: (question: QuestionDetails) => (
          <SubtopicCell 
            question={question} 
            allSubtopics={subtopics}
            onUpdate={handleUpdateSubtopics}
          />
        ),
        sortable: true,
      },
      {
        id: "difficultyLevel",
        header: "Difficulty",
        cell: (question: QuestionDetails) => (
          <DifficultyCell question={question} onUpdate={handleUpdateDifficulty} />
        ),
        sortable: true,
      },
      {
        id: "marks",
        header: "Marks",
        cell: (question: QuestionDetails) => (
          <span>{question.totalPotentialMarks}</span>
        ),
        sortable: true,
      },
      {
        id: "tags",
        header: "Tags",
        cell: (question: QuestionDetails) => (
          <div className="flex flex-wrap gap-1">
            {question.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {question.tags.length > 3 && (
              <Badge
                key={`${question.tags.length - 3}`}
                variant="outline"
                className="text-xs"
              >
                +{question.tags.length - 3}
              </Badge>
            )}
          </div>
        ),
        sortable: false,
      },
      {
        id: "createdAt",
        header: "Created At",
        cell: (question: QuestionDetails) =>
          new Date(question.createdAt).toLocaleDateString("en-gb", {
            timeZone: "utc",
          }),
        sortable: true,
      },
      {
        id: "actions",
        header: "",
        cell: (question: QuestionDetails) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleViewQuestion(question.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(question.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(question.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(question.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [getSubtopicName, handleDeleteClick, handleEdit, handleDuplicate, handleViewQuestion, handleToggleHidden, handleUpdateDifficulty, handleUpdateSubtopics, subtopics]
  );

  const sortOptions = useMemo(
    () => [
      { label: "Title (A-Z)", value: "title_asc" },
      { label: "Title (Z-A)", value: "title_desc" },
      { label: "Hidden (Visible First)", value: "hidden_asc" },
      { label: "Hidden (Hidden First)", value: "hidden_desc" },
      { label: "Subtopic (A-Z)", value: "subtopic_asc" },
      { label: "Subtopic (Z-A)", value: "subtopic_desc" },
      { label: "Difficulty (Low to High)", value: "difficultyLevel_asc" },
      { label: "Difficulty (High to Low)", value: "difficultyLevel_desc" },
      { label: "Marks (Low to High)", value: "totalPotentialMarks_asc" },
      { label: "Marks (High to Low)", value: "totalPotentialMarks_desc" },
      { label: "Newest First", value: "createdAt_desc" },
      { label: "Oldest First", value: "createdAt_asc" },
    ],
    []
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const [column, direction] = value.split("_");
      handleSort(column, direction as "asc" | "desc");
    },
    [handleSort]
  );

  const currentSortValue = useMemo(() => {
    if (sortColumn && sortDirection) {
      return `${sortColumn}_${sortDirection}`;
    }
    return undefined;
  }, [sortColumn, sortDirection]);

  const getDataComponent = useCallback(() => {

    return (
      <DataManagementLayout
        title="Questions"
        description="Manage all questions in the system"
        onAddNew={handleAddNew}
        addNewLabel="Add Question"
        searchPlaceholder="Search questions..."
        onSearch={handleSearch}
        sortOptions={sortOptions}
        onSortChange={handleSortChange}
        filterControls={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filterOptions.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <Label htmlFor={filter.id} className="text-sm font-medium">
                  {filter.label}
                </Label>
                <Select value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger id={filter.id}>
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value as string}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        }
        isLoading={isLoading}
        onRefresh={applyFilters}
        className="px-2 sm:px-4"
        defaultSort={currentSortValue}
        defaultShowFilters={!!subtopicFilter || !!typeFilter || !!hiddenFilter}
      >
        <DataTable
          data={getPaginatedData}
          columns={columns}
          keyExtractor={(item) => `${item.id}`}
          // onRowClick={(item) => handleViewQuestion(item.id)}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          pagination={{
            currentPage: pageNumber,
            totalPages: Math.max(
              1,
              Math.ceil(totalQuestionAmt / pageSize)
            ),
            totalItems: totalQuestionAmt,
            itemsPerPage: pageSize,
            onPageChange: handlePageChange,
            onPageSizeChange: (pageSize: number) => {
              // Update URL - this is the single source of truth
              const query = { 
                ...router.query, 
                pageSize: pageSize.toString(),
                page: "1"
              };
              router.push({ pathname: router.pathname, query }, undefined, {
                shallow: true,
              });
            },
            pageSizeOptions: [5, 10, 20, 50, 100],
            showPageSizeSelector: true,
            showPageInput: true,
            showFirstLastButtons: true,
          }}
          emptyState={
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground mb-4">No questions found</p>
              <Button onClick={handleAddNew}>Add your first question</Button>
            </div>
          }
        />
      </DataManagementLayout>
    );
  }, [
    columns,
    filterOptions,
    sortColumn,
    sortDirection,
    subtopicFilter,
    typeFilter,
    hiddenFilter,
    getPaginatedData,
    handleAddNew,
    handlePageChange,
    applyFilters,
    handleSearch,
    handleSort,
    handleSortChange,
    handleViewQuestion,
    isLoading,
    pageNumber,
    pageSize,
    sortOptions,
    totalQuestionAmt,
    currentSortValue,
  ]);

  // Show loading skeleton while router is not ready
  if (!router.isReady) {
    return (
      <AdminLayout>
        <div className="container py-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {getDataComponent()}

      <DeleteConfirmationDialog
        open={deleteData.showDeleteDialog}
        onOpenChange={(show) =>
          dispatch(
            setQuestionTableDeleteData({
              questionId: deleteData?.questionId,
              showDeleteDialog: show,
              isDeleting: deleteData.isDeleting,
            })
          )
        }
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteData.isDeleting}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
      />
    </AdminLayout>
  );
}

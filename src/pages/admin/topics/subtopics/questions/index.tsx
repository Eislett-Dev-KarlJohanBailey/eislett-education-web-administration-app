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

  const questionReqParams = useAppSelector(getQuestionReqParams);
  const totalQuestionAmt = useAppSelector(getQuestionAmt);
  const filters = useAppSelector(getQuestionTableFilters);
  const deleteData = useAppSelector(getQuestionTableDeleteData);
  const isLoading = useAppSelector(getQuestionsIsLoading);

  const questions = useAppSelector(getQuestions);
  const filteredQuestions = useAppSelector(getFilteredQuestions);
  const subtopics = useAppSelector(getQuestionSubtopics);

  // const [questions, setQuestions] = useState([]); //useState<Question[]>(MOCK_QUESTIONS)
  // const [filteredQuestions, setFilteredQuestions] = useState([]); //useState<Question[]>(MOCK_QUESTIONS)
  // const [subtopics, setSubtopics] = useState([]); // useState(MOCK_SUBTOPICS)

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

  // Apply all filters, sorting, and pagination
  const applyFilters = useCallback(() => {
    console.log("Applying filters", filters);
    dispatch(setQuestionsIsLoading(true));

    let result = [...questions];

    // if (searchQuery) {
    //   const lowerSearch = searchQuery.toLowerCase()
    //   result = result.filter(question =>
    //     question.title.toLowerCase().includes(lowerSearch) ||
    //     question.description?.toLowerCase().includes(lowerSearch) ||
    //     question.content.toLowerCase().includes(lowerSearch) ||
    //     question.tags.some(tag => tag.toLowerCase().includes(lowerSearch))
    //   )
    // }

    if (filters.subtopicFilter) {
      result = result.filter((question) =>
        question.subTopics.map((el) => el.id).includes(filters.subtopicFilter)
      );
    }

    if (filters.typeFilter) {
      result = result.filter(
        (question) => question.type === filters.typeFilter
      );
    }

    if (filters.hiddenFilter !== undefined) {
      const isHidden = filters.hiddenFilter === "true";
      result = result.filter((question) => {
        const questionHidden = typeof question.hidden === 'boolean' ? question.hidden : false;
        return questionHidden === isHidden;
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      const valA = a[filters.sortColumn as keyof QuestionDetails];
      const valB = b[filters.sortColumn as keyof QuestionDetails];

      if (filters.sortColumn === "subtopic") {
        const subtopicA =
          subtopics.find((s) =>
            a.subTopics.map((el) => el.id).includes(String(s.id))
          )?.name || "";
        const subtopicB =
          subtopics.find((s) =>
            b.subTopics.map((el) => el.id).includes(String(s.id))
          )?.name || "";
        comparison = subtopicA.localeCompare(subtopicB);
      } else if (filters.sortColumn === "hidden") {
        // Sort booleans: false (visible) comes before true (hidden)
        const boolA = typeof valA === 'boolean' ? (valA ? 1 : 0) : 0;
        const boolB = typeof valB === 'boolean' ? (valB ? 1 : 0) : 0;
        comparison = boolA - boolB;
      } else if (typeof valA === "string" && typeof valB === "string") {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      } else if (filters.sortColumn === "createdAt") {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return filters.sortDirection === "asc" ? comparison : -comparison;
    });

    // const rawResponse = await fetch('/api/questions?page_number=1&page_size=5',
    //     {
    //       method: 'GET',
    //       headers: {
    //         'Accept': 'application/json, text/plain, */*',
    //         'Content-Type': 'application/json',
    //         "Authorization" : `Bearer ${authContext.token}`
    //       },

    //     }
    //   );

    console.log("Filtered Data", result);
    dispatch(setFilteredQuestions(result));
    setTimeout(() => {
      dispatch(setQuestionsIsLoading(false));
    }, 1000);
  }, [dispatch, filters, questions, subtopics]);

  // const handleRefresh = useCallback(() => {
  //   applyFilters()
  // }, [applyFilters])

  // Initialize state from URL on first load
  useEffect(() => {
    if (!router.isReady) return;

    const pageFromUrl = router.query.page
      ? parseInt(router.query.page as string, 10)
      : DEFAULT_PAGE_NUMBER;
    if (!isNaN(pageFromUrl))
      dispatch(setQuestionReqParams({ page_number: pageFromUrl }));

    const nameFromUrl = router.query.name as string;
    // if (nameFromUrl) dispatch(setQuestionReqParams({ name: nameFromUrl }));

    const typeFromUrl = router.query.type as string;

    const reqParams = {
      name:
        nameFromUrl && nameFromUrl?.length > 0 ? nameFromUrl : undefined,
      page_number: !isNaN(pageFromUrl) ? pageFromUrl : undefined,
      type: typeFromUrl,
    };
    removeNulls(reqParams);
    dispatch(setQuestionReqParams(reqParams));

    const sortColumnFromUrl = router.query.sortColumn as string;
    const sortDirectionFromUrl = router.query.sortDirection as "asc" | "desc";
    // if (sortColumnFromUrl) dispatch(setQuestionTableFilters({ sortColumn: sortColumnFromUrl }))
    // if (sortDirectionFromUrl && ["asc", "desc"].includes(sortDirectionFromUrl)) dispatch(setQuestionTableFilters({ sortDirection: sortDirectionFromUrl }))

    const subtopicFilterFromUrl = router.query.subtopic as string;
    // if (subtopicFilterFromUrl) dispatch(setQuestionTableFilters({ subtopicFilter: subtopicFilterFromUrl }))

    const typeFilterFromUrl = router.query.type as string;
    // if (typeFilterFromUrl)
    //   dispatch(setQuestionTableFilters({ typeFilter: typeFilterFromUrl }))

    const hiddenFilterFromUrl = router.query.hidden as string;

    const filterParams = {
      typeFilter: typeFilterFromUrl,
      sortColumn: sortColumnFromUrl,
      sortDirection:
        sortDirectionFromUrl && ["asc", "desc"].includes(sortDirectionFromUrl)
          ? sortDirectionFromUrl
          : undefined,
      subtopicFilter: subtopicFilterFromUrl,
      hiddenFilter: hiddenFilterFromUrl === "true" || hiddenFilterFromUrl === "false" ? hiddenFilterFromUrl : undefined,
    };
    dispatch(setQuestionTableFilters(filterParams));

    // applyFilters()
  }, [router.isReady, router.query, dispatch]);

  // Apply filters whenever dependencies change
  // useEffect(() => {
  //   applyFilters()
  // }, [questions, applyFilters])

  //GET LIST OF QUESTIONS
  useEffect(() => {
    console.log("Fetching questions");
    async function getQuestions() {
      dispatch(setQuestionsIsLoading(true));
      const results = await handleFetchQuestions(
        authContext?.token,
        questionReqParams?.page_number,
        questionReqParams?.page_size,
        questionReqParams?.name,
        questionReqParams?.sub_topic_id,
        questionReqParams?.type
      );

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
      dispatch(setQuestionsIsLoading(false));
    }

    getQuestions();
  }, [
    questionReqParams?.page_number,
    questionReqParams?.page_size,
    questionReqParams?.name,
    questionReqParams?.sub_topic_id,
    questionReqParams?.type,
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
      query: questionReqParams?.sub_topic_id
        ? { subtopic: questionReqParams?.sub_topic_id }
        : {},
    });
  }, [questionReqParams?.sub_topic_id, router]);

  const handleEdit = useCallback(
    (id: number | string) => {
      router.push(`/admin/topics/subtopics/questions/edit/${id}`);
    },
    [router]
  );

  const handleDuplicate = useCallback(
    (id: number | string) => {
      router.push(`/admin/topics/subtopics/questions/edit/${id}?duplicate=true`);
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

  const handleViewQuestion = useCallback(
    (id: number | string) => {
      router.push(`/admin/topics/subtopics/questions/${id}`);
    },
    [router]
  );

  const handleSearch = useDebouncedCallback((value: string) => {
    dispatch(setQuestionReqParams({ name: value, page_number: 1 })); // triggers apply filter
    
    // update url
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
      dispatch(setQuestionTableFilters({ subtopicFilter: value }));
      dispatch(setQuestionReqParams({ page_number: 1, sub_topic_id: value })); //triggers the apply filter

      // update url
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
    [dispatch, router]
  );

  const handleTypeFilterChange = useCallback(
    (value: string) => {
      dispatch(setQuestionTableFilters({ typeFilter: value }));
      dispatch(setQuestionReqParams({ page_number: 1, type: value || undefined }));

      // update url
      const query = { ...router.query, type: value || undefined, page: "1" };
      if (!value) delete query.type;
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [dispatch, router]
  );

  const handleHiddenFilterChange = useCallback(
    (value: string) => {
      dispatch(setQuestionTableFilters({ hiddenFilter: value }));
      dispatch(setQuestionReqParams({ page_number: 1 }));

      // update url
      const query = { ...router.query, hidden: value || undefined, page: "1" };
      if (!value) delete query.hidden;
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
      
      // Apply filters after a short delay to ensure state is updated
      setTimeout(applyFilters, 100);
    },
    [dispatch, router, applyFilters]
  );

  const handleSort = useCallback(
    (column: string, direction: "asc" | "desc") => {
      dispatch(
        setQuestionTableFilters({
          sortColumn: column,
          sortDirection: direction,
        })
      );

      setTimeout(applyFilters, 800);

      // router.push({
      //   pathname: router.pathname,
      //   query: { ...router.query, sortColumn: column, sortDirection: direction }
      // }, undefined, { shallow: true })
    },
    [dispatch, applyFilters]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      dispatch(setQuestionReqParams({ page_number: page }));
      // router.push({
      //   pathname: router.pathname,
      //   query: { ...router.query, page: page.toString() }
      // }, undefined, { shallow: true })
      // applyFilters()
    },
    [dispatch]
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
        value: filters.subtopicFilter,
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
        value: filters.typeFilter,
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
        value: filters.hiddenFilter,
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
      filters.subtopicFilter,
      filters.typeFilter,
      filters.hiddenFilter,
      handleSubtopicFilterChange,
      handleTypeFilterChange,
      handleHiddenFilterChange,
      subtopics,
    ]
  );

  const columns = useMemo(
    () => [
      {
        id: "hidden",
        header: "Hidden",
        cell: (question: QuestionDetails) => {
          const isHidden = typeof question.hidden === 'boolean' ? question.hidden : false;
          return (
            <div className="flex items-center justify-center">
              {isHidden ? (
                <Badge variant="destructive" className="text-xs">
                  Hidden
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Visible
                </Badge>
              )}
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
          <>
            {question.subTopics.map((subtopic) => (
              <>
                <span key={subtopic.id}>
                  {getSubtopicName(`${subtopic.id}`)}
                </span>
                <br />
              </>
            ))}
          </>
        ),
        sortable: true,
      },
      {
        id: "difficultyLevel",
        header: "Difficulty",
        cell: (question: QuestionDetails) => {
          const difficulty = question.difficultyLevel;
          let color = "bg-green-500";
          if (difficulty > 0.3 && difficulty <= 0.6) color = "bg-yellow-500";
          if (difficulty > 0.6) color = "bg-red-500";

          return (
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
              <span>{(difficulty * 10).toFixed(1)}/10</span>
            </div>
          );
        },
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
    [getSubtopicName, handleDeleteClick, handleEdit, handleDuplicate, handleViewQuestion]
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

  // const currentSortValue = useMemo(() => `${filters.sortColumn}_${filters.sortDirection}`, [filters.sortColumn, filters.sortDirection])
  const getDataComponent = useCallback(() => {
    const currentSortValue = `${filters.sortColumn}_${filters.sortDirection}`;
    console.log("Curr sort", currentSortValue);

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
        defaultShowFilters={!!filters.subtopicFilter || !!filters.typeFilter || !!filters.hiddenFilter}
      >
        <DataTable
          data={getPaginatedData}
          columns={columns}
          keyExtractor={(item) => `${item.id}`}
          // onRowClick={(item) => handleViewQuestion(item.id)}
          sortColumn={filters.sortColumn}
          sortDirection={filters.sortDirection}
          onSort={handleSort}
          pagination={{
            currentPage: questionReqParams?.page_number,
            totalPages: Math.max(
              1,
              Math.ceil(totalQuestionAmt / questionReqParams.page_size)
            ),
            totalItems: totalQuestionAmt,
            itemsPerPage: questionReqParams.page_size,
            onPageChange: handlePageChange,
            onPageSizeChange: (pageSize: number) => {
              dispatch(setQuestionReqParams({ page_size: pageSize, page_number: 1 }));
              setTimeout(applyFilters, 800);
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
    filters.sortColumn,
    filters.sortDirection,
    filters.subtopicFilter,
    filters.typeFilter,
    getPaginatedData,
    handleAddNew,
    handlePageChange,
    applyFilters,
    handleSearch,
    handleSort,
    handleSortChange,
    handleViewQuestion,
    isLoading,
    questionReqParams?.page_number,
    questionReqParams.page_size,
    sortOptions,
    totalQuestionAmt,
  ]);

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

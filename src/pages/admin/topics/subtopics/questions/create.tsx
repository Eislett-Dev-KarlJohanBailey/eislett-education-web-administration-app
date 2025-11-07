import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useRouter } from "next/router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ArrowLeft, Trash } from "lucide-react";
import { QuestionFormData, QuestionType } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { QuestionDetails } from "@/models/questions/questionDetails";
import { handleFetchSubTopics } from "@/services/subtopics/subTopicsRequest";
import { toast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { SubTopicDetails } from "@/models/subTopic/subTopicDetails";
import {
  getQuestionFormData,
  getQuestionFormSubtopics,
  resetQuestionPageSlice,
  setQuestionFormData,
  setQuestionFormSubtopics,
} from "@/store/questions.slice";
import { removeNulls } from "@/services/utils";
import {
  displayErrorMessage,
  displaySuccessMessage,
} from "@/services/displayMessages";
import { useAuth } from "@/contexts/AuthContext";
import { MediaPicker } from "@/components/data/MediaPicker";

// Mock data for demonstration
const MOCK_SUBTOPICS = [
  {
    id: "1",
    name: "Epsilon-Delta Definition",
    description: "Formal definition of limits using epsilon-delta notation",
    topicId: "1",
    createdAt: "2025-01-16",
  },
  {
    id: "2",
    name: "Limit Laws",
    description: "Properties and rules for calculating limits",
    topicId: "1",
    createdAt: "2025-01-17",
  },
  {
    id: "3",
    name: "First Law of Motion",
    description:
      "An object at rest stays at rest, and an object in motion stays in motion",
    topicId: "2",
    createdAt: "2025-02-11",
  },
  {
    id: "4",
    name: "Second Law of Motion",
    description: "Force equals mass times acceleration (F = ma)",
    topicId: "2",
    createdAt: "2025-02-12",
  },
  {
    id: "5",
    name: "Character Analysis",
    description: "In-depth study of Hamlet's character and motivations",
    topicId: "3",
    createdAt: "2025-03-06",
  },
];

export default function CreateQuestionPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authContext = useContext(useAuth());

  const formData = useAppSelector(getQuestionFormData);
  const questionSubtopics = useAppSelector(getQuestionFormSubtopics);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subtopics, setSubtopics] = useState<SubTopicDetails[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [currentSubtopic, setCurrentSubtopic] = useState<string | undefined>(
    undefined
  );
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // const [formData, setFormData] = useState<QuestionDetails>({
  //   title: "",
  //   description: "",
  //   content: "",
  //   tags: [],
  //   type: QuestionType.MULTIPLE_CHOICE,
  //   totalPotentialMarks: 1,
  //   difficultyLevel: 0.1,
  //   subTopics: [],
  //   multipleChoiceOptions: [
  //     { id: 1, content: "", isCorrect: false },
  //     { id: 2, content: "", isCorrect: false },
  //     { id: 3, content: "", isCorrect: false },
  //     { id: 4, content: "", isCorrect: false }
  //   ]
  // })

  // Initialize subtopicId from URL query
  useEffect(() => {
    if (router.isReady && router.query.subtopic) {
      dispatch(
        setQuestionFormSubtopics({
          operation_type: "ADD",
          value: String(router.query.subtopic),
        })
      );
    }
  }, [dispatch, router.isReady, router.query.subtopic]);

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
        setSubtopics([]);
      } else {
        setSubtopics(results.data ?? []);
      }
    }

    getSubTopics();
  }, [authContext?.token, dispatch]);

  // Update form data
  const handleInputChange = useCallback(
    (field: keyof QuestionFormData, value: any) => {
      // setFormData(prev => ({ ...prev, [field]: value }))
      dispatch(setQuestionFormData({ field, value }));
    },
    [dispatch]
  );

  // Handle media insertion at cursor position
  const handleInsertMedia = useCallback(
    (markdown: string) => {
      const textarea = contentTextareaRef.current;
      if (!textarea) {
        // Fallback: just append to content
        const currentContent = formData.content || "";
        handleInputChange("content", currentContent + markdown);
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content || "";
      const newContent =
        currentContent.substring(0, start) +
        markdown +
        currentContent.substring(end);

      handleInputChange("content", newContent);

      // Restore cursor position after the inserted text
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + markdown.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [formData.content, handleInputChange]
  );

  // Handle question type change
  const handleTypeChange = useCallback(
    (type: QuestionType) => {
      let newOptions = formData.multipleChoiceOptions;
      let newShortAnswers = formData.shortAnswers || [];

      if (type === QuestionType.TRUE_FALSE) {
        newOptions = [
          { id: 1, content: "True", isCorrect: false },
          { id: 2, content: "False", isCorrect: false },
        ];
      } else if (
        type === QuestionType.MULTIPLE_CHOICE &&
        formData.multipleChoiceOptions.length < 3
      ) {
        newOptions = [
          { id: 1, content: "", isCorrect: false },
          { id: 2, content: "", isCorrect: false },
          { id: 3, content: "", isCorrect: false },
          { id: 4, content: "", isCorrect: false },
        ];
      } else if (type === QuestionType.SHORT_ANSWER && newShortAnswers.length === 0) {
        newShortAnswers = [
          { content: "", marks: 1, explanation: "" },
        ];
      }

      dispatch(setQuestionFormData({ field: "type", value: type }));
      dispatch(
        setQuestionFormData({
          field: "multipleChoiceOptions",
          value: newOptions,
        })
      );
      if (type === QuestionType.SHORT_ANSWER) {
        dispatch(
          setQuestionFormData({
            field: "shortAnswers",
            value: newShortAnswers,
          })
        );
      }
    },
    [dispatch, formData.multipleChoiceOptions, formData.shortAnswers]
  );

  // Handle option content change
  const handleOptionChange = useCallback(
    (id: number, content: string) => {
      // setFormData(prev => ({
      //   ...prev,
      //   multipleChoiceOptions: prev.multipleChoiceOptions.map(option =>
      //     option.id === id ? { ...option, content } : option
      //   )
      // }))

      const newOptions = formData.multipleChoiceOptions.map((option) =>
        option.id === id ? { ...option, content } : option
      );

      dispatch(
        setQuestionFormData({
          field: "multipleChoiceOptions",
          value: newOptions,
        })
      );
    },
    [dispatch, formData.multipleChoiceOptions]
  );

  // Handle correct option selection
  const handleCorrectOptionChange = useCallback(
    (id: number) => {
      // setFormData(prev => ({
      //   ...prev,
      //   multipleChoiceOptions: prev.multipleChoiceOptions.map(option => ({
      //     ...option,
      //     isCorrect: option.id === id
      //   }))
      // }))

      const newOptions = formData.multipleChoiceOptions.map((option) =>
        option.id === id ? { ...option, isCorrect: !option.isCorrect } : option
      );

      dispatch(
        setQuestionFormData({
          field: "multipleChoiceOptions",
          value: newOptions,
        })
      );
    },
    [dispatch, formData.multipleChoiceOptions]
  );

  // Add a new option (for multiple choice)
  const handleAddOption = useCallback(() => {
    if (formData.type === QuestionType.MULTIPLE_CHOICE) {
      // setFormData(prev => ({
      //   ...prev,
      //   multipleChoiceOptions: [
      //     ...prev.multipleChoiceOptions,
      //     { id: (prev.multipleChoiceOptions?.length ?? 0) + 1, content: "", isCorrect: false }
      //   ]
      // }))

      const newOptions = [
        ...formData.multipleChoiceOptions,
        {
          id: (formData.multipleChoiceOptions?.length ?? 0) + 1,
          content: "",
          isCorrect: false,
        },
      ];
      dispatch(
        setQuestionFormData({
          field: "multipleChoiceOptions",
          value: newOptions,
        })
      );
    }
  }, [dispatch, formData.multipleChoiceOptions, formData.type]);

  // Remove an option (for multiple choice)
  const handleRemoveOption = useCallback(
    (id: number) => {
      if (
        formData.type === QuestionType.MULTIPLE_CHOICE &&
        formData.multipleChoiceOptions.length > 2
      ) {
        // Check if we're removing the correct option
        const isRemovingCorrect = formData.multipleChoiceOptions.find(
          (o) => o.id === id
        )?.isCorrect;

        let newOptions = formData.multipleChoiceOptions.filter(
          (option) => option.id !== id
        );

        // If we removed the correct option, make the first option correct
        if (isRemovingCorrect && newOptions.length > 0) {
          newOptions = newOptions.map((option, index) => ({
            ...option,
            isCorrect: index === 0,
          }));
        }

        // setFormData(prev => ({
        //   ...prev,
        //   multipleChoiceOptions: newOptions
        // }))

        dispatch(
          setQuestionFormData({
            field: "multipleChoiceOptions",
            value: newOptions,
          })
        );
      }
    },
    [dispatch, formData.multipleChoiceOptions, formData.type]
  );

  // Handle short answer change
  const handleShortAnswerChange = useCallback(
    (index: number, field: 'content' | 'marks' | 'explanation', value: string | number) => {
      const newShortAnswers = [...(formData.shortAnswers || [])];
      newShortAnswers[index] = {
        ...newShortAnswers[index],
        [field]: value,
      };
      dispatch(
        setQuestionFormData({
          field: "shortAnswers",
          value: newShortAnswers,
        })
      );
    },
    [dispatch, formData.shortAnswers]
  );

  // Add a new short answer option
  const handleAddShortAnswer = useCallback(() => {
    if (formData.type === QuestionType.SHORT_ANSWER) {
      const newShortAnswers = [
        ...(formData.shortAnswers || []),
        { content: "", marks: 1, explanation: "" },
      ];
      dispatch(
        setQuestionFormData({
          field: "shortAnswers",
          value: newShortAnswers,
        })
      );
    }
  }, [dispatch, formData.shortAnswers, formData.type]);

  // Remove a short answer option
  const handleRemoveShortAnswer = useCallback(
    (index: number) => {
      if (
        formData.type === QuestionType.SHORT_ANSWER &&
        formData.shortAnswers &&
        formData.shortAnswers.length > 1
      ) {
        const newShortAnswers = formData.shortAnswers.filter((_, i) => i !== index);
        dispatch(
          setQuestionFormData({
            field: "shortAnswers",
            value: newShortAnswers,
          })
        );
      }
    },
    [dispatch, formData.shortAnswers, formData.type]
  );

  // Handle tags
  const handleAddTag = useCallback(() => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      // setFormData(prev => ({
      //   ...prev,
      //   tags: [...prev.tags, currentTag.trim()]
      // }))

      dispatch(
        setQuestionFormData({
          field: "tags",
          value: [...formData.tags, currentTag.trim()],
        })
      );
      setCurrentTag("");
    }
  }, [currentTag, dispatch, formData.tags]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      // setFormData(prev => ({
      //   ...prev,
      //   tags: prev.tags.filter(t => t !== tag)
      // }))
      const newTags = formData.tags.filter((t) => t !== tag);
      dispatch(setQuestionFormData({ field: "tags", value: newTags }));
    },
    [dispatch, formData.tags]
  );

  const handleSubtopic = useCallback(
    (id: string) => {
      dispatch(
        setQuestionFormSubtopics({
          operation_type: "REMOVE",
          value: id,
        })
      );
    },
    [dispatch]
  );

  const handleAddSubtopic = useCallback(() => {
    console.log("handleAddSubtopic called with:", {
      currentSubtopic,
      questionSubtopics,
    });
    if (currentSubtopic && !questionSubtopics.includes(currentSubtopic)) {
      console.log("Adding subtopic:", currentSubtopic);
      dispatch(
        setQuestionFormSubtopics({
          operation_type: "ADD",
          value: currentSubtopic,
        })
      );
      setCurrentSubtopic(undefined);
    } else {
      console.log("Cannot add subtopic:", {
        hasCurrentSubtopic: !!currentSubtopic,
        alreadyExists: questionSubtopics.includes(currentSubtopic || ""),
      });
    }
  }, [currentSubtopic, dispatch, questionSubtopics]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  // Handle linking question to sub topic
  const handleLinkSubtopics = useCallback(
    async (questionId: string) => {
      console.log("handleLinkSubtopics called with:", {
        questionId,
        questionSubtopics,
      });
      if (questionSubtopics.length === 0) return true;
      let linkSuccess = true;

      try {
        for (let subtopicId of questionSubtopics) {
          const rawResponse = await fetch(
            `/api/sub-topics/${subtopicId}/question/${questionId}`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            }
          );

          if (!rawResponse.ok) {
            linkSuccess = false;
            break;
          } else if (
            rawResponse.ok &&
            subtopicId === questionSubtopics[questionSubtopics.length - 1]
          )
            linkSuccess = true;
        }
      } catch (e) {
        linkSuccess = false;
        console.log("Question Link err: ", e);
        // displayErrorMessage('Failed to link question to selected subtopics')
      }

      return linkSuccess;
    },
    [questionSubtopics]
  );

  // Form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      // console.log('FOrm Data', formData);
      // Validation
      if (!formData.title.trim()) {
        // alert("Please enter a title")
        displayErrorMessage("Missing required fields", "Please enter a title");
        return;
      }

      if (!formData.content.trim()) {
        // alert("Please enter question content")
        displayErrorMessage(
          "Missing required fields",
          "Please enter question content"
        );
        return;
      }

      if (questionSubtopics?.length === 0) {
        // alert("Please select a subtopic")
        displayErrorMessage(
          "Missing required fields",
          "Please select and add a subtopic"
        );
        return;
      }

      // Check if both 'true' & 'false' is selected option is marked as correct
      if (
        formData.type === QuestionType.TRUE_FALSE &&
        formData.multipleChoiceOptions.filter((option) => option.isCorrect)
          ?.length === 2
      ) {
        // alert("Please mark at least one option as correct")
        displayErrorMessage(
          "Invalid Options",
          "For question type 'true or false', the answer must be either true or false."
        );
        return;
      }

      // Check if at least one option is marked as correct (for multiple choice)
      if (
        formData.type === QuestionType.MULTIPLE_CHOICE &&
        !formData.multipleChoiceOptions.some((option) => option.isCorrect)
      ) {
        // alert("Please mark at least one option as correct")
        displayErrorMessage(
          "Missing required fields",
          "Please mark at least one option as correct"
        );
        return;
      }

      // Check if all options have content (for multiple choice)
      if (
        formData.type === QuestionType.MULTIPLE_CHOICE &&
        formData.multipleChoiceOptions.some((option) => !option.content.trim())
      ) {
        // alert("Please fill in all options")
        displayErrorMessage(
          "Missing required fields",
          "Please fill in all options"
        );
        return;
      }

      // Check if short answers are provided (for short answer)
      if (
        formData.type === QuestionType.SHORT_ANSWER &&
        (!formData.shortAnswers || formData.shortAnswers.length === 0)
      ) {
        displayErrorMessage(
          "Missing required fields",
          "Please add at least one short answer option"
        );
        return;
      }

      // Check if all short answers have content
      if (
        formData.type === QuestionType.SHORT_ANSWER &&
        formData.shortAnswers?.some((answer) => !answer.content.trim())
      ) {
        displayErrorMessage(
          "Missing required fields",
          "Please fill in all short answer contents"
        );
        return;
      }

      if (!formData.explanation.trim()) {
        // alert("Please enter explanation")
        displayErrorMessage(
          "Missing required fields",
          "Please enter explanation"
        );
        return;
      }

      setIsSubmitting(true);

      try {
        const isTrue =
          formData?.type === QuestionType.MULTIPLE_CHOICE ||
          formData?.type === QuestionType.SHORT_ANSWER
            ? undefined
            : formData?.multipleChoiceOptions.find(
                (el) => el?.content?.toLowerCase() === "true"
              )?.isCorrect;

        let params = {
          title: formData?.title,
          content: formData?.content,
          description: formData?.description,
          tags: formData?.tags,
          totalPotentialMarks: formData?.totalPotentialMarks,
          difficultyLevel: formData?.difficultyLevel,
          type: formData?.type,
          multipleChoiceOptions:
            formData?.type === QuestionType.MULTIPLE_CHOICE
              ? formData?.multipleChoiceOptions
              : null,
          shortAnswers:
            formData?.type === QuestionType.SHORT_ANSWER
              ? formData?.shortAnswers
              : null,
          isTrue: isTrue,
          explanation: formData?.explanation,
        };

        params = removeNulls(params) as any;

        const rawResponse = await fetch("/api/questions", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authContext.token}`,
          },
          body: JSON.stringify(params),
        });
        const data: QuestionDetails = await rawResponse.json();

        let linkedAllSubtopics = true;
        console.log("data", data);
        // if created successfully link question to subtopic
        if (data?.id && questionSubtopics.length > 0) {
          linkedAllSubtopics = await handleLinkSubtopics(data.id);
        }

        if (!linkedAllSubtopics || !data.id)
          displayErrorMessage(
            !data?.id
              ? "Failed to create question!"
              : "Failed to Link questions"
          );
        else {
          dispatch(resetQuestionPageSlice());
          displaySuccessMessage("Question Created!");
          setTimeout(
            () => router.push("/admin/topics/subtopics/questions"),
            1500
          );
        }
      } catch (e) {
        console.log("On Submit Error", e);
        displayErrorMessage("Failed to submit!");
      }
    },
    [
      authContext.token,
      dispatch,
      formData.content,
      formData?.description,
      formData?.difficultyLevel,
      formData.multipleChoiceOptions,
      formData?.tags,
      formData.title,
      formData?.totalPotentialMarks,
      formData.type,
      formData.explanation,
      handleLinkSubtopics,
      questionSubtopics.length,
      router,
    ]
  );

  const getSubtopicName = useCallback(
    (id: string) => subtopics.find((s) => s.id === id)?.name || "Unknown",
    [subtopics]
  );

  const getPlaceholderContent = useCallback(() => {
    return (
      formData.content ||
      "Question content will appear here. You can use LaTeX math: $E = mc^2$ or $$\\frac{d}{dx}\\sin x = \\cos x$$"
    );
  }, [formData.content]);

  return (
    <AdminLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Create New Question</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Question"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
              <CardDescription>
                Enter the basic information for your question. You can use LaTeX
                math formulas with $ or $$ delimiters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Question Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter a title for this question"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter a brief description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Question Content</Label>
                  <MediaPicker onInsert={handleInsertMedia} />
                </div>
                <Textarea
                  id="content"
                  ref={contentTextareaRef}
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="Enter the question content. You can use LaTeX math: $E = mc^2$ or $$\frac{d}{dx}\sin x = \cos x$$"
                  rows={4}
                  required
                />
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="subtopic">Subtopic</Label>
                  <Select 
                    value={formData.subTopics?.length === 0 ? `${formData.subTopics[0]}` : undefined } 
                    onValueChange={(value) => handleInputChange("subtopicId", Number(value))}
                  >
                    <SelectTrigger id="subtopic">
                      <SelectValue placeholder="Select a subtopic" />
                    </SelectTrigger>
                    <SelectContent>
                      {subtopics.map((subtopic) => (
                        <SelectItem key={subtopic.id} value={subtopic.id}>
                          {subtopic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Question Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleTypeChange(value as QuestionType)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                    <SelectItem value={QuestionType.TRUE_FALSE}>True/False</SelectItem>
                    <SelectItem value={QuestionType.SHORT_ANSWER}>Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div> 
              */}

              <div className="space-y-2">
                <Label htmlFor="type">Question Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    handleTypeChange(value as QuestionType)
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                      Multiple Choice
                    </SelectItem>
                    <SelectItem value={QuestionType.TRUE_FALSE}>
                      True/False
                    </SelectItem>
                    <SelectItem value={QuestionType.SHORT_ANSWER}>
                      Short Answer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="marks">Total Potential Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.totalPotentialMarks}
                    onChange={(e) =>
                      handleInputChange(
                        "totalPotentialMarks",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">
                    Difficulty Level
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="difficulty"
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={formData.difficultyLevel || 0.1}
                      onChange={(e) =>
                        handleInputChange(
                          "difficultyLevel",
                          parseFloat(e.target.value)
                        )
                      }
                      className="flex-1"
                    />
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={formData.difficultyLevel || 0.1}
                        onChange={(e) =>
                          handleInputChange(
                            "difficultyLevel",
                            parseFloat(e.target.value) || 0.1
                          )
                        }
                        className="w-20"
                      />
                      <span className="text-sm font-medium">
                        {(formData.difficultyLevel * 10).toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Easy</span>
                    <span>Medium</span>
                    <span>Hard</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add a tag"
                  />
                  <Button type="button" onClick={handleAddTag} size="sm">
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subtopics</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {questionSubtopics.map((subtopic) => (
                    <Badge
                      key={`subtopic_${subtopic}`}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {getSubtopicName(subtopic)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleSubtopic(subtopic)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select
                    value={currentSubtopic}
                    onValueChange={(value) => {
                      setCurrentSubtopic(value);
                    }}
                  >
                    <SelectTrigger id="subtopic">
                      <SelectValue placeholder="Select a subtopic" />
                    </SelectTrigger>
                    <SelectContent>
                      {subtopics.map((subtopic) => (
                        <SelectItem
                          key={subtopic.id}
                          value={String(subtopic.id)}
                        >
                          {subtopic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddSubtopic} size="sm">
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Answer Options</CardTitle>
              <CardDescription>
                {formData.type === QuestionType.MULTIPLE_CHOICE
                  ? "Add multiple choice options and mark the correct answer"
                  : formData.type === QuestionType.TRUE_FALSE
                  ? "Select the correct answer for this true/false question"
                  : "Add short answer options with content, marks, and optional explanations"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.type === QuestionType.MULTIPLE_CHOICE ? (
                <div className="space-y-4">
                  {formData.multipleChoiceOptions.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-3"
                    >
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <Input
                        value={option.content}
                        onChange={(e) =>
                          handleOptionChange(option.id, e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={option.isCorrect}
                          onCheckedChange={(e) =>
                            handleCorrectOptionChange(option.id)
                          }
                          aria-label="Correct answer"
                        />
                        <Label
                          className="text-sm cursor-pointer"
                          onClick={() => handleCorrectOptionChange(option.id)}
                        >
                          Correct
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(option.id)}
                          disabled={formData.multipleChoiceOptions.length <= 2}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleAddOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              ) : formData.type === QuestionType.TRUE_FALSE ? (
                <div className="space-y-4">
                  {formData.multipleChoiceOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={option.isCorrect}
                          onCheckedChange={() =>
                            handleCorrectOptionChange(option.id)
                          }
                          aria-label="Correct answer"
                        />
                        <Label
                          className="text-base cursor-pointer"
                          onClick={() => handleCorrectOptionChange(option.id)}
                        >
                          {option.content}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {(formData.shortAnswers || []).map((answer, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Short Answer {index + 1}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveShortAnswer(index)}
                          disabled={(formData.shortAnswers || []).length <= 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`short-answer-content-${index}`}>
                          Answer Content
                        </Label>
                        <Input
                          id={`short-answer-content-${index}`}
                          value={answer.content}
                          onChange={(e) =>
                            handleShortAnswerChange(
                              index,
                              "content",
                              e.target.value
                            )
                          }
                          placeholder="Enter the expected answer"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`short-answer-marks-${index}`}>
                            Marks
                          </Label>
                          <Input
                            id={`short-answer-marks-${index}`}
                            type="number"
                            min="0"
                            value={answer.marks}
                            onChange={(e) =>
                              handleShortAnswerChange(
                                index,
                                "marks",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`short-answer-explanation-${index}`}>
                          Explanation (Optional)
                        </Label>
                        <Textarea
                          id={`short-answer-explanation-${index}`}
                          value={answer.explanation || ""}
                          onChange={(e) =>
                            handleShortAnswerChange(
                              index,
                              "explanation",
                              e.target.value
                            )
                          }
                          placeholder="Enter explanation for this answer"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleAddShortAnswer}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Short Answer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Explanation */}
          <Card>
            <CardHeader>
              <CardTitle>Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.explanation}
                onChange={(e) =>
                  handleInputChange("explanation", e.target.value)
                }
                placeholder="Enter the explanation"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Preview how your question will appear
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="question" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="question">Question</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="question"
                  className="p-4 border rounded-md mt-4"
                >
                  <div className="space-y-4">
                    <div>
                      <MarkdownRenderer
                        content={getPlaceholderContent()}
                        className="font-semibold text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      {formData.type === QuestionType.SHORT_ANSWER ? (
                        (formData.shortAnswers || []).map((answer, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-md space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                Answer {index + 1}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {answer.marks} mark{answer.marks !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <MarkdownRenderer
                              content={
                                answer.content ||
                                `Short answer ${index + 1} will appear here`
                              }
                            />
                            {answer.explanation && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground font-medium mb-1">
                                  Explanation:
                                </p>
                                <MarkdownRenderer
                                  content={answer.explanation}
                                  className="text-sm"
                                />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        formData.multipleChoiceOptions.map((option, index) => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2"
                          >
                            {formData.type === QuestionType.MULTIPLE_CHOICE ? (
                              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-sm font-medium">
                                {String.fromCharCode(65 + index)}
                              </div>
                            ) : null}
                            <MarkdownRenderer
                              content={
                                option.content ||
                                `Option ${index + 1} will appear here`
                              }
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent
                  value="metadata"
                  className="p-4 border rounded-md mt-4"
                >
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Title:
                        </span>
                        <p>{formData.title || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Type:
                        </span>
                        <p>
                          {formData.type === QuestionType.MULTIPLE_CHOICE
                            ? "Multiple Choice"
                            : "True/False"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Subtopic:
                        </span>
                        {questionSubtopics?.length > 0 ? (
                          questionSubtopics.map((subtopic) => (
                            <p key={`subtopic_${subtopic}`}>
                              {getSubtopicName(subtopic)}
                            </p>
                          ))
                        ) : (
                          <p>Not set</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Marks:
                        </span>
                        <p>{formData.totalPotentialMarks}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Difficulty:
                      </span>
                      <p>{(formData.difficultyLevel * 10).toFixed(1)}/10</p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Tags:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.tags.length > 0 ? (
                          formData.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No tags
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Question"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}

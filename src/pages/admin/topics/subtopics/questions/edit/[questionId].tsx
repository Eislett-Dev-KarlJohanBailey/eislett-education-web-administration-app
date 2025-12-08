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
import { X, Plus, ArrowLeft, Trash, ArrowRight } from "lucide-react";
import { QuestionFormData, QuestionType } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { QuestionDetails } from "@/models/questions/questionDetails";
import { handleFetchSubTopics } from "@/services/subtopics/subTopicsRequest";
import { toast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { store } from "@/store/store";
import { SubTopicDetails } from "@/models/subTopic/subTopicDetails";
import {
  getQuestionFormData,
  getQuestionFormIsLoading,
  getQuestionFormSubtopics,
  resetQuestionPageSlice,
  setAllQuestionFormData,
  setAllQuestionFormSubtopics,
  setQuestionFormData,
  setQuestionFormIsLoading,
  setQuestionFormSubtopics,
} from "@/store/questions.slice";
import { removeNulls } from "@/services/utils";
import {
  displayErrorMessage,
  displaySuccessMessage,
} from "@/services/displayMessages";
import { handleFetchQuestionById, handleFetchNextQuestion } from "@/services/questions/questionsRequest";
import { useAuth } from "@/contexts/AuthContext";
import { MediaPicker } from "@/components/data/MediaPicker";

export default function UpdateQuestionPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authContext = useContext(useAuth());

  const formData = useAppSelector(getQuestionFormData);
  const questionSubtopics = useAppSelector(getQuestionFormSubtopics);
  const isLoading = useAppSelector(getQuestionFormIsLoading);

  // Debug: Log when formData.hidden changes
  useEffect(() => {
    console.log('Edit - formData.hidden changed:', formData?.hidden, 'Type:', typeof formData?.hidden);
  }, [formData?.hidden]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subtopics, setSubtopics] = useState<SubTopicDetails[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [currentSubtopic, setCurrentSubtopic] = useState<string | undefined>(
    undefined
  );
  const [existingSubtopicLinks, setExistingSubtopicLinks] = useState<string[]>(
    []
  );
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [nextHiddenFilter, setNextHiddenFilter] = useState<string | undefined>(undefined);
  const [nextTypeFilter, setNextTypeFilter] = useState<string | undefined>(undefined);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Monitor form data changes for debugging
  useEffect(() => {
    console.log('Form data changed:', {
      title: formData.title,
      hasTitle: !!formData.title,
      titleLength: formData.title?.length,
      isDuplicate: router.query.duplicate === 'true',
      hasLoadedInitialData
    });
  }, [formData.title, router.query.duplicate, hasLoadedInitialData]);


  // Store return path when component mounts
  useEffect(() => {
    if (router.isReady) {
      // Check if returnTo is in query params, otherwise use referrer or default
      const returnToParam = router.query.returnTo as string;
      if (returnToParam) {
        setReturnTo(returnToParam);
      } else if (typeof window !== 'undefined' && document.referrer) {
        // Try to extract the path from referrer if it's from the same origin
        try {
          const referrerUrl = new URL(document.referrer);
          const currentUrl = new URL(window.location.href);
          if (referrerUrl.origin === currentUrl.origin && referrerUrl.pathname !== currentUrl.pathname) {
            setReturnTo(referrerUrl.pathname + referrerUrl.search);
          }
        } catch (e) {
          // If referrer parsing fails, use default
        }
      }
    }
  }, [router.isReady, router.query.returnTo]);

  // Reset form and reload when questionId changes
  useEffect(() => {
    if (router.isReady && router.query.questionId) {
      const questionId = String(router.query.questionId);
      const isDuplicate = router.query.duplicate === 'true';
      
      // Reset the loaded flag when questionId changes
      setHasLoadedInitialData(false);
      // Reset loading state when questionId changes
      setIsLoadingNext(false);
      
      // Set the ID in form data
      dispatch(
        setQuestionFormData({
          field: "id",
          value: isDuplicate ? "" : questionId,
        })
      );
    }
  }, [
    dispatch,
    router.isReady,
    router.query.questionId,
    router.query.duplicate,
  ]);

  useEffect(() => {
    // Get Question info by id - only run once per questionId
    if (hasLoadedInitialData || !router.isReady) return;
    
    const questionId = router.query.questionId as string;
    if (!questionId) return;
    
    console.log("Fetching question:", questionId);
    async function getQuestion() {
      dispatch(setQuestionFormIsLoading(true));
      let links = []; // existing subtopic links
      const results = await handleFetchQuestionById(
        authContext?.token,
        questionId
      );

      if ((results as { error: string })?.error) {
        toast({
          title: (results as { error: string })?.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
      } else {
        // Populate form with data
        const isDuplicate = router.query.duplicate === 'true';
        const questionData = results as QuestionDetails;
        
        console.log('Duplicate mode:', isDuplicate);
        console.log('Question data:', questionData);
        console.log('Original title:', questionData?.title);
        
        const data = {
          id: isDuplicate ? "" : questionId,
          title: isDuplicate 
            ? `Copy of ${questionData?.title || 'Question'}` 
            : (questionData?.title || ''),
          content: questionData?.content || '',
          description: questionData?.description || '',
          tags: questionData?.tags || [],
          totalPotentialMarks: questionData?.totalPotentialMarks || 1,
          difficultyLevel: questionData?.difficultyLevel || 0.1,
          type: questionData?.type || QuestionType.MULTIPLE_CHOICE,
          explanation: questionData?.explanation || "",
          hidden: typeof questionData?.hidden === 'boolean' ? questionData.hidden : false,
        };

        let newOptions = [];
        let newShortAnswers = [];

        if (data.type === QuestionType.TRUE_FALSE) {
          newOptions = [
            {
              id: 1,
              content: "True",
              isCorrect: questionData.isTrue,
            },
            {
              id: 2,
              content: "False",
              isCorrect: !questionData.isTrue,
            },
          ];
        } else if (data.type === QuestionType.MULTIPLE_CHOICE) {
          // Ensure each option has a proper unique ID
          newOptions = (questionData?.multipleChoiceOptions ?? []).map((option, index) => ({
            ...option,
            id: option.id || (index + 1)
          }));
        } else if (data.type === QuestionType.SHORT_ANSWER) {
          // Populate short answers from questionData
          console.log('Question type is SHORT_ANSWER, questionData:', questionData);
          console.log('questionData.shortAnswers:', questionData?.shortAnswers);
          newShortAnswers = (questionData?.shortAnswers ?? []).map((answer) => ({
            content: answer.content || "",
            marks: answer.marks || 1,
            explanation: answer.explanation || "",
          }));
          // If no short answers exist, initialize with one empty entry
          if (newShortAnswers.length === 0) {
            console.log('No short answers found, initializing with empty entry');
            newShortAnswers = [{ content: "", marks: 1, explanation: "" }];
          }
          console.log('Final short answers to load:', newShortAnswers);
        }
        data["multipleChoiceOptions"] = newOptions;
        data["shortAnswers"] = newShortAnswers;
        
        // For duplicate mode, copy the original question's subtopics
        if (isDuplicate) {
          links = questionData?.subTopics?.map((el) => String(el.id)) || [];
          console.log('Duplicate mode: Copying subtopic links:', links);
        } else {
          links = questionData?.subTopics?.map((el) => String(el.id)) || [];
          console.log('Edit mode: Setting existing subtopic links:', links);
        }

        // Set all form data at once to avoid state conflicts
        console.log('Setting form data:', data);
        console.log('Final title:', data.title);
        
        // Set form data field by field to ensure proper Redux state update
        dispatch(setQuestionFormData({ field: 'title', value: data.title }));
        dispatch(setQuestionFormData({ field: 'content', value: data.content }));
        dispatch(setQuestionFormData({ field: 'description', value: data.description }));
        dispatch(setQuestionFormData({ field: 'tags', value: data.tags }));
        dispatch(setQuestionFormData({ field: 'totalPotentialMarks', value: data.totalPotentialMarks }));
        dispatch(setQuestionFormData({ field: 'difficultyLevel', value: data.difficultyLevel }));
        dispatch(setQuestionFormData({ field: 'type', value: data.type }));
        dispatch(setQuestionFormData({ field: 'explanation', value: data.explanation }));
        dispatch(setQuestionFormData({ field: 'hidden', value: data.hidden }));
        dispatch(setQuestionFormData({ field: 'multipleChoiceOptions', value: (data as any).multipleChoiceOptions || [] }));
        dispatch(setQuestionFormData({ field: 'shortAnswers', value: newShortAnswers }));
        
        // For duplicate mode, set the subtopics in Redux state
        if (isDuplicate) {
          console.log('Duplicate mode: Setting subtopics in Redux state:', links);
          dispatch(setAllQuestionFormSubtopics(links));
        }
        
        setHasLoadedInitialData(true);
      }

      dispatch(setQuestionFormIsLoading(false));
      setExistingSubtopicLinks(links);
    }

    if (router.query.questionId) getQuestion();
  }, [authContext?.token, dispatch, router.query.questionId, router.query.duplicate, hasLoadedInitialData]);

  //  GET LIST OF SUB TOPICS
  useEffect(() => {
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
  }, [authContext?.token]);

  useEffect(() => {
    dispatch(setAllQuestionFormSubtopics(existingSubtopicLinks));
  }, [dispatch, existingSubtopicLinks]);

  // Update form data
  const handleInputChange = useCallback(
    (field: keyof QuestionFormData, value: any) => {
      console.log('Edit - handleInputChange called:', { field, value, valueType: typeof value });
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
      const newOptions = formData.multipleChoiceOptions.map((option) =>
        option.id === id ? { ...option, content } : { ...option }
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
      const newOptions = formData.multipleChoiceOptions.map((option) =>
        option.id === id ? { ...option, isCorrect: !option.isCorrect } : { ...option }
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
      const newTags = formData.tags.filter((t) => t !== tag);
      dispatch(setQuestionFormData({ field: "tags", value: newTags }));
    },
    [dispatch, formData.tags]
  );

  const handleSubtopic = useCallback(
    (id: string) => {
      dispatch(
        setQuestionFormSubtopics({ operation_type: "REMOVE", value: id })
      );
    },
    [dispatch]
  );

  const handleAddSubtopic = useCallback(() => {
    if (currentSubtopic && !questionSubtopics.includes(currentSubtopic)) {
      dispatch(
        setQuestionFormSubtopics({
          operation_type: "ADD",
          value: currentSubtopic,
        })
      );
      setCurrentSubtopic(undefined);
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
      if (questionSubtopics.length === 0) return true;
      let linkSuccess = true;

      console.log('handleLinkSubtopics called with:', {
        questionId,
        questionSubtopics,
        existingSubtopicLinks,
        isDuplicate: router.query.duplicate === 'true'
      });

      try {
        // For duplicates, link all subtopics. For edits, only link new ones.
        const subtopicsToLink = router.query.duplicate === 'true' 
          ? questionSubtopics 
          : questionSubtopics.filter((subtopic) => !existingSubtopicLinks.includes(subtopic));
        
        console.log('Subtopics to link:', subtopicsToLink);

        for (let subtopicId of subtopicsToLink) {
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
          } else if (rawResponse.ok && subtopicId === questionSubtopics[-1])
            linkSuccess = true;
        }
      } catch (e) {
        linkSuccess = false;
        console.log("Question Link err: ", e);
        // displayErrorMessage('Failed to link question to selected subtopics')
      }

      return linkSuccess;
    },
    [existingSubtopicLinks, questionSubtopics, router.query.duplicate]
  );

  // Handle linking question to sub topic
  const handleUnLinkingSubtopics = useCallback(
    async (questionId: string) => {
      if (existingSubtopicLinks.length === 0) return true;
      let unLinkSuccess = true;

      try {
        for (let subtopicId of existingSubtopicLinks.filter(
          (subtopic) => !questionSubtopics.includes(subtopic)
        )) {
          const rawResponse = await fetch(
            `/api/sub-topics/${subtopicId}/question/${questionId}`,
            {
              method: "DELETE",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            }
          );

          if (!rawResponse.ok) {
            unLinkSuccess = false;
            break;
          } else if (
            rawResponse.ok &&
            subtopicId === questionSubtopics[questionSubtopics.length - 1]
          )
            unLinkSuccess = true;
        }
      } catch (e) {
        unLinkSuccess = false;
        console.log("Question Link err: ", e);
        // displayErrorMessage('Failed to link question to selected subtopics')
      }

      return unLinkSuccess;
    },
    [existingSubtopicLinks, questionSubtopics]
  );

  // Form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Debug logging
      console.log('Form Data on Submit:', formData);
      console.log('Is Duplicate:', router.query.duplicate === 'true');
      
      // Check if form data is loaded
      const isDuplicate = router.query.duplicate === 'true';
      if (!hasLoadedInitialData && !isDuplicate) {
        displayErrorMessage("Form not ready", "Please wait for the form to load");
        return;
      }
      
      // For duplicate mode, ensure we have the title
      if (isDuplicate && (!formData.title || formData.title.trim() === '')) {
        displayErrorMessage("Form not ready", "Please wait for the form to load completely");
        return;
      }
      
      // Check if form is still loading
      if (isLoading) {
        displayErrorMessage("Form loading", "Please wait for the form to finish loading");
        return;
      }
      
      // CRITICAL: Validate that the form data ID matches the URL questionId
      // This prevents updating the wrong question if state gets mixed up
      const urlQuestionId = router.query.questionId as string;
      const currentState = store.getState();
      const currentFormData = currentState.QuestionPageSlice.questionFormData;
      const formDataId = (currentFormData as any).id || formData.id;
      
      if (!isDuplicate) {
        if (!urlQuestionId) {
          displayErrorMessage("Missing question id", "No question id found in URL");
          return;
        }
        if (!formDataId) {
          displayErrorMessage("Missing question id", "No question id found in form");
          return;
        }
        if (String(formDataId) !== String(urlQuestionId)) {
          displayErrorMessage(
            "Data mismatch", 
            `Form data ID (${formDataId}) does not match URL question ID (${urlQuestionId}). Please reload the page.`
          );
          console.error('ID MISMATCH:', {
            formDataId,
            urlQuestionId,
            formData: currentFormData,
            routerQuery: router.query
          });
          return;
        }
      }
      
      // Check if title exists and is not empty
      if (!formData.title || !formData.title.trim()) {
        console.log('Title validation failed:', { 
          title: formData.title, 
          formData,
          isDuplicate,
          hasLoadedInitialData,
          isLoading
        });
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

      setIsSubmitting(true);

      try {
        // Read ALL form data directly from Redux store to ensure we get the latest values
        // This bypasses any selector caching issues
        const currentState = store.getState();
        const currentFormData = currentState.QuestionPageSlice.questionFormData;
        
        const isTrue =
          currentFormData.type === QuestionType.MULTIPLE_CHOICE ||
          currentFormData.type === QuestionType.SHORT_ANSWER
            ? undefined
            : currentFormData.multipleChoiceOptions.find(
                (el) => el?.content?.toLowerCase() === "true"
              )?.isCorrect;
        
        // Get hidden value
        const hiddenValue = currentFormData.hidden === true ? true : false;

        let params = {
          questionDetails: {
            title: currentFormData.title,
            content: currentFormData.content,
            description: currentFormData.description,
            tags: currentFormData.tags,
            totalPotentialMarks: currentFormData.totalPotentialMarks,
            difficultyLevel: currentFormData.difficultyLevel,
            type: currentFormData.type,
            multipleChoiceOptions:
              currentFormData.type === QuestionType.MULTIPLE_CHOICE
                ? currentFormData.multipleChoiceOptions
                : null,
            shortAnswers:
              currentFormData.type === QuestionType.SHORT_ANSWER
                ? currentFormData.shortAnswers
                : null,
            isTrue: isTrue,
            explanation: currentFormData.explanation,
            hidden: hiddenValue,
          },
          id: urlQuestionId, // Always use the URL questionId as the source of truth
        };

        // Remove nulls (this should preserve false, but we'll restore hidden anyway)
        params = removeNulls(params) as any;
        
        // Always explicitly set hidden after removeNulls to ensure it's included
        if (params.questionDetails) {
          params.questionDetails.hidden = hiddenValue;
        } else {
          // This shouldn't happen, but handle it just in case
          (params as any).questionDetails = { hidden: hiddenValue };
        }

        console.log('Update Question - hidden value:', hiddenValue);
        console.log('Update Question - params after removeNulls:', JSON.stringify(params, null, 2));
        console.log('API Request method:', isDuplicate ? "POST" : "PUT");

        const rawResponse = await fetch("/api/questions", {
          method: isDuplicate ? "POST" : "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authContext.token}`,
          },
          body: JSON.stringify(params),
        });
        const data: QuestionDetails = await rawResponse.json();
        console.log('API Response:', data);

        if (!rawResponse.ok) {
          console.log('API Error Response:', data);
          displayErrorMessage("API Error", (data as any).error || "Failed to process request");
          return;
        }

        let linkedAllSubtopics = true;
        let unlinkSuccessful = true;
        // if created successfully link question to subtopic
        if (data?.id) {
          console.log('Linking subtopics for question:', data.id);
          console.log('Subtopics to link:', questionSubtopics);
          linkedAllSubtopics = await handleLinkSubtopics(String(data.id));
          console.log('Subtopics linked successfully:', linkedAllSubtopics);
        }
        if (data?.id) {
          console.log('Unlinking old subtopics for question:', data.id);
          console.log('Existing subtopic links:', existingSubtopicLinks);
          unlinkSuccessful = await handleUnLinkingSubtopics(String(data.id));
          console.log('Subtopics unlinked successfully:', unlinkSuccessful);
        }

        if (!linkedAllSubtopics || !unlinkSuccessful || !data.id)
          displayErrorMessage(
            !data?.id
              ? `Failed to ${isDuplicate ? 'create' : 'update'} question!`
              : "Failed to Link questions"
          );
        else {
          displaySuccessMessage(`Question ${isDuplicate ? 'Created' : 'Updated'}!`);
          setIsSubmitting(false);
          
          // For duplicates (creates), navigate back after a delay
          // For updates, keep the user on the edit page and update form data from response
          if (isDuplicate) {
            dispatch(resetQuestionPageSlice());
            setTimeout(() => {
              // Navigate back to the previous page if available, otherwise go to questions list
              if (returnTo) {
                router.push(returnTo);
              } else {
                router.back();
              }
            }, 1500);
          } else {
            // For updates, update the form data directly from the response without resetting
            // This prevents the infinite loading loop
            if (data.id) {
              // Update form data from the response
              dispatch(setQuestionFormData({ field: 'title', value: data.title }));
              dispatch(setQuestionFormData({ field: 'content', value: data.content }));
              dispatch(setQuestionFormData({ field: 'description', value: data.description || '' }));
              dispatch(setQuestionFormData({ field: 'tags', value: data.tags || [] }));
              dispatch(setQuestionFormData({ field: 'totalPotentialMarks', value: data.totalPotentialMarks }));
              dispatch(setQuestionFormData({ field: 'difficultyLevel', value: data.difficultyLevel }));
              dispatch(setQuestionFormData({ field: 'type', value: data.type }));
              dispatch(setQuestionFormData({ field: 'explanation', value: data.explanation || '' }));
              dispatch(setQuestionFormData({ field: 'hidden', value: typeof data.hidden === 'boolean' ? data.hidden : false }));
              
              // Update options based on type
              if (data.type === QuestionType.TRUE_FALSE) {
                dispatch(setQuestionFormData({ 
                  field: 'multipleChoiceOptions', 
                  value: [
                    { id: 1, content: "True", isCorrect: data.isTrue },
                    { id: 2, content: "False", isCorrect: !data.isTrue },
                  ]
                }));
              } else if (data.type === QuestionType.MULTIPLE_CHOICE) {
                dispatch(setQuestionFormData({ 
                  field: 'multipleChoiceOptions', 
                  value: (data.multipleChoiceOptions || []).map((option, index) => ({
                    ...option,
                    id: option.id || (index + 1)
                  }))
                }));
              } else if (data.type === QuestionType.SHORT_ANSWER) {
                dispatch(setQuestionFormData({ 
                  field: 'shortAnswers', 
                  value: (data.shortAnswers || []).map((answer) => ({
                    content: answer.content || "",
                    marks: answer.marks || 1,
                    explanation: answer.explanation || "",
                  }))
                }));
              }
              
              // Update subtopics
              if (data.subTopics) {
                const subtopicIds = data.subTopics.map((st) => String(st.id));
                dispatch(setAllQuestionFormSubtopics(subtopicIds));
              }
            }
          }
        }
      } catch (e) {
        console.log("On Submit Error", e);
        displayErrorMessage("Failed to submit!");
        setIsSubmitting(false);
      }
    },
    [
      authContext.token,
      dispatch,
      formData.content,
      formData?.description,
      formData?.difficultyLevel,
      formData.id,
      formData.multipleChoiceOptions,
      formData?.tags,
      formData.title,
      formData?.totalPotentialMarks,
      formData.type,
      formData?.explanation,
      handleLinkSubtopics,
      handleUnLinkingSubtopics,
      questionSubtopics?.length,
      router,
      returnTo,
    ]
  );

  const handleNextQuestion = useCallback(async () => {
    if (!authContext?.token || !router.query.questionId) return;
    
    setIsLoadingNext(true);
    try {
      const currentQuestionId = String(router.query.questionId);
      const hidden = nextHiddenFilter !== undefined ? nextHiddenFilter === "true" : undefined;
      const type = nextTypeFilter || undefined;

      const result = await handleFetchNextQuestion(
        authContext.token,
        currentQuestionId,
        hidden,
        type
      );

      if (result.error) {
        displayErrorMessage("Failed to fetch next question", result.error);
        setIsLoadingNext(false);
        return;
      }

      if (result.nextId) {
        // Reset loading state before navigation
        setIsLoadingNext(false);
        // Navigate to the next question's edit page, preserving returnTo if it exists
        const query: Record<string, string> = {};
        if (returnTo) {
          query.returnTo = returnTo;
        }
        router.push({
          pathname: `/admin/topics/subtopics/questions/edit/${result.nextId}`,
          query,
        });
      } else {
        displayErrorMessage("No next question found", "There are no more questions matching your filters.");
        setIsLoadingNext(false);
      }
    } catch (error) {
      console.error("Error fetching next question:", error);
      displayErrorMessage("Failed to fetch next question");
      setIsLoadingNext(false);
    }
  }, [authContext?.token, router, nextHiddenFilter, nextTypeFilter, returnTo]);

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
            <Button variant="ghost" size="icon" onClick={() => {
              if (returnTo) {
                router.push(returnTo);
              } else {
                router.back();
              }
            }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">
              {isMounted && router.isReady && router.query.duplicate === 'true' 
                ? 'Create Question' 
                : isMounted && router.isReady && router.query.questionId 
                  ? 'Update Question' 
                  : 'Question'}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 border-r pr-2 mr-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="next-hidden" className="text-sm text-muted-foreground whitespace-nowrap">
                  Hidden:
                </Label>
                <Select
                  value={nextHiddenFilter || "all"}
                  onValueChange={(value) => setNextHiddenFilter(value === "all" ? undefined : value)}
                >
                  <SelectTrigger id="next-hidden" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Hidden</SelectItem>
                    <SelectItem value="false">Visible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="next-type" className="text-sm text-muted-foreground whitespace-nowrap">
                  Type:
                </Label>
                <Select
                  value={nextTypeFilter || "all"}
                  onValueChange={(value) => setNextTypeFilter(value === "all" ? undefined : value)}
                >
                  <SelectTrigger id="next-type" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                    <SelectItem value={QuestionType.TRUE_FALSE}>True/False</SelectItem>
                    <SelectItem value={QuestionType.SHORT_ANSWER}>Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={handleNextQuestion}
                disabled={isLoadingNext}
                className="whitespace-nowrap"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {isLoadingNext ? "Loading..." : "Next"}
              </Button>
            </div>
            <Button variant="outline" onClick={() => {
              if (returnTo) {
                router.push(returnTo);
              } else {
                router.back();
              }
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting 
                ? (router.query.duplicate === 'true' ? "Creating..." : "Updating...") 
                : (router.query.duplicate === 'true' ? "Create Question" : "Update Question")
              }
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
                      step="0.01"
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
                        step="0.01"
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
                        {(formData.difficultyLevel * 10).toFixed(2)}/10
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

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="hidden">Hidden</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide this question from students
                  </p>
                </div>
                <Switch
                  id="hidden"
                  checked={formData.hidden}
                  onCheckedChange={(checked) => {
                    console.log('Edit - Switch toggled, new value:', checked);
                    handleInputChange("hidden", checked);
                  }}
                />
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
                    onValueChange={(value) => setCurrentSubtopic(value)}
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
                    
                    {formData.explanation && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Explanation:
                        </p>
                        <MarkdownRenderer
                          content={formData.explanation}
                          className="text-sm"
                        />
                      </div>
                    )}
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
              <Button variant="outline" onClick={() => {
                if (returnTo) {
                  router.push(returnTo);
                } else {
                  router.back();
                }
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (router.query.duplicate === 'true' ? "Creating..." : "Updating...") 
                  : (router.query.duplicate === 'true' ? "Create Question" : "Update Question")
                }
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}

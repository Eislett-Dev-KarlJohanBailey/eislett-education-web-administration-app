import React, { useEffect, useState, useContext, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataManagementLayout } from "@/components/layout/DataManagementLayout";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MoreHorizontal, Trash, Plus, X, ChevronDown, ChevronRight, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { handleFetchSubTopics } from "@/services/subtopics/subTopicsRequest";
import { SubTopicDetails } from "@/models/subTopic/subTopicDetails";
import {
  handleFetchRoadmapById,
  handleFetchRoadmaps,
  handleUpdateRoadmap,
  Roadmap,
  Strand,
  Section,
  Quiz,
} from "@/services/roadmaps/roadmapsRequest";
import {
  displayErrorMessage,
  displaySuccessMessage,
} from "@/services/displayMessages";
import { DeleteConfirmationDialog } from "@/components/data/DeleteConfirmationDialog";

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
}

const STAGE_OPTIONS = [
  "Fundamentals",
  "Intermediate",
  "Advanced",
  "Expert",
  "Master",
];

export default function RoadmapsPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [filteredRoadmaps, setFilteredRoadmaps] = useState<Roadmap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedStrands, setExpandedStrands] = useState<Record<string, boolean>>({});
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"strand" | "section" | "quiz" | null>(null);
  const [deleteIndices, setDeleteIndices] = useState<{
    strandIndex?: number;
    sectionIndex?: number;
    quizIndex?: number;
  } | null>(null);

  // Dropdown data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<SubTopicDetails[]>([]);

  // Form state - subject is always a string in form (ID only)
  const [formData, setFormData] = useState<Omit<Roadmap, 'subject'> & { subject: string }>({
    id: "",
    name: "",
    description: "",
    premium: false,
    subject: "",
    strands: [],
  });

  // Fetch roadmaps
  const fetchRoadmaps = useCallback(async () => {
    if (!authContext?.token) return;

    setIsLoading(true);
    try {
      const results = await handleFetchRoadmaps(
        authContext.token,
        1,
        1000
      );

      if ((results as { error: string })?.error) {
        displayErrorMessage(
          "Error",
          (results as { error: string }).error || "Failed to fetch roadmaps"
        );
        setRoadmaps([]);
        setFilteredRoadmaps([]);
      } else {
        const roadmapsList = results.data || [];
        setRoadmaps(roadmapsList);
        setFilteredRoadmaps(roadmapsList);
      }
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
      displayErrorMessage("Error", "Failed to fetch roadmaps");
      setRoadmaps([]);
      setFilteredRoadmaps([]);
    } finally {
      setIsLoading(false);
    }
  }, [authContext?.token]);

  // Fetch subjects
  const fetchSubjects = useCallback(async () => {
    if (!authContext?.token) return;

    try {
      const response = await fetch("/api/subjects?page_number=1&page_size=1000", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const subjectsList = Array.isArray(data) ? data : data.data || [];
        setSubjects(subjectsList);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  }, [authContext?.token]);

  // Fetch topics
  const fetchTopics = useCallback(async () => {
    if (!authContext?.token) return;

    try {
      const response = await fetch("/api/topics?page_number=1&page_size=1000", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const topicsList = Array.isArray(data) ? data : data.data || [];
        setTopics(topicsList);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  }, [authContext?.token]);

  // Fetch subtopics
  const fetchSubtopics = useCallback(async () => {
    if (!authContext?.token) return;

    try {
      const results = await handleFetchSubTopics(
        authContext.token,
        1,
        1000
      );

      if (!(results as { error: string })?.error) {
        setSubtopics(results.data ?? []);
      }
    } catch (error) {
      console.error("Error fetching subtopics:", error);
    }
  }, [authContext?.token]);

  useEffect(() => {
    fetchRoadmaps();
    fetchSubjects();
    fetchTopics();
    fetchSubtopics();
  }, [fetchRoadmaps, fetchSubjects, fetchTopics, fetchSubtopics]);

  // Handle edit
  const handleEdit = async (id: string) => {
    if (!authContext?.token) return;

    setIsLoading(true);
    try {
      const result = await handleFetchRoadmapById(authContext.token, id);

      if ((result as { error: string })?.error) {
        displayErrorMessage(
          "Error",
          (result as { error: string }).error || "Failed to fetch roadmap details"
        );
      } else {
        const roadmapData = result as Roadmap;
        setSelectedRoadmap(roadmapData);
        // Extract subject ID if it's an object
        const subjectId = getSubjectId(roadmapData.subject);
        
        // Transform strands: extract topic IDs and quiz subtopic IDs
        const transformedStrands = roadmapData.strands?.map((strand) => {
          // Extract topic ID if it's an object
          const topicId = typeof strand.topic === "string" 
            ? strand.topic 
            : (strand.topic as any)?.id || "";
          
          // Transform sections and quizzes
          const transformedSections = strand.sections?.map((section) => {
            const transformedQuizzes = section.quizzes?.map((quiz) => {
              // Extract subtopic IDs from array of objects
              const subtopicIds = (quiz.subTopics || []).map((st: any) => 
                typeof st === "string" ? st : st?.id || ""
              ).filter(Boolean);
              
              return {
                ...quiz,
                subTopics: subtopicIds,
              };
            });
            
            return {
              ...section,
              quizzes: transformedQuizzes,
            };
          });
          
          return {
            ...strand,
            topic: topicId,
            sections: transformedSections,
          };
        });
        
        setFormData({
          ...roadmapData,
          subject: subjectId,
          strands: transformedStrands,
        });
        setIsEditMode(true);
      }
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      displayErrorMessage("Error", "Failed to fetch roadmap details");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!authContext?.token || !formData.id) return;

    if (!formData.name) {
      displayErrorMessage("Validation Error", "Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = prepareFormDataForSubmit();
      const result = await handleUpdateRoadmap(
        authContext.token,
        formData.id,
        dataToSubmit
      );

      if ((result as { error: string })?.error) {
        displayErrorMessage(
          "Error",
          (result as { error: string }).error || "Failed to update roadmap"
        );
      } else {
        displaySuccessMessage("Roadmap updated successfully!");
        fetchRoadmaps();
        setIsEditMode(false);
        setSelectedRoadmap(null);
      }
    } catch (error: any) {
      console.error("Error updating roadmap:", error);
      displayErrorMessage("Error", error.message || "Failed to update roadmap");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Strand handlers
  const addStrand = () => {
    setFormData({
      ...formData,
      strands: [
        ...(formData.strands || []),
        {
          topic: "",
          sections: [],
          grade: 0,
          gradeName: "",
        },
      ],
    });
  };

  // Ensure IDs are preserved when updating nested structures
  // Transform all data to ensure IDs are strings (not objects)
  const prepareFormDataForSubmit = (): Omit<Roadmap, 'subject'> & { subject: string } => {
    return {
      ...formData,
      subject: typeof formData.subject === "string" 
        ? formData.subject 
        : (formData.subject as any)?.id || "",
      strands: formData.strands?.map((strand) => {
        // Ensure topic is a string ID
        const topicId = typeof strand.topic === "string" 
          ? strand.topic 
          : (strand.topic as any)?.id || "";
        
        return {
          ...strand,
          topic: topicId,
          sections: strand.sections?.map((section) => ({
            ...section,
            quizzes: section.quizzes?.map((quiz) => {
              // Ensure subTopics is an array of string IDs
              const subtopicIds = (quiz.subTopics || []).map((st: any) => 
                typeof st === "string" ? st : st?.id || ""
              ).filter(Boolean);
              
              return {
                ...quiz,
                subTopics: subtopicIds,
              };
            }),
          })),
        };
      }),
    };
  };

  const handleDeleteStrand = (index: number) => {
    setDeleteType("strand");
    setDeleteIndices({ strandIndex: index });
    setDeleteDialogOpen(true);
  };

  const removeStrand = (index: number) => {
    const newStrands = [...(formData.strands || [])];
    newStrands.splice(index, 1);
    setFormData({ ...formData, strands: newStrands });
  };

  const updateStrand = (index: number, field: keyof Strand, value: any) => {
    const newStrands = [...(formData.strands || [])];
    newStrands[index] = { ...newStrands[index], [field]: value };
    setFormData({ ...formData, strands: newStrands });
  };

  // Section handlers
  const addSection = (strandIndex: number) => {
    const newStrands = [...(formData.strands || [])];
    newStrands[strandIndex].sections = [
      ...(newStrands[strandIndex].sections || []),
      {
        title: "",
        description: "",
        quizzes: [],
      },
    ];
    setFormData({ ...formData, strands: newStrands });
  };

  const handleDeleteSection = (strandIndex: number, sectionIndex: number) => {
    setDeleteType("section");
    setDeleteIndices({ strandIndex, sectionIndex });
    setDeleteDialogOpen(true);
  };

  const removeSection = (strandIndex: number, sectionIndex: number) => {
    const newStrands = [...(formData.strands || [])];
    newStrands[strandIndex].sections.splice(sectionIndex, 1);
    setFormData({ ...formData, strands: newStrands });
  };

  const updateSection = (
    strandIndex: number,
    sectionIndex: number,
    field: keyof Section,
    value: any
  ) => {
    const newStrands = [...(formData.strands || [])];
    newStrands[strandIndex].sections[sectionIndex] = {
      ...newStrands[strandIndex].sections[sectionIndex],
      [field]: value,
    };
    setFormData({ ...formData, strands: newStrands });
  };

  // Quiz handlers
  const addQuiz = (strandIndex: number, sectionIndex: number) => {
    const newStrands = [...(formData.strands || [])];
    newStrands[strandIndex].sections[sectionIndex].quizzes = [
      ...(newStrands[strandIndex].sections[sectionIndex].quizzes || []),
      {
        difficultyLevel: 0.1,
        difficultyRange: 0.1,
        numberOfQuestions: 10,
        subTopics: [],
        stage: "Fundamentals",
      },
    ];
    setFormData({ ...formData, strands: newStrands });
  };

  const handleDeleteQuiz = (
    strandIndex: number,
    sectionIndex: number,
    quizIndex: number
  ) => {
    setDeleteType("quiz");
    setDeleteIndices({ strandIndex, sectionIndex, quizIndex });
    setDeleteDialogOpen(true);
  };

  const removeQuiz = (
    strandIndex: number,
    sectionIndex: number,
    quizIndex: number
  ) => {
    const newStrands = [...(formData.strands || [])];
    newStrands[strandIndex].sections[sectionIndex].quizzes.splice(
      quizIndex,
      1
    );
    setFormData({ ...formData, strands: newStrands });
  };

  const handleDeleteConfirm = () => {
    if (!deleteType || !deleteIndices) return;

    if (deleteType === "strand" && deleteIndices.strandIndex !== undefined) {
      removeStrand(deleteIndices.strandIndex);
    } else if (
      deleteType === "section" &&
      deleteIndices.strandIndex !== undefined &&
      deleteIndices.sectionIndex !== undefined
    ) {
      removeSection(deleteIndices.strandIndex, deleteIndices.sectionIndex);
    } else if (
      deleteType === "quiz" &&
      deleteIndices.strandIndex !== undefined &&
      deleteIndices.sectionIndex !== undefined &&
      deleteIndices.quizIndex !== undefined
    ) {
      removeQuiz(
        deleteIndices.strandIndex,
        deleteIndices.sectionIndex,
        deleteIndices.quizIndex
      );
    }

    setDeleteDialogOpen(false);
    setDeleteType(null);
    setDeleteIndices(null);
  };

  const getDeleteWarningMessage = () => {
    let itemType = "";
    if (deleteType === "strand") {
      itemType = "strand";
    } else if (deleteType === "section") {
      itemType = "section";
    } else if (deleteType === "quiz") {
      itemType = "quiz";
    }

    return (
      <div className="space-y-3">
        <div className="font-semibold text-destructive">
          ⚠️ WARNING: Deleting this {itemType} can significantly affect students' progress and learning experience.
        </div>
        <div>
          Students who are currently working on this content may lose their progress or encounter errors. This action cannot be undone.
        </div>
        <div className="bg-muted p-3 rounded-md border-l-4 border-blue-500">
          <div className="font-medium mb-1">💡 RECOMMENDATION:</div>
          <div>Instead of deleting, consider editing the item inline to modify its content. This preserves student progress and maintains data integrity.</div>
        </div>
        <div className="font-medium">
          Are you absolutely sure you want to delete this {itemType}?
        </div>
      </div>
    );
  };

  const updateQuiz = (
    strandIndex: number,
    sectionIndex: number,
    quizIndex: number,
    field: keyof Quiz,
    value: any
  ) => {
    const newStrands = [...(formData.strands || [])];
    newStrands[strandIndex].sections[sectionIndex].quizzes[quizIndex] = {
      ...newStrands[strandIndex].sections[sectionIndex].quizzes[quizIndex],
      [field]: value,
    };
    setFormData({ ...formData, strands: newStrands });
  };

  const toggleSubtopic = (
    strandIndex: number,
    sectionIndex: number,
    quizIndex: number,
    subtopicId: string
  ) => {
    const newStrands = [...(formData.strands || [])];
    const quiz = newStrands[strandIndex].sections[sectionIndex].quizzes[quizIndex];
    // Normalize subTopics to array of string IDs
    const currentSubTopics = (quiz.subTopics || []).map((st: any) => 
      typeof st === "string" ? st : st?.id || ""
    ).filter(Boolean) as string[];
    
    const index = currentSubTopics.indexOf(subtopicId);
    
    if (index > -1) {
      currentSubTopics.splice(index, 1);
    } else {
      currentSubTopics.push(subtopicId);
    }
    
    newStrands[strandIndex].sections[sectionIndex].quizzes[quizIndex] = {
      ...quiz,
      subTopics: currentSubTopics,
    };
    setFormData({ ...formData, strands: newStrands });
  };

  const toggleSection = (strandIndex: number, sectionIndex: number) => {
    const key = `${strandIndex}-${sectionIndex}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleStrand = (strandIndex: number) => {
    setExpandedStrands(prev => ({
      ...prev,
      [strandIndex]: !prev[strandIndex]
    }));
  };

  // Searchable Topics Combobox Component
  const TopicsCombobox = ({
    strandIndex,
    currentTopicId,
  }: {
    strandIndex: number;
    currentTopicId: string;
  }) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter topics case-insensitively
    const filteredTopics = topics.filter((topic) =>
      topic.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedTopic = topics.find((t) => t.id === currentTopicId);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            <span className="truncate">
              {selectedTopic ? selectedTopic.name : "Select topic..."}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search topics..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No topics found.</CommandEmpty>
              <CommandGroup>
                {filteredTopics.map((topic) => {
                  const isSelected = topic.id === currentTopicId;
                  return (
                    <CommandItem
                      key={topic.id}
                      value={topic.id}
                      onSelect={() => {
                        updateStrand(strandIndex, "topic", topic.id);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {topic.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // Searchable Subtopics Combobox Component
  const SubtopicsCombobox = ({
    strandIndex,
    sectionIndex,
    quizIndex,
    selectedSubtopics,
  }: {
    strandIndex: number;
    sectionIndex: number;
    quizIndex: number;
    selectedSubtopics: string[] | Array<{ id: string; name?: string }>;
  }) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    // Normalize selectedSubtopics to array of string IDs
    const selectedIds = selectedSubtopics.map((st: any) => 
      typeof st === "string" ? st : st?.id || ""
    ).filter(Boolean);

    // Filter subtopics case-insensitively
    const filteredSubtopics = subtopics.filter((subtopic) =>
      subtopic.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedIds.length > 0
                ? `${selectedIds.length} selected`
                : "Select subtopics..."}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search subtopics..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No subtopics found.</CommandEmpty>
              <CommandGroup>
                {filteredSubtopics.map((subtopic) => {
                  const isSelected = selectedIds.includes(subtopic.id);
                  return (
                    <CommandItem
                      key={subtopic.id}
                      value={subtopic.id}
                      onSelect={() => {
                        toggleSubtopic(strandIndex, sectionIndex, quizIndex, subtopic.id);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {subtopic.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const getSubjectName = (subject: string | { id: string; name: string } | undefined) => {
    if (!subject) return "Unknown";
    if (typeof subject === "string") {
      return subjects.find((s) => s.id === subject)?.name || subject;
    }
    return subject.name || subject.id;
  };

  const getSubjectId = (subject: string | { id: string; name: string } | undefined): string => {
    if (!subject) return "";
    if (typeof subject === "string") {
      return subject;
    }
    return subject.id;
  };

  const getTopicName = (id: string) => {
    return topics.find((t) => t.id === id)?.name || id;
  };

  const getSubtopicName = (id: string) => {
    return subtopics.find((s) => s.id === id)?.name || id;
  };

  const columns = [
    {
      id: "id",
      header: "ID",
      cell: (roadmap: Roadmap) => (
        <span className="text-muted-foreground text-sm">{roadmap.id}</span>
      ),
      sortable: true,
    },
    {
      id: "name",
      header: "Name",
      cell: (roadmap: Roadmap) => (
        <span className="font-medium">{roadmap.name}</span>
      ),
      sortable: true,
    },
    {
      id: "subject",
      header: "Subject",
      cell: (roadmap: Roadmap) => (
        <span>{getSubjectName(roadmap.subject)}</span>
      ),
      sortable: false,
    },
    {
      id: "premium",
      header: "Premium",
      cell: (roadmap: Roadmap) => (
        <Badge variant={roadmap.premium ? "default" : "secondary"}>
          {roadmap.premium ? "Yes" : "No"}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "",
      cell: (roadmap: Roadmap) => (
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
              <DropdownMenuItem onClick={() => handleEdit(roadmap.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Tabs defaultValue="list" value={isEditMode ? "edit" : "list"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Roadmaps List</TabsTrigger>
          {isEditMode && <TabsTrigger value="edit">Edit Roadmap</TabsTrigger>}
        </TabsList>

        <TabsContent value="list">
          <DataManagementLayout
            title="Roadmaps"
            description="Manage all roadmaps in the system"
            searchPlaceholder="Search roadmaps..."
            isLoading={isLoading}
            className="px-2 sm:px-4"
          >
            <DataTable
              data={filteredRoadmaps}
              columns={columns}
              keyExtractor={(item) => item.id}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">No roadmaps found</p>
                </div>
              }
            />
          </DataManagementLayout>
        </TabsContent>

        <TabsContent value="edit">
          {selectedRoadmap && (
            <div className="space-y-6 px-2 sm:px-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Edit Roadmap</h1>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditMode(false);
                      setSelectedRoadmap(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Enter the basic information for the roadmap
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter roadmap name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter roadmap description"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="premium"
                      checked={formData.premium}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, premium: checked })
                      }
                    />
                    <Label htmlFor="premium">Premium</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) =>
                        setFormData({ ...formData, subject: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Strands</CardTitle>
                      <CardDescription>
                        Manage strands, sections, and quizzes for this roadmap
                      </CardDescription>
                    </div>
                    <Button onClick={addStrand} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Strand
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Topic</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Grade Name</TableHead>
                          <TableHead>Sections</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.strands?.map((strand, strandIndex) => {
                          const isStrandExpanded = expandedStrands[strandIndex];
                          return (
                            <React.Fragment key={strandIndex}>
                              <TableRow>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleStrand(strandIndex)}
                                  >
                                    {isStrandExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <TopicsCombobox
                                    strandIndex={strandIndex}
                                    currentTopicId={typeof strand.topic === "string" 
                                      ? strand.topic 
                                      : (strand.topic as any)?.id || ""}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={strand.grade}
                                    onChange={(e) =>
                                      updateStrand(
                                        strandIndex,
                                        "grade",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={strand.gradeName}
                                    onChange={(e) =>
                                      updateStrand(strandIndex, "gradeName", e.target.value)
                                    }
                                    placeholder="e.g., Form 1"
                                    className="w-32"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      {strand.sections?.length || 0} section(s)
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addSection(strandIndex)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteStrand(strandIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {isStrandExpanded && (
                                <TableRow>
                                  <TableCell colSpan={6} className="p-0">
                                    <div className="bg-muted/50 p-4">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Quizzes</TableHead>
                                            <TableHead className="w-20">Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {strand.sections?.map((section, sectionIndex) => {
                                            const sectionKey = `${strandIndex}-${sectionIndex}`;
                                            const isSectionExpanded = expandedSections[sectionKey];
                                            return (
                                              <React.Fragment key={sectionIndex}>
                                                <TableRow>
                                                  <TableCell>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => toggleSection(strandIndex, sectionIndex)}
                                                    >
                                                      {isSectionExpanded ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                      ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                      )}
                                                    </Button>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Input
                                                      value={section.title}
                                                      onChange={(e) =>
                                                        updateSection(
                                                          strandIndex,
                                                          sectionIndex,
                                                          "title",
                                                          e.target.value
                                                        )
                                                      }
                                                      placeholder="Section title"
                                                      className="w-full"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Textarea
                                                      value={section.description}
                                                      onChange={(e) =>
                                                        updateSection(
                                                          strandIndex,
                                                          sectionIndex,
                                                          "description",
                                                          e.target.value
                                                        )
                                                      }
                                                      placeholder="Description"
                                                      rows={2}
                                                      className="w-full"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-sm text-muted-foreground">
                                                        {section.quizzes?.length || 0} quiz(zes)
                                                      </span>
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => addQuiz(strandIndex, sectionIndex)}
                                                      >
                                                        <Plus className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleDeleteSection(strandIndex, sectionIndex)}
                                                    >
                                                      <X className="h-4 w-4" />
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                                {isSectionExpanded && section.quizzes && section.quizzes.length > 0 && (
                                                  <TableRow>
                                                    <TableCell colSpan={5} className="p-0">
                                                      <div className="bg-background p-4 border-t">
                                                        <Table>
                                                          <TableHeader>
                                                            <TableRow>
                                                              <TableHead>Difficulty Level</TableHead>
                                                              <TableHead>Difficulty Range</TableHead>
                                                              <TableHead>Questions</TableHead>
                                                              <TableHead>Stage</TableHead>
                                                              <TableHead>Subtopics</TableHead>
                                                              <TableHead className="w-20">Actions</TableHead>
                                                            </TableRow>
                                                          </TableHeader>
                                                          <TableBody>
                                                            {section.quizzes.map((quiz, quizIndex) => (
                                                              <TableRow key={quizIndex}>
                                                                <TableCell>
                                                                  <Input
                                                                    type="number"
                                                                    step="0.1"
                                                                    min="0"
                                                                    max="1"
                                                                    value={quiz.difficultyLevel}
                                                                    onChange={(e) =>
                                                                      updateQuiz(
                                                                        strandIndex,
                                                                        sectionIndex,
                                                                        quizIndex,
                                                                        "difficultyLevel",
                                                                        parseFloat(e.target.value) || 0
                                                                      )
                                                                    }
                                                                    className="w-24"
                                                                  />
                                                                </TableCell>
                                                                <TableCell>
                                                                  <Input
                                                                    type="number"
                                                                    step="0.1"
                                                                    min="0"
                                                                    max="1"
                                                                    value={quiz.difficultyRange}
                                                                    onChange={(e) =>
                                                                      updateQuiz(
                                                                        strandIndex,
                                                                        sectionIndex,
                                                                        quizIndex,
                                                                        "difficultyRange",
                                                                        parseFloat(e.target.value) || 0
                                                                      )
                                                                    }
                                                                    className="w-24"
                                                                  />
                                                                </TableCell>
                                                                <TableCell>
                                                                  <Input
                                                                    type="number"
                                                                    value={quiz.numberOfQuestions}
                                                                    onChange={(e) =>
                                                                      updateQuiz(
                                                                        strandIndex,
                                                                        sectionIndex,
                                                                        quizIndex,
                                                                        "numberOfQuestions",
                                                                        parseInt(e.target.value) || 0
                                                                      )
                                                                    }
                                                                    className="w-20"
                                                                  />
                                                                </TableCell>
                                                                <TableCell>
                                                                  <Select
                                                                    value={quiz.stage}
                                                                    onValueChange={(value) =>
                                                                      updateQuiz(
                                                                        strandIndex,
                                                                        sectionIndex,
                                                                        quizIndex,
                                                                        "stage",
                                                                        value
                                                                      )
                                                                    }
                                                                  >
                                                                    <SelectTrigger className="w-[140px]">
                                                                      <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                      {STAGE_OPTIONS.map((stage) => (
                                                                        <SelectItem key={stage} value={stage}>
                                                                          {stage}
                                                                        </SelectItem>
                                                                      ))}
                                                                    </SelectContent>
                                                                  </Select>
                                                                </TableCell>
                                                                <TableCell>
                                                                  <SubtopicsCombobox
                                                                    strandIndex={strandIndex}
                                                                    sectionIndex={sectionIndex}
                                                                    quizIndex={quizIndex}
                                                                    selectedSubtopics={(quiz.subTopics || []) as string[]}
                                                                  />
                                                                </TableCell>
                                                                <TableCell>
                                                                  <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                      handleDeleteQuiz(strandIndex, sectionIndex, quizIndex)
                                                                    }
                                                                  >
                                                                    <X className="h-4 w-4" />
                                                                  </Button>
                                                                </TableCell>
                                                              </TableRow>
                                                            ))}
                                                          </TableBody>
                                                        </Table>
                                                      </div>
                                                    </TableCell>
                                                  </TableRow>
                                                )}
                                              </React.Fragment>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {(!formData.strands || formData.strands.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No strands added yet. Click "Add Strand" to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="⚠️ Serious Warning: Delete Roadmap Item"
        description={getDeleteWarningMessage()}
        cancelLabel="Cancel - Edit Instead"
        confirmLabel="Yes, Delete Anyway"
      />
    </AdminLayout>
  );
}


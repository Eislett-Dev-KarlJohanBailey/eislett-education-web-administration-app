import { useState, useEffect, useContext, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/hooks/use-toast";
import { Image, Search, Copy, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatGetReqJson } from "@/services/utils";

interface MediaItem {
  key: string;
  name: string;
  url: string;
  size: number;
  contentType: string;
  lastModified: string;
}

interface MediaResponse {
  data: MediaItem[];
  total: number;
  searchTerm?: string;
}

interface MediaPickerProps {
  onInsert: (markdown: string) => void;
  trigger?: React.ReactNode;
}

export function MediaPicker({ onInsert, trigger }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadName, setUploadName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const authContext = useContext(useAuth());
  const token = authContext?.token;

  const fetchMedia = async (prefix?: string, maxKeys?: number) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const params: { prefix?: string; maxKeys?: number } = {};
      if (prefix) params.prefix = prefix;
      if (maxKeys) params.maxKeys = maxKeys;

      const queryString = formatGetReqJson(params);
      const url = queryString ? `/api/media?${queryString}` : `/api/media`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }

      const data: MediaResponse = await response.json();
      setMediaItems(data.data || []);
    } catch (error) {
      toast({
        title: "Error fetching media",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchMedia = async (query: string, maxResults: number = 50) => {
    if (!token || !query.trim()) return;

    setIsSearching(true);
    try {
      const params = { q: query.trim(), maxResults };
      const queryString = formatGetReqJson(params);
      const url = `/api/media/search?${queryString}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to search media");
      }

      const data: MediaResponse = await response.json();
      setMediaItems(data.data || []);
    } catch (error) {
      toast({
        title: "Error searching media",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (open && token) {
      if (debouncedSearchQuery.trim()) {
        searchMedia(debouncedSearchQuery);
      } else {
        fetchMedia(undefined, 100);
      }
    }
  }, [open, debouncedSearchQuery, token]);

  const handleMediaClick = (item: MediaItem) => {
    const markdown = `![${item.name}](${item.url} "${item.name}")`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(markdown).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Markdown image syntax has been copied",
      });
    });

    // Insert into textarea
    onInsert(markdown);
    setOpen(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const validateKebabCase = (name: string): boolean => {
    const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return kebabCaseRegex.test(name.toLowerCase());
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate PNG
    if (file.type !== "image/png") {
      toast({
        title: "Invalid file type",
        description: "Only PNG files are allowed",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setUploadFileName(file.name);
    // Auto-fill name from filename (remove extension and convert to kebab-case)
    const nameWithoutExt = file.name.replace(/\.png$/i, "");
    const kebabCaseName = nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setUploadName(kebabCaseName);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast({
        title: "No file selected",
        description: "Please select a PNG file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!uploadName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the file",
        variant: "destructive",
      });
      return;
    }

    const lowerCaseName = uploadName.toLowerCase().trim();
    if (!validateKebabCase(lowerCaseName)) {
      toast({
        title: "Invalid name format",
        description:
          "Name must be in kebab-case (lowercase letters, numbers, and hyphens only). Example: character-image",
        variant: "destructive",
      });
      return;
    }

    const file = fileInputRef.current.files[0];
    if (file.type !== "image/png") {
      toast({
        title: "Invalid file type",
        description: "Only PNG files are allowed",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", lowerCaseName);

      const serverBaseUrl = process.env.NEXT_PUBLIC_SERVER_BASE_URL;
      if (!serverBaseUrl) {
        throw new Error("Server base URL is not configured");
      }

      const response = await fetch(`${serverBaseUrl}upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload file");
      }

      const uploadResponse = await response.json();
      
      // Get the uploaded file URL and name from response
      // Response structure may vary, but typically contains url and name
      const uploadedUrl = uploadResponse.url || uploadResponse.data?.url;
      const uploadedName = uploadResponse.name || uploadResponse.data?.name || lowerCaseName;

      if (uploadedUrl) {
        // Generate markdown syntax
        const markdown = `![${uploadedName}](${uploadedUrl} "${uploadedName}")`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(markdown).then(() => {
          toast({
            title: "Upload successful",
            description: "File uploaded and markdown copied to clipboard",
          });
        });

        // Insert into content area
        onInsert(markdown);
      } else {
        toast({
          title: "Upload successful",
          description: "File uploaded successfully",
        });
      }

      // Reset form
      setUploadFileName("");
      setUploadName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Close both dialogs
      setUploadDialogOpen(false);
      setOpen(false);

      // Refresh media list
      if (debouncedSearchQuery.trim()) {
        searchMedia(debouncedSearchQuery);
      } else {
        fetchMedia(undefined, 100);
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Image className="h-4 w-4" />
          Add Media
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Media</DialogTitle>
            <DialogDescription>
              Click on an image to copy its markdown syntax and insert it into
              your content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUploadDialogOpen(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading || isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No media found
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaItems.map((item) => (
                    <div
                      key={item.key}
                      className="group relative border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleMediaClick(item)}
                    >
                      <div className="aspect-square bg-muted relative">
                        {item.contentType.startsWith("image/") ? (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                      <div className="p-2 space-y-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.size)}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-background/80 backdrop-blur-sm rounded p-1">
                          <Copy className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Upload a PNG image. Use kebab-case for the name (e.g.,
              character-image).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">PNG File</Label>
              <Input
                id="file"
                type="file"
                accept="image/png"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              {uploadFileName && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadFileName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Name (kebab-case) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="character-image"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value.toLowerCase())}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens only. Example:
                character-image
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadFileName("");
                setUploadName("");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !uploadFileName || !uploadName.trim()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


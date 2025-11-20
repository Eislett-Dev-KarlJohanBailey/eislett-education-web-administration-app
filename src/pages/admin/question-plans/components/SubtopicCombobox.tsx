import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubTopicDetails } from "@/models/subTopic/subTopicDetails";

export function SubtopicCombobox({
  selectedSubtopicId,
  onSelect,
  subtopics,
}: {
  selectedSubtopicId: string;
  onSelect: (subtopicId: string) => void;
  subtopics: SubTopicDetails[];
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter subtopics case-insensitively
  const filteredSubtopics = subtopics.filter((subtopic) =>
    subtopic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSubtopicName = subtopics.find((s) => s.id === selectedSubtopicId)?.name;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <span className="truncate">
              {selectedSubtopicName || "Select a subtopic..."}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[300px] p-0 z-[100]" 
          align="start"
          onOpenAutoFocus={(e) => {
            // Focus the input when popover opens
            const input = (e.currentTarget as HTMLElement).querySelector('input');
            if (input) {
              setTimeout(() => (input as HTMLInputElement).focus(), 0);
            }
          }}
        >
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search subtopics..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              autoFocus
            />
            <CommandList>
              <CommandEmpty>No subtopics found.</CommandEmpty>
              <CommandGroup>
                {filteredSubtopics.map((subtopic) => {
                  const isSelected = selectedSubtopicId === subtopic.id;
                  return (
                    <CommandItem
                      key={subtopic.id}
                      value={subtopic.id}
                      onSelect={() => {
                        onSelect(subtopic.id || "");
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
                      {subtopic.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { OFFICIAL_CHURCH_UNITS } from "@/constants/churchUnits";

interface MultipleChurchUnitsSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function MultipleChurchUnitsSelect({
  value = [],
  onChange,
  disabled = false,
}: MultipleChurchUnitsSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(value);

  // Update internal state when external value changes
  useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  // Use official church units from constants
  const churchUnits = OFFICIAL_CHURCH_UNITS;

  const toggleValue = (unitId: string) => {
    const newValues = selectedValues.includes(unitId)
      ? selectedValues.filter((id) => id !== unitId)
      : [...selectedValues, unitId];

    setSelectedValues(newValues);
    onChange(newValues);
  };

  const removeValue = (unitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValues = selectedValues.filter((id) => id !== unitId);
    setSelectedValues(newValues);
    onChange(newValues);
  };

  const getUnitNameById = (id: string) => {
    const unit = churchUnits.find((unit) => unit.id === id);
    return unit ? unit.name : id;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedValues.length && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {selectedValues.length > 0 ? (
            <div className="flex flex-wrap gap-1 max-w-[90%] overflow-hidden">
              {selectedValues.map((value) => (
                <Badge
                  key={value}
                  variant="secondary"
                  className="mr-1 mb-1"
                >
                  {getUnitNameById(value)}
                  <button
                    className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                    onClick={(e) => removeValue(value, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            "Select church units"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search church units..." />
          <CommandEmpty>No church unit found.</CommandEmpty>
          <CommandGroup>
            {churchUnits.map((unit) => (
              <CommandItem
                key={unit.id}
                value={unit.id}
                onSelect={() => toggleValue(unit.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedValues.includes(unit.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                {unit.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

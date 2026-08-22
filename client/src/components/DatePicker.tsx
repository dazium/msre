import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateFromInput, dateToInput, formatDateForPicker } from "@/lib/datePicker";

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
}: DatePickerProps) {
  const selectedDate = dateFromInput(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-10 w-full justify-between bg-background px-3 text-left font-normal"
          aria-label={placeholder}
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value ? formatDateForPicker(value) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[80] w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) onChange(dateToInput(date));
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

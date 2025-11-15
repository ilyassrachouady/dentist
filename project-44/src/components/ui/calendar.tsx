"use client";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    props.defaultMonth || new Date()
  );

  React.useEffect(() => {
    if (props.month) {
      setCurrentMonth(props.month);
    }
  }, [props.month]);

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    props.onMonthChange?.(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    props.onMonthChange?.(newMonth);
  };

  const defaultClassNames = {
    months: "flex flex-col space-y-4",
    month: "w-full",
    month_caption: "hidden", // Hide default caption
    caption_label: "hidden", // Hide default label
    nav: "hidden", // Hide default nav
    button_previous: "hidden",
    button_next: "hidden",
    weekday: "w-full h-12 flex items-center justify-center text-xs font-medium text-muted-foreground",
    day_button: cn(
      "w-full h-12 flex items-center justify-center rounded-md text-sm font-medium transition-colors",
      "hover:bg-muted cursor-pointer",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[selected]:bg-blue-600 data-[selected]:text-white"
    ),
    day: "p-0",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today: "font-semibold",
    outside: "text-muted-foreground opacity-50",
    hidden: "invisible",
    week_number: "hidden",
  };

  const mergedClassNames: typeof defaultClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key as keyof typeof classNames]
        ? cn(
            defaultClassNames[key as keyof typeof defaultClassNames],
            classNames[key as keyof typeof classNames],
          )
        : defaultClassNames[key as keyof typeof defaultClassNames],
    }),
    {} as typeof defaultClassNames,
  );

  const defaultComponents = {
    Chevron: () => null, // We'll use our own navigation
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  return (
    <div className={cn("w-full p-6 rounded-xl bg-white shadow-sm", className)}>
      {/* Custom Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          className="p-2 hover:bg-muted rounded-md transition-colors"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h3 className="text-xl font-semibold text-center tracking-tight text-gray-900">
          {format(currentMonth, "MMMM yyyy", { locale: props.locale || fr })}
        </h3>
        <button
          type="button"
          className="p-2 hover:bg-muted rounded-md transition-colors"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground h-8 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <DayPicker
        showOutsideDays={showOutsideDays}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        className="w-full"
        classNames={{
          ...mergedClassNames,
          months: "w-full",
          month: "w-full",
        }}
        components={mergedComponents}
        {...props}
      />
      <style>{`
        .rdp-month {
          width: 100%;
        }
        .rdp-table {
          width: 100%;
        }
        .rdp-head_row {
          display: none;
        }
        .rdp-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .rdp-cell {
          position: relative;
          text-align: center;
        }
        .rdp-day_button[data-selected="true"] {
          background-color: #2563eb !important;
          color: white !important;
        }
        .rdp-day_button:hover:not([data-disabled="true"]):not([data-selected="true"]) {
          background-color: #eff6ff;
        }
        .rdp-day_button[data-disabled="true"] {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };

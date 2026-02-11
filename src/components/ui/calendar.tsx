"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white", className)}
classNames={{
  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
  month: "space-y-4 w-full",
  caption: "flex justify-center pt-1 relative items-center px-10 mb-4",
  caption_label: "text-sm font-semibold text-slate-900",
  nav: "space-x-1 flex items-center",
  nav_button: cn(
    buttonVariants({ variant: "outline" }),
    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-none shadow-none"
  ),
  nav_button_previous: "absolute left-1",
  nav_button_next: "absolute right-1",
  
  month_grid: "w-full border-collapse", 
  weekdays: "grid grid-cols-7 w-full mb-4 border-b border-slate-100 pb-2", 
  weekday: "text-slate-400 font-bold text-[10px] uppercase text-center w-full tracking-tighter",
  
  weeks: "w-full space-y-1", 
  week: "grid grid-cols-7 w-full", 
  
  cell: "h-9 w-full flex items-center justify-center p-0 relative focus-within:relative focus-within:z-20",
  day: cn(
    buttonVariants({ variant: "ghost" }),
    "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-cyan-500 hover:text-white rounded-lg transition-all"
  ),

  day_selected: "bg-cyan-500 text-white hover:bg-cyan-600 focus:bg-cyan-500 shadow-md",
  day_today: "bg-slate-100 text-slate-900 font-bold border border-slate-200",
  day_outside: "text-slate-300 opacity-50",
  day_disabled: "text-slate-300 opacity-50",
  day_hidden: "invisible",
  ...classNames,
}}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-5 w-5 text-cyan-500" />;
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
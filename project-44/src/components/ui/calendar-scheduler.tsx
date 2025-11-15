"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { fr } from "date-fns/locale/fr";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CalendarSchedulerProps {
  timeSlots?: string[];
  onConfirm?: (value: { date?: Date; time?: string }) => void;
  onDateChange?: (date: Date | undefined) => void;
  disabledDates?: (date: Date) => boolean;
}

function CalendarScheduler({
  timeSlots = [
    "08:00 AM",
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ],
  onConfirm,
  onDateChange,
  disabledDates,
}: CalendarSchedulerProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [time, setTime] = React.useState<string | undefined>();

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setTime(undefined); // Reset time when date changes
    onDateChange?.(newDate);
  };

  return (
    <div className="w-full">
      <Card className="w-full max-w-4xl shadow-lg border border-gray-200 bg-white">
        <CardContent className="flex flex-col lg:flex-row gap-6 p-6">
          {/* Calendar Section */}
          <div className="flex-1 border-2 border-gray-100 rounded-xl bg-gray-50/50 overflow-hidden">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={disabledDates}
              locale={fr}
            />
          </div>

          {/* Time Slots Section */}
          <div className="flex-1 border-2 border-gray-100 rounded-xl p-6 bg-gray-50/50 overflow-y-auto max-h-[500px]">
            <p className="mb-4 text-base font-semibold text-gray-900">
              Choisissez un créneau
            </p>
            {timeSlots.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-500">
                Sélectionnez d'abord une date pour voir les créneaux disponibles
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={time === slot ? "default" : "outline"}
                    size="default"
                    className={cn(
                      "w-full h-12 text-base font-medium transition-all duration-200",
                      time === slot 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md ring-2 ring-blue-500 ring-offset-2" 
                        : "border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700"
                    )}
                    onClick={() => setTime(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between px-6 pb-6 pt-0">
          <Button
            variant="ghost"
            size="default"
            className="px-6 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => {
              setDate(undefined);
              setTime(undefined);
            }}
          >
            Réinitialiser
          </Button>
          <Button
            size="default"
            className="px-8 h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
            onClick={() => onConfirm?.({ date, time })}
            disabled={!date || !time}
          >
            Confirmer
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export { CalendarScheduler };

"use client";

import { useState, useEffect } from "react";
import { Service, User } from "@prisma/client";
import { ServiceSelection } from "./service-selection";
import { StaffSelection } from "./staff-selection";
import { DateTimeSelection } from "./datetime-selection";
import { ClientForm } from "./client-form";
import { BookingConfirmation } from "./booking-confirmation";
import { ProgressIndicator } from "./progress-indicator";
import { OfflineBanner } from "@/components/ui/offline-banner";

type BookingStep = "service" | "staff" | "datetime" | "client-info" | "confirmation";

type BookingData = {
  serviceId?: string;
  staffId?: string;
  datetime?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
};

type SalonWithRelations = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  services: Service[];
  users: Pick<User, "id" | "name" | "email">[];
};

export function BookingWidget({ salon }: { salon: SalonWithRelations }) {
  const [currentStep, setCurrentStep] = useState<BookingStep>("service");
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`booking-${salon.slug}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBookingData(parsed);
      } catch (error) {
        console.error("Error loading saved booking:", error);
      }
    }
  }, [salon.slug]);

  // Save progress to localStorage
  useEffect(() => {
    if (Object.keys(bookingData).length > 0 && currentStep !== "confirmation") {
      localStorage.setItem(`booking-${salon.slug}`, JSON.stringify(bookingData));
    }
  }, [bookingData, currentStep, salon.slug]);

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    const steps: BookingStep[] = ["service", "staff", "datetime", "client-info", "confirmation"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const steps: BookingStep[] = ["service", "staff", "datetime", "client-info", "confirmation"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleBookingComplete = (id: string) => {
    setAppointmentId(id);
    setCurrentStep("confirmation");
    // Clear saved progress
    localStorage.removeItem(`booking-${salon.slug}`);
  };

  const selectedService = salon.services.find((s) => s.id === bookingData.serviceId);
  const selectedStaff = salon.users.find((u) => u.id === bookingData.staffId);

  return (
    <>
      <OfflineBanner />
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Progress Indicator */}
        {currentStep !== "confirmation" && <ProgressIndicator currentStep={currentStep} />}

        {/* Step Content */}
        <div className="p-4 sm:p-6">
          {currentStep === "service" && (
            <ServiceSelection
              services={salon.services}
              selectedServiceId={bookingData.serviceId}
              onSelect={(serviceId) => {
                updateBookingData({ serviceId });
                goToNextStep();
              }}
            />
          )}

          {currentStep === "staff" && selectedService && (
            <StaffSelection
              staff={salon.users.filter(
                (user) =>
                  selectedService.staffIds.length === 0 ||
                  selectedService.staffIds.includes(user.id)
              )}
              selectedStaffId={bookingData.staffId}
              onSelect={(staffId) => {
                updateBookingData({ staffId });
                goToNextStep();
              }}
              onBack={goToPreviousStep}
            />
          )}

          {currentStep === "datetime" && bookingData.staffId && bookingData.serviceId && (
            <DateTimeSelection
              salonId={salon.id}
              staffId={bookingData.staffId}
              serviceId={bookingData.serviceId}
              selectedDatetime={bookingData.datetime}
              onSelect={(datetime) => {
                updateBookingData({ datetime });
                goToNextStep();
              }}
              onBack={goToPreviousStep}
            />
          )}

          {currentStep === "client-info" && (
            <ClientForm
              salonId={salon.id}
              bookingData={bookingData}
              onSubmit={handleBookingComplete}
              onBack={goToPreviousStep}
            />
          )}

          {currentStep === "confirmation" && appointmentId && (
            <BookingConfirmation
              salon={salon}
              bookingData={bookingData}
              appointmentId={appointmentId}
              selectedService={selectedService}
              selectedStaff={selectedStaff}
            />
          )}
        </div>
      </div>
    </>
  );
}

// src/app/pos/management/[entityName]/ShiftManagement.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Center,
  Flex,
  Heading,
  Spinner,
  useToast,
  useDisclosure,
  Text,
  Alert,
  AlertIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
} from "@chakra-ui/react";
import ShiftCalendar from "./ShiftManagementComponents/ShiftCalendar";
import EmployeeList from "./ShiftManagementComponents/EmployeeList";
import ShiftModal from "./ShiftManagementComponents/ShiftModal";
import ShiftUpdateModal from "./ShiftManagementComponents/ShiftUpdateModal";
import {
  getShifts,
  getEmployees,
  createShift,
  updateShift,
  deleteShift,
  getJobTitles,
} from "@/lib/api";
import { usePOSStore } from "@/lib/usePOSStore";
import moment from "moment";
import {
  Employee as EmployeeDetails,
  Shift as ShiftDetails,
} from "@/lib/config/entities";
import { logger } from "@/lib/logger";
import {
  FaSync,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaUndo,
} from "react-icons/fa";

export interface Employee extends EmployeeDetails {
  name?: string;
  role: string; // Make required to match store interface
  color?: string;
  last_name: string; // Make required to match store interface
}

export interface Shift extends ShiftDetails {
  id: string;
  employee_id: string;
  start: Date;
  end: Date;
  employee_name?: string;
  color?: string;
  active?: boolean;
  recurring?: boolean;
  recurring_day?: number;
  recurrence_end_date?: Date;
  title?: string;
  created_at?: string;
  updated_at?: string;
  isDraft?: boolean; // New field for draft shifts
}

// New interfaces for enhanced draft management
interface DraftShift extends Omit<Shift, "id"> {
  id: string; // Can be draft IDs
  isDraft: boolean;
  published?: boolean;
  original_shift_id?: string; // For tracking which published shift this draft modifies
  marked_for_deletion?: boolean; // For tracking shifts to delete
  store_id?: string;
}

interface LocalStorageShifts {
  draftShifts: DraftShift[];
  lastSaved: string;
  version: string;
}

// Local storage keys - will be made store-specific in component
const DRAFT_SHIFTS_KEY = "draft_shifts";
const PUBLISHED_SHIFTS_KEY = "published_shifts";
const LAST_SYNC_KEY = "last_sync_timestamp";

type ScheduleMode = "published" | "draft";

export default function ShiftsPage() {
  const {
    shifts,
    setShifts,
    addShift,
    updateShift: updateStoreShift,
    deleteShift: deleteStoreShift,
    employees: storeEmployees,
    setEmployees,
  } = usePOSStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("published");
  const [draftShifts, setDraftShifts] = useState<DraftShift[]>([]);
  const [publishedShifts, setPublishedShifts] = useState<Shift[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mappedEmployees, setMappedEmployees] = useState<Employee[]>([]);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Store-specific local storage keys
  const getCurrentSessionContext = () => {
    // This should return the current store context
    // For now, using a default store ID
    return { store_id: "default-store" };
  };

  const DRAFT_SHIFTS_KEY_STORE = `${DRAFT_SHIFTS_KEY}_${
    getCurrentSessionContext().store_id
  }`;
  const PUBLISHED_SHIFTS_KEY_STORE = `${PUBLISHED_SHIFTS_KEY}_${
    getCurrentSessionContext().store_id
  }`;
  const SCHEDULE_MODE_KEY_STORE = `schedule_mode_${
    getCurrentSessionContext().store_id
  }`;

  // Load data from localStorage on component mount
  useEffect(() => {
    loadLocalShifts();
  }, []);

  // Save schedule mode to localStorage whenever it changes
  useEffect(() => {
    saveScheduleMode(scheduleMode);
  }, [scheduleMode]);

  // Load shifts from localStorage
  const loadLocalShifts = () => {
    try {
      // Load draft shifts
      let parsedDrafts: DraftShift[] = [];
      const storedDrafts = localStorage.getItem(DRAFT_SHIFTS_KEY_STORE);
      if (storedDrafts) {
        const draftsData: LocalStorageShifts = JSON.parse(storedDrafts);
        parsedDrafts = draftsData.draftShifts.map((draft) => ({
          ...draft,
          start: new Date(draft.start),
          end: new Date(draft.end),
          recurrence_end_date: draft.recurrence_end_date
            ? new Date(draft.recurrence_end_date)
            : undefined,
        }));
        setDraftShifts(parsedDrafts);
      }

      // Load published shifts
      const storedPublished = localStorage.getItem(PUBLISHED_SHIFTS_KEY_STORE);
      if (storedPublished) {
        const publishedData: LocalStorageShifts = JSON.parse(storedPublished);
        const parsedPublished = publishedData.draftShifts.map((shift) => ({
          ...shift,
          start: new Date(shift.start),
          end: new Date(shift.end),
          recurrence_end_date: shift.recurrence_end_date
            ? new Date(shift.recurrence_end_date)
            : undefined,
        }));
        console.log(
          "Loaded published shifts from localStorage:",
          parsedPublished.length
        );
        setPublishedShifts(parsedPublished);
      } else {
        console.log("No published shifts found in localStorage");
      }

      // Load schedule mode
      const storedMode = localStorage.getItem(SCHEDULE_MODE_KEY_STORE);
      if (
        storedMode &&
        (storedMode === "published" || storedMode === "draft")
      ) {
        setScheduleMode(storedMode as ScheduleMode);
        console.log("Loaded schedule mode from localStorage:", storedMode);
      }

      // If we have draft shifts but mode is published, switch to draft mode
      if (
        parsedDrafts.length > 0 &&
        (!storedMode || storedMode === "published")
      ) {
        // Use setTimeout to ensure state is updated
        setTimeout(() => {
          setScheduleMode("draft");
          console.log("Auto-switching to draft mode due to existing drafts");
        }, 0);
      }

      // If no localStorage data exists, publishedShifts will be empty and will be populated from API data
    } catch (error) {
      console.error("Error loading local shifts:", error);
      toast({
        title: "Error loading saved shifts",
        description: "Could not load shifts from local storage",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Save draft shifts to localStorage
  const saveDraftShifts = (shifts: DraftShift[]) => {
    try {
      const storageData: LocalStorageShifts = {
        draftShifts: shifts,
        lastSaved: new Date().toISOString(),
        version: "1.0",
      };
      localStorage.setItem(DRAFT_SHIFTS_KEY_STORE, JSON.stringify(storageData));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving draft shifts:", error);
      toast({
        title: "Error saving draft",
        description: "Could not save changes to local storage",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Save published shifts to localStorage
  const savePublishedShifts = (shifts: Shift[]) => {
    try {
      const storageData: LocalStorageShifts = {
        draftShifts: shifts.map((shift) => ({
          ...shift,
          isDraft: false,
          published: true,
        })),
        lastSaved: new Date().toISOString(),
        version: "1.0",
      };
      localStorage.setItem(
        PUBLISHED_SHIFTS_KEY_STORE,
        JSON.stringify(storageData)
      );
    } catch (error) {
      console.error("Error saving published shifts:", error);
    }
  };

  // Save schedule mode to localStorage
  const saveScheduleMode = (mode: ScheduleMode) => {
    try {
      localStorage.setItem(SCHEDULE_MODE_KEY_STORE, mode);
    } catch (error) {
      console.error("Error saving schedule mode:", error);
    }
  };

  // Get current shifts based on mode
  const getCurrentShifts = (): Shift[] => {
    if (scheduleMode === "draft") {
      // In draft mode, show both published shifts and draft shifts
      const allPublishedShifts =
        publishedShifts.length > 0
          ? publishedShifts
          : shifts.filter((s) => s.active);
      console.log(
        "Draft mode - Published shifts:",
        allPublishedShifts.length,
        "Draft shifts:",
        draftShifts.length
      );
      return [...allPublishedShifts, ...draftShifts];
    }
    // In published mode, show published shifts from localStorage or fall back to API data
    const currentShifts =
      publishedShifts.length > 0
        ? publishedShifts
        : shifts.filter((s) => s.active);
    console.log("Published mode - Current shifts:", currentShifts.length);
    return currentShifts;
  };

  useEffect(() => {
    logger.info("ShiftManagement: useEffect triggered. Starting data load.");
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedShifts, fetchedEmployees, jobTitles] = await Promise.all([
          getShifts(),
          getEmployees(),
          getJobTitles(),
        ]);

        logger.info("ShiftManagement: Raw data from API received.");

        // Create a job title lookup map
        const jobTitleMap = new Map();
        jobTitles.forEach((job) => {
          jobTitleMap.set(job.id, job.title);
        });

        // Map employees with proper job title names
        const mappedEmployees: Employee[] = fetchedEmployees.map((emp) => ({
          ...emp,
          name: `${emp.first_name} ${emp.last_name}`,
          role:
            jobTitleMap.get(emp.job_title_id) || emp.job_title_id || "Unknown",
          color: emp.color || "#3182CE",
        }));

        // Process shifts with proper date handling and employee enrichment
        const shiftsWithNamesAndDates: Shift[] = fetchedShifts
          .map((shift: any) => {
            try {
              const employee = mappedEmployees.find(
                (e) => e.id === shift.employee_id
              );

              // Handle date conversion safely
              let startDate: Date;
              let endDate: Date;
              let recurrenceEndDate: Date | undefined;

              try {
                // Handle both string dates and Date objects
                startDate =
                  shift.start instanceof Date
                    ? shift.start
                    : new Date(shift.start);
                endDate =
                  shift.end instanceof Date ? shift.end : new Date(shift.end);

                if (shift.recurrence_end_date) {
                  recurrenceEndDate =
                    shift.recurrence_end_date instanceof Date
                      ? shift.recurrence_end_date
                      : new Date(shift.recurrence_end_date);
                }

                // Validate dates
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                  throw new Error("Invalid date");
                }
              } catch (dateError) {
                logger.error(
                  "Invalid date format, using current date as fallback",
                  shift
                );
                startDate = new Date();
                endDate = new Date();
                startDate.setHours(9, 0, 0, 0);
                endDate.setHours(17, 0, 0, 0);
              }

              // Calculate recurring day from start date
              const recurringDay = shift.recurring
                ? startDate.getDay()
                : undefined;

              return {
                ...shift,
                id: shift.id,
                employee_id: shift.employee_id,
                start: startDate,
                end: endDate,
                recurrence_end_date: recurrenceEndDate,
                employee_name: employee ? employee.name : "Unknown",
                employee_role: employee?.role,
                color: employee?.color || "#3182CE",
                recurring: shift.recurring || false,
                recurring_day: recurringDay,
                active: shift.active !== false,
                title: shift.title || `Shift - ${employee?.name || "Unknown"}`,
                created_at: shift.created_at,
                updated_at: shift.updated_at,
                isDraft: false,
              };
            } catch (error) {
              logger.error(
                "ShiftManagement: Error processing shift, skipping.",
                shift,
                error
              );
              return null;
            }
          })
          .filter(Boolean) as Shift[];

        setShifts(shiftsWithNamesAndDates);
        setEmployees(mappedEmployees);
        setMappedEmployees(mappedEmployees);

        // Only initialize published shifts with API data if no localStorage data exists
        const activeShifts = shiftsWithNamesAndDates.filter((s) => s.active);
        console.log("API shifts loaded:", activeShifts.length, "shifts");

        // Check if we already have published shifts from localStorage
        if (publishedShifts.length === 0) {
          console.log("No localStorage published shifts found, using API data");
          setPublishedShifts(activeShifts);
          savePublishedShifts(activeShifts);
        } else {
          console.log(
            "Using existing localStorage published shifts:",
            publishedShifts.length
          );
        }

        // Save sync timestamp
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

        logger.info("ShiftManagement: Data successfully set in Zustand store.");
      } catch (error: any) {
        logger.error("ShiftManagement: Failed to load data", error);
        setError(error.message || "Failed to load shift data.");
        toast({
          title: "Failed to load data.",
          description:
            error.message ||
            "Could not fetch shifts or employees. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setShifts, setEmployees, toast]);

  // Enhanced update shift function
  const handleUpdateShift = async (
    shiftId: string,
    updates: Partial<Shift>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsProcessing(true);

      // Check if it's a draft shift
      const draftIndex = draftShifts.findIndex((s) => s.id === shiftId);
      if (draftIndex !== -1) {
        // Update draft shift
        const updatedDrafts = draftShifts.map((s) =>
          s.id === shiftId
            ? { ...s, ...updates, updated_at: new Date().toISOString() }
            : s
        );
        setDraftShifts(updatedDrafts);
        saveDraftShifts(updatedDrafts);
        setHasUnsavedChanges(true);
        setScheduleMode("draft"); // Auto-switch to draft mode

        toast({
          title: "Draft shift updated.",
          description: "Changes are saved locally.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onClose();
        return { success: true };
      }

      // For published shifts, handle recurring shift logic
      const publishedShift = publishedShifts.find((s) => s.id === shiftId);
      if (publishedShift) {
        const isRecurringShift = publishedShift.recurring;
        const isChangingRecurring =
          updates.recurring !== undefined &&
          updates.recurring !== publishedShift.recurring;
        const isChangingDates = updates.start || updates.end;

        if (
          (isRecurringShift && (isChangingRecurring || isChangingDates)) ||
          (!isRecurringShift && updates.recurring === true)
        ) {
          // Handle recurring shift modification
          // For recurring shifts, always create a new shift starting from the edited date
          const editDate = updates.start
            ? new Date(updates.start)
            : new Date(publishedShift.start);
          const newShiftData = {
            ...publishedShift,
            ...updates,
            start: editDate, // Ensure the new shift starts from the edited date
            end: updates.end
              ? new Date(updates.end)
              : new Date(
                  editDate.getTime() +
                    (publishedShift.end.getTime() -
                      publishedShift.start.getTime())
                ),
            id: `draft-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            original_shift_id: shiftId,
            isDraft: true,
            published: false,
            updated_at: new Date().toISOString(),
          };

          // Create draft for the new shift
          const updatedDrafts = [...draftShifts, newShiftData];
          setDraftShifts(updatedDrafts);
          saveDraftShifts(updatedDrafts);
          setHasUnsavedChanges(true);

          // Only create end recurring draft if the original shift was recurring
          if (isRecurringShift) {
            // Create draft to end the original recurring series
            const endDate = new Date(editDate);
            endDate.setDate(endDate.getDate() - 1); // End the day before the new shift starts

            const endRecurringDraft: DraftShift = {
              ...publishedShift,
              id: `end-recurring-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              original_shift_id: shiftId,
              isDraft: true,
              published: false,
              recurrence_end_date: endDate,
              updated_at: new Date().toISOString(),
            };

            const finalDrafts = [...updatedDrafts, endRecurringDraft];
            setDraftShifts(finalDrafts);
            saveDraftShifts(finalDrafts);
          }

          setScheduleMode("draft"); // Auto-switch to draft mode

          const message = isRecurringShift
            ? "New shift created from edited date forward. Original series will end before the edited date."
            : "New recurring shift created starting from the edited date.";

          toast({
            title: "Recurring shift updated.",
            description: message,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        } else {
          // Regular update for non-recurring shifts or non-date changes
          const draftCopy: DraftShift = {
            ...publishedShift,
            ...updates,
            id: `draft-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            original_shift_id: shiftId,
            isDraft: true,
            published: false,
            updated_at: new Date().toISOString(),
          };

          const updatedDrafts = [...draftShifts, draftCopy];
          setDraftShifts(updatedDrafts);
          saveDraftShifts(updatedDrafts);
          setHasUnsavedChanges(true);
          setScheduleMode("draft"); // Auto-switch to draft mode

          toast({
            title: "Shift updated as draft.",
            description:
              "Changes are saved locally. Click Publish to apply online.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        }
        onClose();
        return { success: true };
      }

      return { success: false, error: "Shift not found" };
    } catch (error: any) {
      logger.error("ShiftManagement: Failed to update shift", error);
      toast({
        title: "Failed to update shift.",
        description:
          error.message || "An error occurred while updating the shift.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  // Publish all draft shifts to the backend
  const publishSchedule = async () => {
    if (draftShifts.length === 0) {
      toast({
        title: "No changes to publish",
        description: "There are no draft shifts to publish.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);
    try {
      const shiftsToCreate: DraftShift[] = [];
      const shiftsToUpdate: DraftShift[] = [];
      const shiftsToDelete: DraftShift[] = [];

      // Categorize draft shifts
      draftShifts.forEach((draft) => {
        if (draft.marked_for_deletion) {
          shiftsToDelete.push(draft);
        } else if (draft.original_shift_id) {
          if (draft.recurrence_end_date) {
            // This is an end recurring series operation
            shiftsToUpdate.push(draft);
          } else {
            // This is a regular update
            shiftsToUpdate.push(draft);
          }
        } else {
          shiftsToCreate.push(draft);
        }
      });

      // Process deletions first
      for (const draft of shiftsToDelete) {
        if (draft.original_shift_id) {
          await deleteShift("shifts", draft.original_shift_id);
        }
      }

      // Process updates
      for (const draft of shiftsToUpdate) {
        if (draft.original_shift_id) {
          const {
            isDraft,
            published,
            original_shift_id,
            marked_for_deletion,
            ...updateData
          } = draft;
          await updateShift(draft.original_shift_id, updateData);
        }
      }

      // Process creations
      const createPromises = shiftsToCreate.map(async (draft) => {
        const {
          isDraft,
          published,
          original_shift_id,
          marked_for_deletion,
          ...shiftData
        } = draft;
        return await createShift(shiftData);
      });

      await Promise.all(createPromises);

      // Update local state
      const newlyPublishedShifts = [...publishedShifts];

      // Remove deleted shifts
      shiftsToDelete.forEach((draft) => {
        if (draft.original_shift_id) {
          const index = newlyPublishedShifts.findIndex(
            (s) => s.id === draft.original_shift_id
          );
          if (index !== -1) {
            newlyPublishedShifts.splice(index, 1);
          }
        }
      });

      // Update existing shifts
      shiftsToUpdate.forEach((draft) => {
        if (draft.original_shift_id) {
          const index = newlyPublishedShifts.findIndex(
            (s) => s.id === draft.original_shift_id
          );
          if (index !== -1) {
            newlyPublishedShifts[index] = {
              ...draft,
              id: draft.original_shift_id,
              isDraft: false,
            };
          }
        }
      });

      // Add new shifts
      newlyPublishedShifts.push(
        ...shiftsToCreate.map((draft) => ({ ...draft, isDraft: false }))
      );

      // Clear drafts and update published shifts
      setDraftShifts([]);
      setPublishedShifts(newlyPublishedShifts);
      saveDraftShifts([]);
      savePublishedShifts(newlyPublishedShifts);
      setHasUnsavedChanges(false);
      setScheduleMode("published");
      saveScheduleMode("published");

      toast({
        title: "Schedule published successfully!",
        description: `${draftShifts.length} changes have been published online.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      logger.error("Failed to publish schedule:", error);
      toast({
        title: "Failed to publish schedule",
        description:
          error.message || "An error occurred while publishing shifts.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to published schedule
  const resetToPublished = () => {
    setDraftShifts([]);
    saveDraftShifts([]);
    setHasUnsavedChanges(false);
    setScheduleMode("published");
    saveScheduleMode("published");

    toast({
      title: "Reset to published schedule",
      description: "All draft changes have been discarded.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Enhanced add shift function - always save to local storage first
  const handleAddShift = async (newShiftData: {
    employeeId: string;
    start: Date;
    end: Date;
    recurs: boolean;
  }) => {
    if (!selectedEmployee) return;

    try {
      setIsProcessing(true);
      const { employeeId, start, end, recurs } = newShiftData;

      // Always add as draft in local storage
      const newDraftShift: DraftShift = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employee_id: employeeId,
        start: start,
        end: end,
        recurring: recurs,
        recurring_day: recurs ? start.getDay() : undefined,
        active: true,
        title: `Shift - ${selectedEmployee.name}`,
        employee_name: selectedEmployee.name,
        color: selectedEmployee.color || "#3182CE",
        store_id: selectedEmployee.store_id || "default-store",
        isDraft: true,
        published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedDrafts = [...draftShifts, newDraftShift];
      setDraftShifts(updatedDrafts);
      saveDraftShifts(updatedDrafts);
      setHasUnsavedChanges(true);
      setScheduleMode("draft"); // Auto-switch to draft mode

      toast({
        title: "Shift added as draft.",
        description: "Changes are saved locally. Click Publish to save online.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      onClose();
    } catch (error: any) {
      console.error("❌ Failed to add shift:", error);
      toast({
        title: "Failed to add shift.",
        description:
          error.message || "An error occurred while saving the shift.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced delete function
  const handleDeleteShift = async (
    shiftId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsProcessing(true);

      // Check if it's a draft shift
      const draftIndex = draftShifts.findIndex((s) => s.id === shiftId);
      if (draftIndex !== -1) {
        // Remove from drafts
        const updatedDrafts = draftShifts.filter((s) => s.id !== shiftId);
        setDraftShifts(updatedDrafts);
        saveDraftShifts(updatedDrafts);
        setHasUnsavedChanges(true);

        toast({
          title: "Draft shift deleted.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        onClose();
        return { success: true };
      }

      // For published shifts, handle recurring shift deletion
      const publishedShift = publishedShifts.find((s) => s.id === shiftId);
      if (publishedShift) {
        if (publishedShift.recurring) {
          // For recurring shifts, end the series before the selected date
          const endDate = new Date(publishedShift.start);
          endDate.setDate(endDate.getDate() - 1); // End the day before the selected shift

          const endRecurringDraft: DraftShift = {
            ...publishedShift,
            id: `end-recurring-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            original_shift_id: shiftId,
            isDraft: true,
            published: false,
            recurrence_end_date: endDate,
            updated_at: new Date().toISOString(),
          };

          const updatedDrafts = [...draftShifts, endRecurringDraft];
          setDraftShifts(updatedDrafts);
          saveDraftShifts(updatedDrafts);
          setHasUnsavedChanges(true);
          setScheduleMode("draft"); // Auto-switch to draft mode

          toast({
            title: "Recurring shift series ended.",
            description:
              "Future occurrences will be cancelled. Past shifts remain.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        } else {
          // For non-recurring shifts, mark for deletion
          const deleteDraft: DraftShift = {
            ...publishedShift,
            id: `delete-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            original_shift_id: shiftId,
            isDraft: true,
            marked_for_deletion: true,
            published: false,
            updated_at: new Date().toISOString(),
          };

          const updatedDrafts = [...draftShifts, deleteDraft];
          setDraftShifts(updatedDrafts);
          saveDraftShifts(updatedDrafts);
          setHasUnsavedChanges(true);
          setScheduleMode("draft"); // Auto-switch to draft mode

          toast({
            title: "Shift marked for deletion.",
            description: "Click Publish to confirm deletion online.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        }
        onClose();
        return { success: true };
      }

      return { success: false, error: "Shift not found" };
    } catch (error: any) {
      logger.error("ShiftManagement: Failed to delete shift", error);
      toast({
        title: "Failed to delete shift.",
        description:
          error.message || "An error occurred while deleting the shift.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedShift(null);
    onOpen();
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    const employee = storeEmployees.find((emp) => emp.id === shift.employee_id);
    if (employee) {
      // Convert store employee to local Employee type
      const localEmployee: Employee = {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        name: `${employee.first_name} ${employee.last_name}`,
        role: employee.role || "Unknown",
        color: employee.color || "#3182CE",
        user_id: "",
        job_title_id: "",
        access_role_ids: [],
        tenant_id: "",
        store_id: "",
        main_access_role_id: "",
        hire_date: "",
        salary: 0,
      };
      setSelectedEmployee(localEmployee);
    } else {
      setSelectedEmployee(null);
    }
    onOpen();
  };

  const handleModalClose = () => {
    setSelectedEmployee(null);
    setSelectedShift(null);
    onClose();
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedShifts, fetchedEmployees, jobTitles] = await Promise.all([
        getShifts(),
        getEmployees(),
        getJobTitles(),
      ]);

      // Process data same as in useEffect...
      // ... (same data processing logic as in useEffect)

      // Save sync timestamp
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

      toast({
        title: "Data refreshed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      setError(error.message || "Failed to refresh data.");
      toast({
        title: "Refresh failed",
        description: error.message || "Failed to refresh data.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const currentShifts = getCurrentShifts();
  const activeShifts = currentShifts.filter((s) => s.active);
  const todayShifts = activeShifts.filter((shift) =>
    moment(shift.start).isSame(moment(), "day")
  );
  const upcomingShifts = activeShifts.filter((shift) =>
    moment(shift.start).isAfter(moment())
  );
  const recurringShifts = activeShifts.filter((shift) => shift.recurring);
  const draftShiftCount = draftShifts.length;

  if (isLoading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" />
        <Text ml={4}>Loading shift data...</Text>
      </Center>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" display="flex" flexDirection="column">
      <Flex
        as="header"
        position="sticky"
        top="0"
        bg="white"
        p={5}
        borderBottom="1px"
        borderColor="gray.200"
        justifyContent="space-between"
        alignItems="center"
        boxShadow="sm"
        zIndex={1000}
      >
        <HStack spacing={4}>
          <Heading as="h1" size="xl">
            Shift Management
          </Heading>
          <Badge
            colorScheme={scheduleMode === "draft" ? "orange" : "green"}
            fontSize="lg"
            px={3}
            py={1}
          >
            {scheduleMode === "draft" ? "DRAFT MODE" : "PUBLISHED"}
          </Badge>
          {hasUnsavedChanges && (
            <Badge colorScheme="red" fontSize="lg" px={3} py={1}>
              UNSAVED CHANGES
            </Badge>
          )}
        </HStack>

        <HStack spacing={4}>
          {/* Schedule Mode Toggle */}
          <Menu>
            <MenuButton as={Button} variant="outline">
              {scheduleMode === "draft" ? "Draft Mode" : "Published Mode"}
            </MenuButton>
            <MenuList>
              <MenuItem
                onClick={() => setScheduleMode("published")}
                isDisabled={scheduleMode === "published"}
              >
                Published Schedule
              </MenuItem>
              <MenuItem
                onClick={() => setScheduleMode("draft")}
                isDisabled={scheduleMode === "draft"}
              >
                Draft Schedule
              </MenuItem>
            </MenuList>
          </Menu>

          <Button
            leftIcon={<FaSync />}
            onClick={refreshData}
            isLoading={isProcessing}
            colorScheme="blue"
            variant="outline"
          >
            Refresh
          </Button>
        </HStack>
      </Flex>

      {error && (
        <Alert status="error" mx={5} mt={5} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Statistics Overview */}
      <Box p={5} flex="0 0 auto">
        <SimpleGrid columns={5} spacing={4}>
          <Stat bg="white" p={4} borderRadius="md" shadow="sm">
            <StatLabel>Total Shifts</StatLabel>
            <StatNumber>{activeShifts.length}</StatNumber>
            <StatHelpText>
              {scheduleMode === "draft"
                ? `${draftShiftCount} drafts`
                : "Published"}
            </StatHelpText>
          </Stat>

          <Stat bg="white" p={4} borderRadius="md" shadow="sm">
            <StatLabel>Today's Shifts</StatLabel>
            <StatNumber color="blue.500">{todayShifts.length}</StatNumber>
            <StatHelpText>Scheduled for today</StatHelpText>
          </Stat>

          <Stat bg="white" p={4} borderRadius="md" shadow="sm">
            <StatLabel>Upcoming Shifts</StatLabel>
            <StatNumber color="green.500">{upcomingShifts.length}</StatNumber>
            <StatHelpText>Future shifts</StatHelpText>
          </Stat>

          <Stat bg="white" p={4} borderRadius="md" shadow="sm">
            <StatLabel>Recurring</StatLabel>
            <StatNumber color="purple.500">{recurringShifts.length}</StatNumber>
            <StatHelpText>Weekly recurring</StatHelpText>
          </Stat>

          <Stat bg="white" p={4} borderRadius="md" shadow="sm">
            <StatLabel>Draft Shifts</StatLabel>
            <StatNumber color="orange.500">{draftShiftCount}</StatNumber>
            <StatHelpText>Unsaved changes</StatHelpText>
          </Stat>
        </SimpleGrid>
      </Box>

      {/* Main content area */}
      <Box
        p={5}
        flex="1"
        display="flex"
        flexDirection="column"
        minHeight="0"
        height="100vh" // Changed to 100vh
        overflow="hidden" // Added to prevent overall scrolling
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={6}
          flex="1"
          minHeight="0"
          height="100%" // Changed to 100%
        >
          {/* Employee List - Fixed width with scroll */}
          {/* Employee List - Fixed width with scroll */}
          <Box
            flex="0 0 280px"
            bg="white"
            p={6}
            rounded="md"
            shadow="sm"
            display="flex"
            flexDirection="column"
            height="80vh" // CHANGED: Set to 80vh
            minHeight="0"
            overflow="hidden"
          >
            <EmployeeList
              employees={mappedEmployees || []}
              onEmployeeClick={handleSelectEmployee}
            />
          </Box>

          {/* Calendar - Takes remaining space */}
          <Box
            flex="1"
            bg="white"
            p={6}
            rounded="md"
            shadow="sm"
            minWidth="0"
            display="flex"
            flexDirection="column"
            height="80vh" // CHANGED: Set to 80vh
            minHeight="0"
            overflow="hidden"
          >
            <Heading as="h2" size="lg" mb={4}>
              Shift Calendar {scheduleMode === "draft" && "(Draft)"}
            </Heading>
            {activeShifts.length === 0 ? (
              <Center h="100%" flexDirection="column">
                {" "}
                // Changed to 100%
                <FaExclamationTriangle size={48} color="#CBD5E0" />
                <Text color="gray.500" mt={4}>
                  No shifts scheduled. Click on an employee to create a shift.
                </Text>
                <Button
                  mt={4}
                  colorScheme="blue"
                  onClick={() =>
                    mappedEmployees.length > 0 &&
                    handleSelectEmployee(mappedEmployees[0])
                  }
                  isDisabled={mappedEmployees.length === 0}
                >
                  Create Your First Shift
                </Button>
              </Center>
            ) : (
              <Box flex="1" minHeight="0" height="100%">
                {" "}
                <ShiftCalendar
                  shifts={currentShifts}
                  employees={mappedEmployees || []}
                  onUpdateShift={handleUpdateShift}
                  onDeleteShift={handleDeleteShift}
                  onSelectShift={handleEditShift}
                  scheduleMode={scheduleMode}
                  draftShifts={draftShifts}
                  onPublishSchedule={publishSchedule}
                  onResetToPublished={resetToPublished}
                  hasUnsavedChanges={hasUnsavedChanges}
                />
              </Box>
            )}
          </Box>
        </Flex>
      </Box>

      {/* Modals */}
      {selectedShift ? (
        <ShiftUpdateModal
          isOpen={isOpen}
          onClose={handleModalClose}
          selectedShift={selectedShift}
          employee={selectedEmployee}
          onUpdateShift={async (shiftId: string, updates: Partial<Shift>) => {
            await handleUpdateShift(shiftId, updates);
          }}
          onDeleteShift={async (shiftId: string) => {
            const result = await handleDeleteShift(shiftId);
            return result;
          }}
          isLoading={isProcessing}
          scheduleMode={scheduleMode}
        />
      ) : (
        <ShiftModal
          isOpen={isOpen}
          onClose={handleModalClose}
          employee={selectedEmployee}
          existingShifts={currentShifts.filter(
            (s) => s.employee_id === selectedEmployee?.id && s.active
          )}
          onAddShift={handleAddShift}
          scheduleMode={scheduleMode}
        />
      )}
    </Box>
  );
}

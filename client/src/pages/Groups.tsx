import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Group } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Settings,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  User,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
} from "lucide-react";

// Component for displaying scheduled dates attendance carousel
function ScheduledDatesCarousel({
  groupId,
  students,
  scheduledDates,
  attendanceHistory,
  onAttendanceUpdate,
}: {
  groupId: number;
  students: any[];
  scheduledDates: string[];
  attendanceHistory: any[];
  onAttendanceUpdate: (
    studentId: number,
    date: string,
    currentStatus?: string,
  ) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const datesPerPage = 6; // Show 6 dates at a time

  const totalPages = Math.ceil(scheduledDates.length / datesPerPage);
  const currentDates = scheduledDates.slice(
    currentIndex * datesPerPage,
    (currentIndex + 1) * datesPerPage,
  );

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h5 className="font-medium text-gray-800">
            المواعيد المجدولة ({currentIndex * datesPerPage + 1} -{" "}
            {Math.min((currentIndex + 1) * datesPerPage, scheduledDates.length)}{" "}
            من {scheduledDates.length})
          </h5>
          <div className="flex gap-1 mt-2 justify-center">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-blue-500" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === totalPages - 1}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Dates Grid */}
      <div className="grid gap-4">
        {currentDates.map((date) => {
          const dateObj = new Date(date);
          const dayAttendance = attendanceHistory.filter(
            (record) => record.attendanceDate?.split("T")[0] === date,
          );

          const presentCount = dayAttendance.filter(
            (record) => record.status === "present",
          ).length;
          const absentCount = dayAttendance.filter(
            (record) => record.status === "absent",
          ).length;
          const totalStudents = students.length;
          const attendanceRate =
            totalStudents > 0
              ? Math.round((presentCount / totalStudents) * 100)
              : 0;

          return (
            <div key={date} className="border rounded-lg p-4 bg-gray-50">
              {/* Date Header */}
              <div className="text-center mb-4 pb-3 border-b border-gray-200">
                <div className="text-lg font-bold text-gray-800">
                  {dateObj.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {dateObj.toLocaleDateString("en-US", { weekday: "long" })}
                </div>

                {/* Date Statistics */}
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  <span className="text-green-600 font-medium">
                    حضور: {presentCount}
                  </span>
                  <span className="text-red-600 font-medium">
                    غياب: {absentCount}
                  </span>
                  <span className="text-blue-600 font-medium">
                    النسبة: {attendanceRate}%
                  </span>
                </div>
              </div>

              {/* Students Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {students.map((student) => {
                  const attendanceRecord = attendanceHistory.find(
                    (record) =>
                      record.studentId === student.id &&
                      record.attendanceDate?.split("T")[0] === date,
                  );

                  return (
                    <div key={student.id} className="text-center">
                      <div
                        className="text-xs font-medium text-gray-700 mb-1 truncate"
                        title={student.name}
                      >
                        {student.name.split(" ")[0]}
                      </div>
                      <button
                        onClick={() =>
                          onAttendanceUpdate(
                            student.id,
                            date,
                            attendanceRecord?.status,
                          )
                        }
                        className={`w-10 h-10 rounded-full text-sm font-bold transition-colors ${
                          attendanceRecord?.status === "present"
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : attendanceRecord?.status === "absent"
                              ? "bg-red-500 text-white hover:bg-red-600"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                        }`}
                        title={`${student.name} - ${
                          attendanceRecord?.status === "present"
                            ? "حاضر"
                            : attendanceRecord?.status === "absent"
                              ? "غائب"
                              : "غير مسجل"
                        }`}
                      >
                        {attendanceRecord?.status === "present"
                          ? "✓"
                          : attendanceRecord?.status === "absent"
                            ? "✗"
                            : "?"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Monthly Attendance Carousel component
function MonthlyAttendanceCarousel({
  groupId,
  students,
  attendanceHistory,
}: {
  groupId: number;
  students: any[];
  attendanceHistory: any[];
}) {
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(6); // Start with current month

  // Fetch scheduled lesson dates for this group
  const { data: scheduledDatesData } = useQuery({
    queryKey: [`/api/groups/${groupId}/scheduled-dates`],
    enabled: !!groupId,
  });

  // Update scheduled dates when data changes
  React.useEffect(() => {
    if (scheduledDatesData && Array.isArray(scheduledDatesData)) {
      setScheduledDates(scheduledDatesData);
    } else if (
      scheduledDatesData &&
      typeof scheduledDatesData === "object" &&
      "dates" in scheduledDatesData &&
      Array.isArray((scheduledDatesData as any).dates)
    ) {
      setScheduledDates((scheduledDatesData as any).dates);
    }
  }, [scheduledDatesData]);

  // Generate months data with statistics
  const generateMonthsData = () => {
    const months = [];
    const currentDate = new Date();

    // Generate last 6 months and next 6 months (total 13 months)
    for (let i = -6; i <= 6; i++) {
      const monthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1,
      );
      const monthStart = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1,
      );
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
      );

      // Filter scheduled dates for this month
      const monthScheduledDates = scheduledDates.filter((dateStr) => {
        const date = new Date(dateStr);
        return date >= monthStart && date <= monthEnd;
      });

      // Filter attendance for this month
      const monthAttendance = Array.isArray(attendanceHistory)
        ? attendanceHistory.filter((record: any) => {
            const recordDate = new Date(record.attendanceDate);
            return recordDate >= monthStart && recordDate <= monthEnd;
          })
        : [];

      // Calculate statistics
      const totalScheduledLessons = monthScheduledDates.length;
      const totalPresent = monthAttendance.filter(
        (r: any) => r.status === "present",
      ).length;
      const totalAbsent = monthAttendance.filter(
        (r: any) => r.status === "absent",
      ).length;
      const totalLate = monthAttendance.filter(
        (r: any) => r.status === "late",
      ).length;
      const attendanceRate =
        totalScheduledLessons > 0 && students.length > 0
          ? Math.round(
              (totalPresent / (totalScheduledLessons * students.length)) * 100,
            )
          : 0;

      months.push({
        date: monthDate,
        monthName: monthDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        monthNameEn: monthDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        scheduledDates: monthScheduledDates,
        attendance: monthAttendance,
        stats: {
          totalScheduledLessons,
          totalPresent,
          totalAbsent,
          totalLate,
          attendanceRate,
        },
      });
    }

    return months;
  };

  const monthsData = generateMonthsData();
  const currentMonth = monthsData[currentMonthIndex] || monthsData[6]; // Default to current month

  // Generate mini calendar for current month
  const generateMiniCalendar = (month: any) => {
    if (!month) return [];

    const monthStart = new Date(
      month.date.getFullYear(),
      month.date.getMonth(),
      1,
    );
    const monthEnd = new Date(
      month.date.getFullYear(),
      month.date.getMonth() + 1,
      0,
    );
    const startDay = monthStart.getDay(); // 0 = Sunday
    const daysInMonth = monthEnd.getDate();

    const calendar = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      calendar.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(
        month.date.getFullYear(),
        month.date.getMonth(),
        day,
      );
      const dayStr = dayDate.toISOString().split("T")[0];

      const isScheduled = month.scheduledDates.includes(dayStr);
      const dayAttendance = month.attendance.filter(
        (r: any) =>
          new Date(r.attendanceDate).toISOString().split("T")[0] === dayStr,
      );

      let status = "none";
      if (isScheduled) {
        if (dayAttendance.length > 0) {
          const presentCount = dayAttendance.filter(
            (r: any) => r.status === "present",
          ).length;
          const absentCount = dayAttendance.filter(
            (r: any) => r.status === "absent",
          ).length;

          if (presentCount > absentCount) status = "mostly-present";
          else if (absentCount > presentCount) status = "mostly-absent";
          else status = "mixed";
        } else {
          status = "scheduled";
        }
      }

      calendar.push({ day, status, isScheduled });
    }

    return calendar;
  };

  const miniCalendar = generateMiniCalendar(currentMonth);

  const nextMonth = () => {
    setCurrentMonthIndex((prev) => Math.min(prev + 1, monthsData.length - 1));
  };

  const prevMonth = () => {
    setCurrentMonthIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="bg-white rounded-lg border">
      {scheduledDates.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            📅 هذه المجموعة مرتبطة بالجدول الدراسي - يتم عرض الإحصائيات حسب
            مواعيد الحصص المجدولة
          </div>
        </div>
      )}

      {/* Month Navigation Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <button
          onClick={prevMonth}
          disabled={currentMonthIndex === 0}
          className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {currentMonth?.monthNameEn}
          </h3>
          <p className="text-sm text-gray-600">{currentMonth?.monthName}</p>
        </div>

        <button
          onClick={nextMonth}
          disabled={currentMonthIndex === monthsData.length - 1}
          className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Mini Calendar */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          التقويم الشهري
        </h4>
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Day headers (Arabic) */}
          {[
            "الأحد",
            "الاثنين",
            "الثلاثاء",
            "الأربعاء",
            "الخميس",
            "الجمعة",
            "السبت",
          ].map((day, index) => (
            <div
              key={index}
              className="text-xs font-medium text-gray-500 p-2 truncate"
            >
              {day.slice(0, 3)}
            </div>
          ))}

          {/* Calendar days */}
          {miniCalendar.map((day, index) => (
            <div
              key={index}
              className="aspect-square flex items-center justify-center relative"
            >
              {day ? (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium relative ${
                    day.status === "mostly-present"
                      ? "bg-green-100 text-green-800"
                      : day.status === "mostly-absent"
                        ? "bg-red-100 text-red-800"
                        : day.status === "mixed"
                          ? "bg-yellow-100 text-yellow-800"
                          : day.status === "scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : "text-gray-400"
                  }`}
                >
                  {day.day}
                  {day.isScheduled && (
                    <div
                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        day.status === "mostly-present"
                          ? "bg-green-500"
                          : day.status === "mostly-absent"
                            ? "bg-red-500"
                            : day.status === "mixed"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                      }`}
                    />
                  )}
                </div>
              ) : (
                <div className="w-8 h-8" />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>حضور جيد</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>غياب عالي</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>مختلط</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>مجدول</span>
          </div>
        </div>
      </div>

      {/* Month Statistics */}
      <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {currentMonth?.stats.totalScheduledLessons || 0}
            </div>
            <div className="text-xs text-gray-600">حصص مجدولة</div>
          </div>
          <div className="text-center bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {currentMonth?.stats.totalPresent || 0}
            </div>
            <div className="text-xs text-gray-600">حضور</div>
          </div>
          <div className="text-center bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {currentMonth?.stats.totalAbsent || 0}
            </div>
            <div className="text-xs text-gray-600">غياب</div>
          </div>
          <div className="text-center bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {currentMonth?.stats.attendanceRate || 0}%
            </div>
            <div className="text-xs text-gray-600">نسبة الحضور</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading: loading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Admin group management state
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showAdminGroups, setShowAdminGroups] = useState(false);
  const [selectedAdminGroup, setSelectedAdminGroup] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);

  // New state for hierarchical selection
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);

  // Custom subject creation state
  const [showCustomSubjectModal, setShowCustomSubjectModal] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [customSubjectNameAr, setCustomSubjectNameAr] = useState("");
  const [customSubjectLevel, setCustomSubjectLevel] = useState("");
  const [customSubjectGrade, setCustomSubjectGrade] = useState("");

  // Existing groups filter state
  const [existingGroupsFilter, setExistingGroupsFilter] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("");

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<any>(null);

  // Group management state
  const [managementView, setManagementView] = useState<
    "attendance" | "financial" | null
  >(null);
  const [managementGroup, setManagementGroup] = useState<Group | null>(null);

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Financial state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    studentId: "",
    transactionType: "fee",
    amount: "",
    description: "",
    dueDate: "",
    status: "pending",
  });

  // Monthly carousel state
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  // Helper function to group dates by month
  const groupDatesByMonth = (dates: string[]) => {
    const monthGroups: { [key: string]: string[] } = {};

    dates.forEach((date) => {
      const dateObj = new Date(date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(date);
    });

    // Sort dates within each month
    Object.keys(monthGroups).forEach((monthKey) => {
      monthGroups[monthKey].sort();
    });

    return monthGroups;
  };

  // Helper function to get month display name
  const getMonthDisplayName = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const monthNames = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonthIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonthIndex((prev) => Math.min(monthKeys.length - 1, prev + 1));
  };

  // Super admin school selection state
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);

  // Fetch schools for super admin
  const { data: schools = [] } = useQuery<any[]>({
    queryKey: ["/api/super-admin/schools"],
    enabled: !!user && user.role === "super_admin",
  });

  // Admin data queries
  const { data: adminGroups = [], isLoading: loadingAdminGroups } = useQuery<
    any[]
  >({
    queryKey: ["/api/admin/groups"],
    queryFn: () => {
      if (user?.role === "super_admin" && selectedSchoolId) {
        return fetch(`/api/admin/groups?schoolId=${selectedSchoolId}`).then(
          (res) => res.json(),
        );
      } else if (user?.role === "admin") {
        return fetch("/api/admin/groups").then((res) => res.json());
      }
      return [];
    },
    enabled:
      !!user &&
      (user.role === "admin" ||
        (user.role === "super_admin" && !!selectedSchoolId)),
  });

  const { data: teachingModules = [] } = useQuery<any[]>({
    queryKey: ["/api/teaching-modules"],
    enabled: !!user && user.role === "admin",
  });

  // ChatGPT's solution: Fetch modules with their year mappings
  const { data: modulesWithYears = [] } = useQuery<any[]>({
    queryKey: ["/api/modules-with-years"],
    enabled: !!user && user.role === "admin",
  });

  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ["/api/teachers-with-specializations"],
    enabled: !!user && user.role === "admin",
  });

  const { data: availableStudents = [] } = useQuery<any[]>({
    queryKey: [
      `/api/admin/groups/students/${selectedAdminGroup?.educationLevel}/${selectedAdminGroup?.subjectId}`,
    ],
    enabled:
      !!user &&
      user.role === "admin" &&
      !!selectedAdminGroup?.educationLevel &&
      !!selectedAdminGroup?.subjectId,
  });

  // Attendance data queries
  const { data: attendanceData = [] } = useQuery<any[]>({
    queryKey: ["/api/groups", managementGroup?.id, "attendance"],
    enabled: !!managementGroup && managementView === "attendance",
  });

  // Attendance history query for table
  const { data: attendanceHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/groups", managementGroup?.id, "attendance-history"],
    queryFn: async () => {
      if (!managementGroup) return [];
      const response = await apiRequest(
        "GET",
        `/api/groups/${managementGroup.id}/attendance-history`,
      );
      return await response.json();
    },
    enabled: !!managementGroup && managementView === "attendance",
  });

  // Scheduled dates query for attendance table
  const { data: scheduledDatesData } = useQuery<{ dates: string[] }>({
    queryKey: ["/api/groups", managementGroup?.id, "scheduled-dates"],
    queryFn: async () => {
      if (!managementGroup) return { dates: [] };
      const response = await apiRequest(
        "GET",
        `/api/groups/${managementGroup.id}/scheduled-dates`,
      );
      return await response.json();
    },
    enabled: !!managementGroup && managementView === "attendance",
  });

  // Process scheduled dates into monthly groups first
  const monthlyGroups = scheduledDatesData?.dates
    ? groupDatesByMonth(scheduledDatesData.dates)
    : {};
  const monthKeys = Object.keys(monthlyGroups).sort();
  const currentMonthKey = monthKeys[currentMonthIndex] || "";
  const currentMonthDates = monthlyGroups[currentMonthKey] || [];

  // Get current viewing month details instead of actual current month
  const getCurrentViewingMonth = () => {
    if (currentMonthKey) {
      const [year, month] = currentMonthKey.split("-");
      return { year: parseInt(year), month: parseInt(month) };
    }
    // Fallback to current month if no viewing month is set
    const currentDate = new Date();
    return {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
    };
  };

  const { year: currentViewingYear, month: currentViewingMonth } =
    getCurrentViewingMonth();

  const { data: paymentStatuses = [] } = useQuery<any[]>({
    queryKey: [
      "/api/groups",
      managementGroup?.id,
      "payment-status",
      currentViewingYear,
      currentViewingMonth,
    ],
    queryFn: async () => {
      if (!managementGroup) return [];
      const response = await apiRequest(
        "GET",
        `/api/groups/${managementGroup.id}/payment-status/${currentViewingYear}/${currentViewingMonth}`,
      );
      return await response.json();
    },
    enabled: !!managementGroup && managementView === "attendance",
  });

  // Set initial month to current month when data loads
  useEffect(() => {
    if (scheduledDatesData?.dates && scheduledDatesData.dates.length > 0) {
      const currentDate = new Date();
      const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      const monthlyGroups = groupDatesByMonth(scheduledDatesData.dates);
      const monthKeys = Object.keys(monthlyGroups).sort();
      const currentIndex = monthKeys.findIndex(
        (key) => key === currentMonthKey,
      );

      if (currentIndex !== -1) {
        setCurrentMonthIndex(currentIndex);
      }
    }
  }, [scheduledDatesData]);

  // Refresh payment data when viewing month changes
  useEffect(() => {
    if (managementGroup && managementView === "attendance" && currentMonthKey) {
      const { year: viewingYear, month: viewingMonth } =
        getCurrentViewingMonth();
      queryClient.invalidateQueries({
        queryKey: [
          "/api/groups",
          managementGroup.id,
          "payment-status",
          viewingYear,
          viewingMonth,
        ],
      });
    }
  }, [currentMonthKey, managementGroup, managementView, queryClient]);

  // Financial data queries
  const { data: financialData = [], refetch: refetchFinancial } = useQuery<
    any[]
  >({
    queryKey: ["/api/groups", managementGroup?.id, "transactions"],
    enabled: !!managementGroup && managementView === "financial",
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await apiRequest("POST", "/api/group-registrations", {
        groupId,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم انضمامك للمجموعة بنجاح" });
      setShowJoinForm(false);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ["/api/group-registrations"] });
    },
    onError: () => {
      toast({ title: "خطأ في الانضمام للمجموعة", variant: "destructive" });
    },
  });

  const updateGroupAssignmentsMutation = useMutation({
    mutationFn: async ({
      groupId,
      studentIds,
      teacherId,
      groupData,
    }: {
      groupId: number | null;
      studentIds: number[];
      teacherId: number;
      groupData?: any;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/groups/${groupId || "null"}/assignments`,
        {
          studentIds,
          teacherId,
          groupData,
        },
      );
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم تحديث تعيينات المجموعة بنجاح" });
      setShowAssignmentModal(false);
      setSelectedAdminGroup(null);
      setSelectedStudents([]);
      setSelectedTeacher(null);

      // Complete cache reset and refresh strategy
      queryClient.clear(); // Clear all cache

      // Force immediate refresh with cache busting timestamp
      const timestamp = Date.now();
      queryClient.refetchQueries({
        queryKey: ["/api/admin/groups"],
        type: "all",
      });
      queryClient.refetchQueries({
        queryKey: ["/api/groups"],
        type: "all",
      });
    },
    onError: () => {
      toast({ title: "خطأ في تحديث تعيينات المجموعة", variant: "destructive" });
    },
  });

  const createCustomSubjectMutation = useMutation({
    mutationFn: async (subjectData: {
      name: string;
      nameAr: string;
      educationLevel: string;
      grade?: string;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/custom-subjects",
        subjectData,
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء المادة المخصصة بنجاح",
        description: data.message || "تم إنشاء المادة بنجاح",
      });
      setShowCustomSubjectModal(false);
      setCustomSubjectName("");
      setCustomSubjectNameAr("");
      setCustomSubjectLevel("");
      setCustomSubjectGrade("");
      // Force cache invalidation for all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teaching-modules"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/teachers-with-specializations"],
      });
      // Don't reset the main form selections - keep them so user can see the new subject
      // setSelectedLevel('');
      // setSelectedGrade('');
    },
    onError: () => {
      toast({ title: "خطأ في إنشاء المادة المخصصة", variant: "destructive" });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest("DELETE", `/api/admin/groups/${groupId}`);
    },
    onSuccess: () => {
      toast({
        title: "تم حذف المجموعة بنجاح",
        description: "تم حذف المجموعة وجميع التعيينات المرتبطة بها",
      });
      setShowDeleteConfirm(false);
      setGroupToDelete(null);
      // Invalidate admin groups to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف المجموعة",
        description:
          error.response?.data?.error || "حدث خطأ أثناء حذف المجموعة",
        variant: "destructive",
      });
    },
  });

  // Financial mutations
  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(
        "POST",
        `/api/groups/${managementGroup?.id}/transactions`,
        data,
      );
    },
    onSuccess: () => {
      refetchFinancial();
      setShowNewTransactionModal(false);
      setNewTransaction({
        studentId: "",
        transactionType: "fee",
        amount: "",
        description: "",
        dueDate: "",
        status: "pending",
      });
      toast({
        title: "تم إنشاء المعاملة",
        description: "تم إنشاء المعاملة المالية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء المعاملة",
        description: error.response?.data?.error || "فشل في إنشاء المعاملة",
        variant: "destructive",
      });
    },
  });

  // Payment status mutation
  const markPaymentMutation = useMutation({
    mutationFn: async ({
      studentId,
      isPaid,
    }: {
      studentId: number;
      isPaid: boolean;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/students/${studentId}/mark-payment`,
        {
          year: currentViewingYear,
          month: currentViewingMonth,
          isPaid,
        },
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "تم تحديث حالة الدفع بنجاح" });

      // Clear all payment status queries to force a fresh fetch
      queryClient.invalidateQueries({
        queryKey: ["/api/groups", managementGroup?.id, "payment-status"],
      });

      // Specifically invalidate current month for both admin view and modal view
      queryClient.invalidateQueries({
        queryKey: [
          "/api/groups",
          managementGroup?.id,
          "payment-status",
          currentViewingYear,
          currentViewingMonth,
        ],
      });

      // Also invalidate the current calendar month for modal view
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      queryClient.invalidateQueries({
        queryKey: [
          "/api/groups",
          managementGroup?.id,
          "payment-status",
          currentYear,
          currentMonth,
        ],
      });

      // Force immediate refetch for both views
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: [
            "/api/groups",
            managementGroup?.id,
            "payment-status",
            currentViewingYear,
            currentViewingMonth,
          ],
        });
        queryClient.refetchQueries({
          queryKey: [
            "/api/groups",
            managementGroup?.id,
            "payment-status",
            currentYear,
            currentMonth,
          ],
        });
      }, 100);
    },
    onError: (error: any) => {
      console.error("Payment update error:", error);
      toast({ title: "خطأ في تحديث حالة الدفع", variant: "destructive" });
    },
  });

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroup) {
      joinGroupMutation.mutate(selectedGroup.id);
    }
  };

  const handleOpenAssignmentModal = (group: any) => {
    setSelectedAdminGroup(group);
    // Extract student IDs from the studentsAssigned array
    const studentIds = (group.studentsAssigned || []).map(
      (student: any) => student.id,
    );
    setSelectedStudents(studentIds);
    setSelectedTeacher(group.teacherId || null);
    setShowAssignmentModal(true);
  };

  const handleUpdateAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAdminGroup && selectedTeacher) {
      updateGroupAssignmentsMutation.mutate({
        groupId: selectedAdminGroup.id,
        studentIds: selectedStudents,
        teacherId: selectedTeacher,
        groupData: selectedAdminGroup.isPlaceholder
          ? {
              ...selectedAdminGroup,
              description:
                selectedAdminGroup.description ||
                `مجموعة تعليمية لمادة ${selectedAdminGroup.nameAr || selectedAdminGroup.subjectName || "غير محددة"}`,
              category: selectedAdminGroup.category || "دراسية",
            }
          : undefined,
      });
    }
  };

  const handleCreateCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      customSubjectName &&
      customSubjectNameAr &&
      customSubjectLevel &&
      customSubjectGrade
    ) {
      createCustomSubjectMutation.mutate({
        name: customSubjectName,
        nameAr: customSubjectNameAr,
        educationLevel: customSubjectLevel,
        grade: customSubjectGrade,
      });
    }
  };

  const handleDeleteGroup = (group: any) => {
    setGroupToDelete(group);
    setShowDeleteConfirm(true);
  };

  // Group management handlers
  const openGroupManagement = (
    group: Group,
    view: "attendance" | "financial",
  ) => {
    setManagementGroup(group);
    setManagementView(view);
  };

  const closeGroupManagement = () => {
    setManagementGroup(null);
    setManagementView(null);
  };

  // Table attendance click handler - toggles between present/absent
  const handleTableAttendanceClick = async (
    studentId: number,
    date: string,
    currentStatus?: string,
  ) => {
    // Toggle: unrecorded -> present -> absent -> present
    const nextStatus = currentStatus === "present" ? "absent" : "present";

    // Find student to get their type
    const assignedStudents = managementGroup?.studentsAssigned || [];
    const student = assignedStudents.find((s: any) => s.id === studentId);

    if (!student) {
      toast({ title: "لم يتم العثور على الطالب", variant: "destructive" });
      return;
    }

    // Determine student type - if email contains @parent.local, it's a child
    const studentType =
      student &&
      typeof student === "object" &&
      "email" in student &&
      typeof (student as any).email === "string" &&
      (student as any).email.includes("@parent.local")
        ? "child"
        : "student";

    try {
      const response = await apiRequest(
        "POST",
        `/api/groups/${managementGroup?.id}/attendance`,
        {
          studentId,
          studentType: studentType, // Use determined student type
          attendanceDate: date,
          status: nextStatus,
        },
      );

      if (response.ok) {
        // Refetch attendance history to update the table
        queryClient.invalidateQueries({
          queryKey: ["/api/groups", managementGroup?.id, "attendance-history"],
        });

        toast({
          title: `تم تسجيل ${nextStatus === "present" ? "الحضور" : "الغياب"} بنجاح`,
          description: `${new Date(date).toLocaleDateString("en-US")}`,
        });
      }
    } catch (error) {
      console.error("Error marking table attendance:", error);
      toast({
        title: "خطأ في تسجيل الحضور",
        variant: "destructive",
      });
    }
  };

  // Financial handlers
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newTransaction.studentId ||
      !newTransaction.amount ||
      !newTransaction.description
    ) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const transactionData = {
      ...newTransaction,
      studentId: parseInt(newTransaction.studentId),
      amount: parseInt(newTransaction.amount) * 100, // Convert to cents
      dueDate: newTransaction.dueDate ? new Date(newTransaction.dueDate) : null,
    };

    createTransactionMutation.mutate(transactionData);
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      console.log("Attempting to delete group:", groupToDelete);
      if (groupToDelete.id) {
        console.log("Group has ID:", groupToDelete.id);
        deleteGroupMutation.mutate(groupToDelete.id);
      } else {
        console.log(
          "Group has no ID - this is a virtual group that cannot be deleted",
        );
        toast({
          title: "لا يمكن حذف هذه المجموعة",
          description: "هذه مجموعة افتراضية. يجب إنشاؤها أولاً لحذفها",
          variant: "destructive",
        });
        setShowDeleteConfirm(false);
        setGroupToDelete(null);
      }
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const getEducationLevelColor = (level: string) => {
    switch (level) {
      case "الابتدائي":
        return "text-green-600 bg-green-50";
      case "المتوسط":
        return "text-blue-600 bg-blue-50";
      case "الثانوي":
        return "text-purple-600 bg-purple-50";
      case "جميع المستويات":
        return "text-orange-600 bg-orange-50 border border-orange-200";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Simple level and year format with gender
  const getSimpleLevelFormat = (group: any): string => {
    const level = group.educationLevel;
    let levelShort = "";

    if (level === "الثانوي") levelShort = "ثانوي";
    else if (level === "المتوسط") levelShort = "متوسط";
    else if (level === "الابتدائي") levelShort = "ابتدائي";
    else return level;

    let yearNumber = "";

    // Get grade from the teaching module (the subject's intrinsic year)
    if (group.subjectId && teachingModules) {
      const subject = teachingModules.find(
        (s: any) => s.id === group.subjectId,
      );
      if (subject && subject.grade && subject.grade !== "جميع المستويات") {
        const grade = subject.grade;

        // Handle year-specific grades first
        if (grade.includes("الثالثة") || grade.includes("3")) yearNumber = " 3";
        else if (grade.includes("الثانية") || grade.includes("2"))
          yearNumber = " 2";
        else if (grade.includes("الأولى") || grade.includes("1"))
          yearNumber = " 1";
        else if (grade.includes("الرابعة") || grade.includes("4"))
          yearNumber = " 4";
        else if (grade.includes("الخامسة") || grade.includes("5"))
          yearNumber = " 5";
        // Handle Algerian secondary specialization tracks (all 3rd year)
        else if (level === "الثانوي") {
          if (
            grade === "علمي" ||
            grade === "أدبي" ||
            grade === "تسيير واقتصاد" ||
            grade === "رياضيات" ||
            grade === "تقني رياضي" ||
            grade === "لغات أجنبية"
          ) {
            yearNumber = " 3"; // All specializations are 3rd year
          }
        }

        // Handle middle school specializations
        else if (level === "المتوسط") {
          if (grade === "علمي" || grade === "أدبي") {
            yearNumber = " 4"; // Most specializations start in 4th year middle
          }
        }
      } else if (subject && subject.grade === "جميع المستويات") {
        // For legacy curriculum subjects, don't show year numbers - they are general
        yearNumber = "";
      }
    }

    // Add gender information if available
    let genderText = "";
    if (group.gender) {
      if (group.gender === "male") genderText = " - ذكور";
      else if (group.gender === "female") genderText = " - إناث";
      else if (group.gender === "mixed") genderText = " - مختلط";
    }

    const result = `${levelShort}${yearNumber}${genderText}`;
    return result;
  };

  const getFilteredTeachers = (educationLevel: string, subjectId: number) => {
    return teachers.filter((teacher) =>
      teacher.specializations.some(
        (spec: any) =>
          spec.educationLevel === educationLevel && spec.id === subjectId,
      ),
    );
  };

  // Helper function to get available grades for each education level
  // Helper function to get payment status for a student
  const getStudentPaymentStatus = (studentId: number) => {
    const paymentRecord = paymentStatuses.find(
      (payment: any) => payment.studentId === studentId,
    );
    // Default to unpaid if no record exists
    return paymentRecord || { studentId, isPaid: false };
  };

  // Helper function to toggle payment status
  const handleTogglePayment = (studentId: number) => {
    if (user?.role !== "admin") return;

    // Find student to check if it exists
    const assignedStudents = managementGroup?.studentsAssigned || [];
    const student = assignedStudents.find((s: any) => s.id === studentId);

    if (!student) {
      toast({ title: "لم يتم العثور على الطالب", variant: "destructive" });
      return;
    }

    const currentPayment = getStudentPaymentStatus(studentId);

    // Only allow payment changes if payment is required (not virtual records)
    if (currentPayment?.isVirtual && !currentPayment?.mustPay) {
      toast({
        title: "لا يوجد دفع مطلوب لهذا الشهر حتى الآن",
        variant: "destructive",
      });
      return;
    }

    const isPaid = !currentPayment?.isPaid;
    markPaymentMutation.mutate({ studentId, isPaid });
  };

  const getAvailableGrades = (level: string) => {
    switch (level) {
      case "الابتدائي":
        return [
          { value: "السنة الأولى ابتدائي", label: "السنة الأولى" },
          { value: "السنة الثانية ابتدائي", label: "السنة الثانية" },
          { value: "السنة الثالثة ابتدائي", label: "السنة الثالثة" },
          { value: "السنة الرابعة ابتدائي", label: "السنة الرابعة" },
          { value: "السنة الخامسة ابتدائي", label: "السنة الخامسة" },
        ];
      case "المتوسط":
        return [
          { value: "السنة الأولى متوسط", label: "السنة الأولى" },
          { value: "السنة الثانية متوسط", label: "السنة الثانية" },
          { value: "السنة الثالثة متوسط", label: "السنة الثالثة" },
          { value: "السنة الرابعة متوسط", label: "السنة الرابعة" },
        ];
      case "الثانوي":
        return [
          { value: "السنة الأولى ثانوي", label: "السنة الأولى" },
          { value: "السنة الثانية ثانوي", label: "السنة الثانية" },
          { value: "السنة الثالثة ثانوي", label: "السنة الثالثة" },
        ];
      default:
        return [];
    }
  };

  // Handle level selection
  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    setSelectedGrade("");
    setFilteredSubjects([]);
  };

  // Handle grade selection
  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);

    // Filter subjects based on selected level
    const levelSubjects = adminGroups.filter(
      (group) => group.educationLevel === selectedLevel,
    );
    setFilteredSubjects(levelSubjects);
  };

  // Get subject groups for selected level and grade
  const getSubjectGroups = () => {
    if (!selectedLevel || !teachingModules) return [];

    if (selectedLevel === "جميع المستويات") {
      // For universal view, show subjects that exist across all education levels
      // Group by subject name and show only subjects that appear in all three levels
      const subjectCounts: {
        [key: string]: { count: number; group: any; levels: string[] };
      } = {};
      const universalSubjects: any[] = [];

      // Count how many education levels each subject appears in
      adminGroups.forEach((group) => {
        const subjectKey = group.nameAr || group.subjectName;
        if (!subjectCounts[subjectKey]) {
          subjectCounts[subjectKey] = {
            count: 0,
            group: group,
            levels: [],
          };
        }
        subjectCounts[subjectKey].count++;
        subjectCounts[subjectKey].levels.push(group.educationLevel);
      });

      // Include subjects that appear in all 3 levels (primary, middle, secondary)
      Object.keys(subjectCounts).forEach((subjectKey) => {
        const subjectData = subjectCounts[subjectKey];
        if (subjectData.count >= 3) {
          universalSubjects.push({
            ...subjectData.group,
            educationLevel: "جميع المستويات",
            isUniversal: true,
          });
        }
      });

      return universalSubjects;
    }

    // For specific education level and grade selection, work with teaching modules
    let relevantModules = teachingModules.filter(
      (module: any) => module.educationLevel === selectedLevel,
    );

    // If a specific grade is selected, filter by that grade
    if (selectedGrade) {
      console.log("DEBUG: Filtering by grade:", selectedGrade);
      console.log(
        "DEBUG: Available modules before grade filter:",
        relevantModules.length,
      );

      // Convert selected grade to teaching module format for comparison
      let targetGrade = selectedGrade;

      // Convert from UI format to database format
      // السنة الأولى ابتدائي -> الأولى ابتدائي
      targetGrade = targetGrade.replace("السنة ", "");

      relevantModules = relevantModules.filter((module: any) => {
        const moduleGrade = module.grade?.trim() || "";
        console.log(
          `DEBUG: Comparing module "${module.name_ar}" grade "${moduleGrade}" with target grade "${targetGrade}"`,
        );

        // Exact match for grade
        if (moduleGrade === targetGrade) {
          console.log(`DEBUG: Exact match for module "${module.name_ar}"`);
          return true;
        }

        // Handle secondary specializations mapping to 3rd year
        if (selectedLevel === "الثانوي" && targetGrade === "الثالثة ثانوي") {
          const moduleGradeLower = moduleGrade.toLowerCase();
          const isThirdYearSpec = [
            "تسيير واقتصاد",
            "علمي",
            "أدبي",
            "تقني رياضي",
            "آداب وفلسفة",
            "لغات أجنبية",
          ].some((spec) => moduleGradeLower.includes(spec.toLowerCase()));

          if (isThirdYearSpec) {
            console.log(
              `DEBUG: Secondary specialization match for "${module.name_ar}"`,
            );
            return true;
          }
        }

        // Handle reverse: when specialization is selected, match 3rd year modules
        if (selectedLevel === "الثانوي") {
          const selectedSpecializations = [
            "تسيير واقتصاد",
            "علمي",
            "أدبي",
            "تقني رياضي",
          ];
          const isSpecializationSelected =
            selectedSpecializations.includes(targetGrade);
          const isThirdYearModule = moduleGrade === "الثالثة ثانوي";

          if (isSpecializationSelected && isThirdYearModule) {
            console.log(
              `DEBUG: Specialization-to-year match for "${module.name_ar}"`,
            );
            return true;
          }
        }

        console.log(`DEBUG: No match for module "${module.name_ar}"`);
        return false;
      });

      console.log("DEBUG: Modules after grade filter:", relevantModules.length);
    }

    // Create group objects from teaching modules (either existing groups or placeholders)
    console.log(
      "DEBUG: Creating groups from modules:",
      relevantModules.map((m) => ({
        id: m.id,
        name: m.name,
        name_ar: m.name_ar,
        nameAr: m.nameAr,
        educationLevel: m.educationLevel,
        grade: m.grade,
      })),
    );

    // Remove duplicates by keeping only one module per nameAr (prefer global subjects)
    const uniqueModules = relevantModules.reduce((acc: any[], current: any) => {
      const existingModule = acc.find(
        (m) => (m.nameAr || m.name_ar) === (current.nameAr || current.name_ar),
      );
      if (!existingModule) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueModules.map((module: any) => {
      // Check if there's already a group for this module
      const existingGroup = adminGroups.find(
        (group) => group.subjectId === module.id && !group.isPlaceholder,
      );

      if (existingGroup) {
        // Return the existing group
        return existingGroup;
      } else {
        // Create a placeholder group
        const arabicName =
          module.nameAr ||
          module.name_ar ||
          module.subjectNameAr ||
          "مادة غير محددة";
        return {
          id: null, // No ID means it's a placeholder
          name: `مجموعة ${arabicName}`,
          nameAr: arabicName,
          subjectName: arabicName,
          subjectId: module.id,
          educationLevel: selectedLevel,
          teacherId: null,
          teacherName: null,
          studentsAssigned: [],
          isPlaceholder: true,
        };
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen lg:bg-gradient-to-br lg:from-white lg:via-gray-50/50 lg:to-gray-100/30">
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
        <div className="lg:hidden">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            المجموعات التعليمية
          </h2>
        </div>

        {/* Desktop: Enhanced header with stats */}
        <div className="hidden lg:block mb-10">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-l from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                  إدارة المجموعات التعليمية
                </h1>
                <p className="text-gray-600 text-lg">
                  إنشاء وإدارة المجموعات الدراسية للطلاب
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {adminGroups.filter((g) => !g.isPlaceholder).length}
                  </div>
                  <div className="text-sm font-semibold text-green-700">
                    مجموعة نشطة
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {adminGroups.reduce(
                      (total, group) =>
                        total + (group.studentsAssigned?.length || 0),
                      0,
                    )}
                  </div>
                  <div className="text-sm font-semibold text-blue-700">
                    طالب مسجل
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Super Admin School Selection */}
        {user?.role === "super_admin" && (
          <div className="mb-8">
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-orange-800 flex items-center">
                  <Settings className="h-5 w-5 ml-2" />
                  اختيار المدرسة لإدارة المجموعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اختر المدرسة
                    </label>
                    <select
                      value={selectedSchoolId || ""}
                      onChange={(e) =>
                        setSelectedSchoolId(
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">اختر مدرسة...</option>
                      {schools.map((school: any) => (
                        <option key={school.id} value={school.id}>
                          {school.name} ({school.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    {selectedSchoolId && (
                      <div className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        مدرسة محددة - يمكنك الآن إدارة المجموعات
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Group Management Section */}
        {(user?.role === "admin" ||
          (user?.role === "super_admin" && selectedSchoolId)) && (
          <div className="mb-8">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-800">
                      إدارة المجموعات الموجودة
                      {user?.role === "super_admin" && selectedSchoolId && (
                        <span className="text-sm text-gray-600 mr-2 font-normal">
                          -{" "}
                          {
                            schools.find((s: any) => s.id === selectedSchoolId)
                              ?.name
                          }
                        </span>
                      )}
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdminGroups(!showAdminGroups)}
                    className="border-blue-300 text-blue-600 hover:bg-blue-100"
                  >
                    {showAdminGroups ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {showAdminGroups ? "إخفاء" : "عرض"}
                  </Button>
                </div>
              </CardHeader>

              {showAdminGroups && (
                <CardContent className="pt-0">
                  {/* Custom Subject Creation Button - Only for School Admins */}
                  {user?.role === "admin" && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-800 mb-1">
                            إنشاء مادة مخصصة
                          </h4>
                          <p className="text-sm text-green-600">
                            أنشئ مواد جديدة خارج المنهج الرسمي
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCustomSubjectModal(true)}
                          className="border-green-300 text-green-600 hover:bg-green-100"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إنشاء مادة مخصصة
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Super Admin Info Message */}
                  {user?.role === "super_admin" && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-orange-600" />
                        <div>
                          <h4 className="font-medium text-orange-800 mb-1">
                            عرض المجموعات فقط
                          </h4>
                          <p className="text-sm text-orange-600">
                            المسؤولين العامين يمكنهم عرض وإدارة المجموعات
                            الموجودة، إنشاء مجموعات جديدة يتم من قبل مدير
                            المدرسة
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {loadingAdminGroups ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : user?.role === "super_admin" &&
                    adminGroups.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-orange-400 mb-4" />
                      <p className="text-orange-600">
                        لا توجد مجموعات في هذه المدرسة
                      </p>
                      <p className="text-sm text-orange-500 mt-1">
                        المسؤولين العامين يمكنهم عرض المجموعات فقط، إنشاء
                        المجموعات يتم من قبل مدير المدرسة
                      </p>
                    </div>
                  ) : adminGroups.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-blue-400 mb-4" />
                      <p className="text-blue-600">
                        لا توجد مجموعات إدارية حالياً
                      </p>
                      <p className="text-sm text-blue-500 mt-1">
                        يمكنك إنشاء مجموعات جديدة من قسم إدارة المحتوى
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Modern Hierarchical Selection */}
                      <div className="bg-white rounded-lg border p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          اختر المستوى والسنة
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {/* Education Level Selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              المستوى التعليمي
                            </label>
                            <select
                              value={selectedLevel}
                              onChange={(e) =>
                                handleLevelChange(e.target.value)
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">اختر المستوى...</option>
                              <option value="جميع المستويات">
                                جميع المستويات (المواد العامة)
                              </option>
                              <option value="الابتدائي">الابتدائي</option>
                              <option value="المتوسط">المتوسط</option>
                              <option value="الثانوي">الثانوي</option>
                            </select>
                          </div>

                          {/* Grade Selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              السنة الدراسية
                            </label>
                            <select
                              value={selectedGrade}
                              onChange={(e) =>
                                handleGradeChange(e.target.value)
                              }
                              disabled={!selectedLevel}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            >
                              <option value="">اختر السنة...</option>
                              {getAvailableGrades(selectedLevel).map(
                                (grade) => (
                                  <option key={grade.value} value={grade.value}>
                                    {grade.label}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Instruction Message */}
                        {selectedLevel &&
                          selectedLevel !== "جميع المستويات" &&
                          !selectedGrade && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                الرجاء اختيار السنة الدراسية لعرض المواد المتاحة
                              </p>
                            </div>
                          )}

                        {/* Universal Level Message */}
                        {selectedLevel === "جميع المستويات" && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              عرض المواد العامة المتاحة لجميع المستويات
                              التعليمية
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Subject Groups Grid */}
                      {((selectedLevel && selectedGrade) ||
                        selectedLevel === "جميع المستويات") && (
                        <div className="bg-white rounded-lg border p-6">
                          <div className="flex items-center mb-4">
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getEducationLevelColor(selectedLevel)}`}
                            >
                              <GraduationCap className="w-4 h-4 inline mr-2" />
                              {selectedLevel}
                            </div>
                            {selectedGrade && (
                              <div className="ml-3 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                                {selectedGrade}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                              المواد المتاحة
                            </h3>
                            {user?.role === "admin" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Pre-fill the custom subject modal with the current selection
                                  setCustomSubjectLevel(selectedLevel);
                                  setCustomSubjectGrade(selectedGrade || "");
                                  setShowCustomSubjectModal(true);
                                }}
                                className="border-green-300 text-green-600 hover:bg-green-50"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                إنشاء مادة مخصصة
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                            {getSubjectGroups().map((group) => (
                              <div
                                key={group.id || group.subjectId}
                                className="border rounded-lg p-4 bg-white shadow-sm"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-gray-900">
                                    {group.nameAr ||
                                      group.subjectName ||
                                      group.subjectNameAr ||
                                      group.name_ar ||
                                      "مادة غير محددة"}
                                  </h4>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${group.isPlaceholder ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                                  >
                                    {group.isPlaceholder ? "فارغة" : "نشطة"}
                                  </span>
                                </div>

                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span>
                                      {group.teacherName || "لا يوجد معلم"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>
                                      {group.studentsAssigned?.length || 0} طالب
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3 pt-3 border-t space-y-2">
                                  <Button
                                    size="sm"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() =>
                                      handleOpenAssignmentModal(group)
                                    }
                                  >
                                    إدارة المجموعة
                                  </Button>

                                  {!group.isPlaceholder &&
                                    user?.role === "admin" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full border-green-500 text-green-600 hover:bg-green-50"
                                        onClick={() =>
                                          openGroupManagement(
                                            group,
                                            "attendance",
                                          )
                                        }
                                      >
                                        <Calendar className="w-4 h-4 mr-1" />
                                        الحضور
                                      </Button>
                                    )}
                                  {!group.isPlaceholder &&
                                    user?.role !== "admin" && (
                                      <div className="text-center text-sm text-gray-500 py-2">
                                        الحضور متاح للمديرين فقط
                                      </div>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {getSubjectGroups().length === 0 && (
                            <div className="text-center py-8">
                              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                              <p className="text-gray-600">
                                لا توجد مواد متاحة للمستوى المحدد
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Super Admin Read-Only Groups Section */}
        {user?.role === "super_admin" && selectedSchoolId && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="h-5 w-5 ml-2 text-orange-600" />
                المجموعات الموجودة -{" "}
                {schools.find((s: any) => s.id === selectedSchoolId)?.name} (عرض
                فقط)
              </h2>

              {/* Education Level Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {["الابتدائي", "المتوسط", "الثانوي", "مجموعات مخصصة"].map(
                  (level) => (
                    <button
                      key={level}
                      onClick={() => {
                        const filterValue =
                          level === "مجموعات مخصصة" ? "custom" : level;
                        setExistingGroupsFilter(filterValue);
                        setSelectedYearFilter("");
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        existingGroupsFilter ===
                        (level === "مجموعات مخصصة" ? "custom" : level)
                          ? "bg-orange-600 text-white"
                          : "bg-white text-gray-700 hover:bg-orange-50"
                      }`}
                    >
                      {level}
                    </button>
                  ),
                )}
              </div>

              {/* Groups Display - Read Only for Super Admin */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {existingGroupsFilter &&
                  (() => {
                    let filteredGroups = [];
                    const adminCreatedGroups = adminGroups.filter(
                      (group) => !group.isPlaceholder,
                    );

                    if (existingGroupsFilter === "custom") {
                      filteredGroups = adminCreatedGroups.filter((group) => {
                        const teachingModule = teachingModules?.find(
                          (module: any) => module.id === group.subjectId,
                        );
                        if (!teachingModule || !teachingModule.schoolId)
                          return false;

                        const subjectName = (
                          teachingModule.nameAr ||
                          teachingModule.name ||
                          ""
                        ).toLowerCase();
                        const standardSubjects = [
                          "العربية والرياضيات",
                          "عربية",
                          "رياضيات",
                          "فرنسية",
                          "انجليزية",
                          "علوم",
                          "تاريخ",
                          "جغرافيا",
                          "تربية إسلامية",
                          "فيزياء",
                          "كيمياء",
                          "أحياء",
                        ];

                        const isStandardSubject = standardSubjects.some(
                          (standard) =>
                            subjectName.includes(standard.toLowerCase()),
                        );

                        return !isStandardSubject;
                      });
                    } else {
                      filteredGroups = adminCreatedGroups.filter(
                        (group) =>
                          group.educationLevel === existingGroupsFilter,
                      );
                    }

                    return filteredGroups.length > 0 ? (
                      filteredGroups.map((group) => {
                        const getTeacherName = () => {
                          if (group.teacherId && teachers) {
                            const teacher = teachers.find(
                              (t: any) => t.id === group.teacherId,
                            );
                            return teacher ? teacher.name : "غير محدد";
                          }
                          return "غير محدد";
                        };

                        const getBadgeColor = () => {
                          switch (group.educationLevel) {
                            case "الابتدائي":
                              return "bg-green-100 text-green-800";
                            case "المتوسط":
                              return "bg-blue-100 text-blue-800";
                            case "الثانوي":
                              return "bg-purple-100 text-purple-800";
                            default:
                              return "bg-gray-100 text-gray-800";
                          }
                        };

                        return (
                          <Card
                            key={group.id || group.name}
                            className="border border-orange-200 hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex justify-start gap-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${getBadgeColor()}`}
                                  >
                                    {getSimpleLevelFormat(group)}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                    عرض فقط
                                  </span>
                                </div>

                                <h3 className="font-semibold text-gray-800">
                                  {group.nameAr ||
                                    group.subjectName ||
                                    group.subjectNameAr ||
                                    group.name_ar ||
                                    "مادة غير محددة"}
                                </h3>

                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">المعلم:</span>{" "}
                                  {getTeacherName()}
                                </div>

                                <div className="flex items-center text-sm text-gray-600">
                                  <Users className="h-4 w-4 ml-1" />
                                  <span>
                                    {group.studentsAssigned?.length || 0} طالب
                                  </span>
                                </div>

                                <div className="text-xs text-orange-600 text-center py-2 bg-orange-50 rounded">
                                  المسؤولين العامين يمكنهم عرض المجموعات فقط
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <div className="text-gray-500">
                          <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">
                            {existingGroupsFilter === "custom"
                              ? "لا توجد مجموعات مخصصة في هذه المدرسة"
                              : `لا توجد مجموعات في ${existingGroupsFilter} في هذه المدرسة`}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>
        )}

        {/* Admin-Created Groups Section */}
        {user?.role === "admin" && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Settings className="h-5 w-5 ml-2 text-blue-600" />
                المجموعات الموجودة (مصنفة حسب المستوى)
              </h2>

              {/* Education Level Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {["الابتدائي", "المتوسط", "الثانوي", "مجموعات مخصصة"].map(
                  (level) => (
                    <button
                      key={level}
                      onClick={() => {
                        const filterValue =
                          level === "مجموعات مخصصة" ? "custom" : level;
                        setExistingGroupsFilter(filterValue);
                        setSelectedYearFilter(""); // Reset year filter when changing education level
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        existingGroupsFilter ===
                        (level === "مجموعات مخصصة" ? "custom" : level)
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-blue-50"
                      }`}
                    >
                      {level}
                    </button>
                  ),
                )}
              </div>

              {/* Statistics about available groups */}
              {existingGroupsFilter && existingGroupsFilter !== "custom" && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">إحصائيات المجموعات:</p>
                    <p>
                      • إجمالي المجموعات في {existingGroupsFilter}:{" "}
                      {
                        adminGroups.filter(
                          (g) =>
                            !g.isPlaceholder &&
                            g.educationLevel === existingGroupsFilter,
                        ).length
                      }
                    </p>
                    {(() => {
                      const groupsInLevel = adminGroups.filter(
                        (g) =>
                          !g.isPlaceholder &&
                          g.educationLevel === existingGroupsFilter,
                      );
                      const groupsByGrade: Record<string, number> = {};

                      groupsInLevel.forEach((group) => {
                        if (group.subjectId && teachingModules) {
                          const module = teachingModules.find(
                            (m: any) => m.id === group.subjectId,
                          );
                          if (module) {
                            const grade = module.grade || "غير محدد";
                            groupsByGrade[grade] =
                              (groupsByGrade[grade] || 0) + 1;
                          }
                        }
                      });

                      return Object.entries(groupsByGrade).map(
                        ([grade, count]) => (
                          <p key={grade}>
                            • {grade}: {count} مجموعة
                          </p>
                        ),
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Year Level Filter - Only show for specific education levels */}
              {existingGroupsFilter && existingGroupsFilter !== "custom" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    فلترة حسب السنة الدراسية
                  </label>
                  <select
                    value={selectedYearFilter}
                    onChange={(e) => setSelectedYearFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">جميع السنوات</option>
                    {existingGroupsFilter === "الابتدائي" && (
                      <>
                        <option value="الأولى ابتدائي">الأولى ابتدائي</option>
                        <option value="الثانية ابتدائي">الثانية ابتدائي</option>
                        <option value="الثالثة ابتدائي">الثالثة ابتدائي</option>
                        <option value="الرابعة ابتدائي">الرابعة ابتدائي</option>
                        <option value="الخامسة ابتدائي">الخامسة ابتدائي</option>
                      </>
                    )}
                    {existingGroupsFilter === "المتوسط" && (
                      <>
                        <option value="الأولى متوسط">الأولى متوسط</option>
                        <option value="الثانية متوسط">الثانية متوسط</option>
                        <option value="الثالثة متوسط">الثالثة متوسط</option>
                        <option value="الرابعة متوسط">الرابعة متوسط</option>
                      </>
                    )}
                    {existingGroupsFilter === "الثانوي" && (
                      <>
                        <option value="الأولى ثانوي">الأولى ثانوي</option>
                        <option value="الثانية ثانوي">الثانية ثانوي</option>
                        <option value="الثالثة ثانوي">الثالثة ثانوي</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Groups Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {existingGroupsFilter &&
                  (() => {
                    let filteredGroups = [];

                    // First filter to only show admin-created groups (not placeholders)
                    const adminCreatedGroups = adminGroups.filter(
                      (group) => !group.isPlaceholder,
                    );

                    if (existingGroupsFilter === "custom") {
                      // Show groups based on custom subjects (subjects created by this school)
                      // These are subjects that have a schoolId AND are not part of standard curriculum
                      filteredGroups = adminCreatedGroups.filter((group) => {
                        // Find the teaching module for this group
                        const teachingModule = teachingModules?.find(
                          (module: any) => module.id === group.subjectId,
                        );

                        // A group is "custom" if it's based on a custom subject (teaching module with schoolId)
                        if (!teachingModule || !teachingModule.schoolId)
                          return false;

                        // Check if it's a standard curriculum subject that should appear in education level sections
                        const subjectName = (
                          teachingModule.nameAr ||
                          teachingModule.name ||
                          ""
                        ).toLowerCase();
                        const standardSubjects = [
                          "العربية والرياضيات",
                          "عربية",
                          "رياضيات",
                          "فرنسية",
                          "انجليزية",
                          "علوم",
                          "تاريخ",
                          "جغرافيا",
                          "تربية إسلامية",
                          "فيزياء",
                          "كيمياء",
                          "أحياء",
                        ];

                        // If it's a standard subject, it should appear in the education level section, not custom
                        const isStandardSubject = standardSubjects.some(
                          (standard) =>
                            subjectName.includes(standard.toLowerCase()),
                        );

                        return !isStandardSubject;
                      });
                    } else {
                      // Show admin groups by education level - include ALL groups for that level
                      // regardless of whether they use custom or standard subjects
                      console.log(
                        "DEBUG: Filtering groups for level:",
                        existingGroupsFilter,
                      );
                      console.log(
                        "DEBUG: Available admin groups:",
                        adminCreatedGroups.map((g) => ({
                          id: g.id,
                          name: g.name,
                          educationLevel: g.educationLevel,
                          subjectId: g.subjectId,
                        })),
                      );

                      filteredGroups = adminCreatedGroups.filter((group) => {
                        const matches =
                          group.educationLevel === existingGroupsFilter;
                        console.log(
                          `DEBUG: Group "${group.name}" level "${group.educationLevel}" matches filter "${existingGroupsFilter}":`,
                          matches,
                        );
                        return matches;
                      });

                      // Apply strict year filtering
                      if (selectedYearFilter) {
                        console.log(
                          "DEBUG: Applying year filter:",
                          selectedYearFilter,
                        );
                        console.log(
                          "DEBUG: Groups before year filtering:",
                          filteredGroups.length,
                        );

                        filteredGroups = filteredGroups.filter((group) => {
                          // Check teaching modules grade field for exact match only
                          if (group.subjectId && teachingModules) {
                            const teachingModule = teachingModules.find(
                              (m: any) => m.id === group.subjectId,
                            );
                            if (teachingModule) {
                              const moduleGrade = teachingModule.grade || "";
                              console.log(
                                `DEBUG: Group "${group.name}" has teaching module grade: "${moduleGrade}"`,
                              );

                              // ONLY show groups whose teaching module grade exactly matches the selected year
                              if (
                                moduleGrade.trim() === selectedYearFilter.trim()
                              ) {
                                console.log(
                                  `DEBUG: Exact match found for "${group.name}"`,
                                );
                                return true;
                              }

                              // Handle secondary specializations mapping to 3rd year
                              if (
                                existingGroupsFilter === "الثانوي" &&
                                selectedYearFilter === "الثالثة ثانوي"
                              ) {
                                const moduleGradeLower =
                                  moduleGrade.toLowerCase();
                                const isThirdYearSpec = [
                                  "تسيير واقتصاد",
                                  "علمي",
                                  "أدبي",
                                  "تقني رياضي",
                                  "آداب وفلسفة",
                                  "لغات أجنبية",
                                ].some((spec) =>
                                  moduleGradeLower.includes(spec.toLowerCase()),
                                );

                                if (isThirdYearSpec) {
                                  console.log(
                                    `DEBUG: Secondary specialization match for "${group.name}"`,
                                  );
                                  return true;
                                }
                              }

                              console.log(
                                `DEBUG: No match for "${group.name}" - grade "${moduleGrade}" vs filter "${selectedYearFilter}"`,
                              );
                            } else {
                              console.log(
                                `DEBUG: No teaching module found for group "${group.name}" with subjectId ${group.subjectId}`,
                              );
                            }
                          } else {
                            console.log(
                              `DEBUG: Group "${group.name}" has no subjectId or teachingModules not loaded`,
                            );
                          }

                          return false;
                        });

                        console.log(
                          "DEBUG: Groups after year filtering:",
                          filteredGroups.length,
                        );
                      } else {
                        console.log(
                          "DEBUG: No year filter applied - showing all groups for education level",
                        );
                      }
                    }

                    console.log(
                      "DEBUG: Final filtered groups:",
                      filteredGroups.map((g) => ({
                        id: g.id,
                        name: g.name,
                        educationLevel: g.educationLevel,
                      })),
                    );
                    console.log(
                      "DEBUG: About to render",
                      filteredGroups.length,
                      "groups",
                    );

                    return filteredGroups.length > 0 ? (
                      filteredGroups.map((group) => {
                        // Use the simple level format function
                        const levelDisplay = getSimpleLevelFormat(group);

                        // Get assigned teacher name
                        const getTeacherName = () => {
                          if (group.teacherId && teachers) {
                            const teacher = teachers.find(
                              (t: any) => t.id === group.teacherId,
                            );
                            return teacher ? teacher.name : "غير محدد";
                          }
                          return "غير محدد";
                        };

                        // Get badge color based on education level
                        const getBadgeColor = () => {
                          switch (group.educationLevel) {
                            case "الابتدائي":
                              return "bg-green-100 text-green-800";
                            case "المتوسط":
                              return "bg-blue-100 text-blue-800";
                            case "الثانوي":
                              return "bg-purple-100 text-purple-800";
                            default:
                              return "bg-gray-100 text-gray-800";
                          }
                        };

                        return (
                          <Card
                            key={group.id || group.name}
                            className="border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                {/* Level + Year Badge */}
                                <div className="flex justify-start gap-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${getBadgeColor()}`}
                                  >
                                    {getSimpleLevelFormat(group)}
                                  </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-semibold text-gray-800">
                                  {group.nameAr ||
                                    group.subjectName ||
                                    group.subjectNameAr ||
                                    group.name_ar ||
                                    "مادة غير محددة"}
                                </h3>

                                {/* Teacher */}
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">المعلم:</span>{" "}
                                  {getTeacherName()}
                                </div>

                                {/* Student Count */}
                                <div className="flex items-center text-sm text-gray-600">
                                  <Users className="h-4 w-4 ml-1" />
                                  <span>
                                    {group.studentsAssigned?.length || 0} طالب
                                  </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-2">
                                  <Button
                                    onClick={() =>
                                      handleOpenAssignmentModal(group)
                                    }
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    size="sm"
                                  >
                                    إدارة المجموعة
                                  </Button>

                                  {group.id &&
                                    group.studentsAssigned &&
                                    group.studentsAssigned.length > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full border-green-500 text-green-600 hover:bg-green-50"
                                        onClick={() =>
                                          openGroupManagement(
                                            group,
                                            "attendance",
                                          )
                                        }
                                      >
                                        <Calendar className="w-4 h-4 mr-1" />
                                        الحضور
                                      </Button>
                                    )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <div className="text-gray-500">
                          <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">
                            {existingGroupsFilter === "custom"
                              ? "لا توجد مجموعات مخصصة حالياً"
                              : `لا توجد مجموعات في ${existingGroupsFilter} حالياً`}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>
        )}

        {/* Public Groups are now integrated into the admin section above */}

        {/* Join Group Modal */}
        {showJoinForm && selectedGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  الانضمام إلى {selectedGroup.name}
                </h2>
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    هل تريد الانضمام إلى هذه المجموعة؟
                  </p>
                  <p className="text-sm text-gray-700 mb-4">
                    <strong>الوصف:</strong> {selectedGroup.description}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowJoinForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={joinGroupMutation.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {joinGroupMutation.isPending
                      ? "جاري الانضمام..."
                      : "انضم الآن"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin Assignment Modal */}
        {showAssignmentModal && selectedAdminGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">
                  إدارة تعيينات المجموعة
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignmentModal(false)}
                >
                  إغلاق
                </Button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">تفاصيل المجموعة</h4>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>الاسم:</strong> {selectedAdminGroup.name}
                  </p>
                  <p>
                    <strong>المستوى والسنة:</strong>{" "}
                    {getSimpleLevelFormat(selectedAdminGroup)}
                  </p>
                  <p>
                    <strong>المادة:</strong>{" "}
                    {selectedAdminGroup.nameAr ||
                      selectedAdminGroup.subjectName ||
                      selectedAdminGroup.subjectNameAr ||
                      selectedAdminGroup.name_ar ||
                      "مادة غير محددة"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateAssignments} className="space-y-6">
                {/* Teacher Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختيار المعلم
                  </label>
                  <select
                    value={selectedTeacher || ""}
                    onChange={(e) =>
                      setSelectedTeacher(
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">اختر معلم...</option>
                    {(() => {
                      const filteredTeachers = getFilteredTeachers(
                        selectedAdminGroup.educationLevel,
                        selectedAdminGroup.subjectId,
                      );

                      // If filtered teachers is empty, show all teachers
                      const teachersToShow =
                        filteredTeachers.length > 0
                          ? filteredTeachers
                          : teachers;

                      return teachersToShow.map((teacher) => {
                        const specialization = teacher.specializations.find(
                          (s: any) => s.id === selectedAdminGroup.subjectId,
                        );
                        const specName = specialization?.name || "تخصص عام";
                        return (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} ({specName})
                          </option>
                        );
                      });
                    })()}
                  </select>

                  {/* Debug info - show how many teachers match the filter */}
                  {getFilteredTeachers(
                    selectedAdminGroup.educationLevel,
                    selectedAdminGroup.subjectId,
                  ).length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ لا يوجد معلمين متخصصين في هذه المادة - يظهر جميع
                      المعلمين
                    </p>
                  )}
                </div>

                {/* Student Assignment Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Currently Assigned Students */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الطلاب المسجلين حالياً ({selectedStudents.length})
                    </label>
                    <div className="max-h-60 overflow-y-auto border border-green-300 rounded-md p-2 bg-green-50">
                      {selectedStudents.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          لا يوجد طلاب مسجلين في هذه المجموعة
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {availableStudents
                            .filter((student) =>
                              selectedStudents.includes(student.id),
                            )
                            .map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center space-x-2 p-2 bg-white rounded border border-green-200"
                              >
                                <input
                                  type="checkbox"
                                  checked={true}
                                  onChange={() =>
                                    toggleStudentSelection(student.id)
                                  }
                                  className="mr-2 text-green-600"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-green-800">
                                    {student.name}
                                  </p>
                                  <p className="text-sm text-green-600">
                                    المستوى: {student.educationLevel}
                                    {student.grade && ` - ${student.grade}`}
                                  </p>
                                </div>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  مسجل
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Available Students */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الطلاب المتاحين (
                      {
                        availableStudents.filter(
                          (s) => !selectedStudents.includes(s.id),
                        ).length
                      }
                      )
                    </label>
                    <div className="max-h-60 overflow-y-auto border border-blue-300 rounded-md p-2 bg-blue-50">
                      {availableStudents.filter(
                        (s) => !selectedStudents.includes(s.id),
                      ).length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          جميع الطلاب المتاحين مسجلين بالفعل
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {availableStudents
                            .filter(
                              (student) =>
                                !selectedStudents.includes(student.id),
                            )
                            .map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center space-x-2 p-2 bg-white rounded border hover:bg-blue-50 border-blue-200"
                              >
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() =>
                                    toggleStudentSelection(student.id)
                                  }
                                  className="mr-2 text-blue-600"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-sm text-gray-600">
                                    المستوى: {student.educationLevel}
                                    {student.grade && ` - ${student.grade}`}
                                  </p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                  متاح
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <div>
                    {selectedAdminGroup?.id &&
                      selectedAdminGroup.id !== null && (
                        <Button
                          type="button"
                          onClick={() => handleDeleteGroup(selectedAdminGroup)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          🗑️ حذف المجموعة
                        </Button>
                      )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAssignmentModal(false)}
                      className="mr-2"
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        updateGroupAssignmentsMutation.isPending ||
                        !selectedTeacher
                      }
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updateGroupAssignmentsMutation.isPending
                        ? "جاري التحديث..."
                        : "حفظ التعيينات"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Subject Creation Modal */}
        {showCustomSubjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">إنشاء مادة مخصصة</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCustomSubjectModal(false);
                    // Clear form when closing
                    setCustomSubjectName("");
                    setCustomSubjectNameAr("");
                    setCustomSubjectLevel("");
                    setCustomSubjectGrade("");
                  }}
                >
                  إغلاق
                </Button>
              </div>

              <form onSubmit={handleCreateCustomSubject} className="space-y-4">
                {/* Show info when pre-filled from groups creation */}
                {customSubjectLevel && customSubjectGrade && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      سيتم إنشاء المادة لـ:{" "}
                      <strong>
                        {customSubjectLevel} - {customSubjectGrade}
                      </strong>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المادة (بالإنجليزية) *
                  </label>
                  <input
                    type="text"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Subject Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المادة (بالعربية) *
                  </label>
                  <input
                    type="text"
                    value={customSubjectNameAr}
                    onChange={(e) => setCustomSubjectNameAr(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم المادة"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المستوى التعليمي *
                  </label>
                  <select
                    value={customSubjectLevel}
                    onChange={(e) => setCustomSubjectLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">اختر المستوى...</option>
                    <option value="الابتدائي">الابتدائي</option>
                    <option value="المتوسط">المتوسط</option>
                    <option value="الثانوي">الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السنة الدراسية *
                  </label>
                  <select
                    value={customSubjectGrade}
                    onChange={(e) => setCustomSubjectGrade(e.target.value)}
                    disabled={
                      !customSubjectLevel ||
                      customSubjectLevel === "جميع المستويات"
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  >
                    <option value="">اختر السنة...</option>
                    {customSubjectLevel !== "جميع المستويات" &&
                      getAvailableGrades(customSubjectLevel).map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                  </select>
                  {customSubjectLevel === "جميع المستويات" && (
                    <p className="text-sm text-amber-600 mt-1">
                      💡 لإنشاء مواد لجميع المستويات، قم بإنشاء مادة منفصلة لكل
                      سنة دراسية
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCustomSubjectModal(false);
                      // Clear form when canceling
                      setCustomSubjectName("");
                      setCustomSubjectNameAr("");
                      setCustomSubjectLevel("");
                      setCustomSubjectGrade("");
                    }}
                    className="mr-2"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCustomSubjectMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createCustomSubjectMutation.isPending
                      ? "جاري الإنشاء..."
                      : "إنشاء المادة"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && groupToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-800">
                  تأكيد حذف المجموعة
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  هل أنت متأكد من أنك تريد حذف هذه المجموعة؟
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{groupToDelete.name}</p>
                  <p className="text-sm text-gray-600">
                    {getSimpleLevelFormat(groupToDelete)} -{" "}
                    {groupToDelete.nameAr || groupToDelete.subjectName}
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ سيتم حذف جميع الطلاب المسجلين في هذه المجموعة
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={confirmDeleteGroup}
                  disabled={deleteGroupMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteGroupMutation.isPending
                    ? "جاري الحذف..."
                    : "حذف المجموعة"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Group Management Modal - Attendance */}
        {managementView === "attendance" && managementGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center">
                      <Calendar className="w-5 h-5 ml-2 text-green-600" />
                      إدارة الحضور - {managementGroup.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {managementGroup.description} -{" "}
                      {getSimpleLevelFormat(managementGroup)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeGroupManagement}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {/* DEBUG: Log students assigned data */}
                {console.log('[DEBUG] Students Assigned:', managementGroup.studentsAssigned)}
                {console.log('[DEBUG] Attendance History:', attendanceHistory)}
                
                {managementGroup.studentsAssigned &&
                managementGroup.studentsAssigned.length > 0 ? (
                  <div className="space-y-6">
                    {/* Monthly Carousel Attendance View */}
                    <div className="bg-white rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800">
                          جدول الحضور الشهري - المواعيد المجدولة
                        </h4>

                        {monthKeys.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={goToPreviousMonth}
                              disabled={currentMonthIndex === 0}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium px-3 py-1 bg-blue-50 rounded-lg text-blue-700">
                                {currentMonthKey
                                  ? getMonthDisplayName(currentMonthKey)
                                  : ""}
                              </div>
                              <div className="text-xs text-gray-500">
                                {currentMonthIndex + 1} / {monthKeys.length}
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={goToNextMonth}
                              disabled={
                                currentMonthIndex === monthKeys.length - 1
                              }
                              className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {scheduledDatesData?.dates &&
                      scheduledDatesData.dates.length > 0 ? (
                        monthKeys.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table
                              className="w-full border-collapse border border-gray-300"
                              dir="rtl"
                            >
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-gray-300 p-2 text-right font-medium">
                                    اسم الطالب
                                  </th>
                                  <th className="border border-gray-300 p-2 text-center font-medium min-w-[80px]">
                                    حالة الدفع
                                  </th>
                                  {currentMonthDates.map((date) => (
                                    <th
                                      key={date}
                                      className="border border-gray-300 p-2 text-center font-medium min-w-[80px]"
                                    >
                                      <div className="text-xs">
                                        {new Date(date).toLocaleDateString(
                                          "en-US",
                                          {
                                            day: "numeric",
                                            month: "numeric",
                                          },
                                        )}
                                      </div>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {/* FIXED: Use attendance records to get students with correct userIds, not studentsAssigned */}
                                {Array.from(new Set(attendanceHistory?.map((record: any) => record.userId || record.studentId))).map((uniqueId: any) => {
                                  // Get the attendance record for this unique student
                                  const studentAttendanceRecord = attendanceHistory?.find((record: any) => 
                                    (record.userId || record.studentId) === uniqueId
                                  );
                                  
                                  // Use the student name from attendance record (which uses userId correctly)
                                  const studentName = studentAttendanceRecord?.student?.name || `Student ${uniqueId}`;
                                  
                                  return (
                                    <tr
                                      key={uniqueId}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="border border-gray-300 p-3 font-medium">
                                        <div className="font-medium">
                                          {studentName}
                                        </div>
                                        {/* DEBUG: Show correct student info */}
                                        <div className="text-xs text-red-500 mt-1">
                                          DEBUG: User ID = {studentAttendanceRecord?.userId || 'MISSING'}, Student ID = {studentAttendanceRecord?.studentId}, School ID = {user?.schoolId}
                                        </div>
                                      </td>
                                      <td className="border border-gray-300 p-2 text-center">
                                        {(() => {
                                          const paymentStatus =
                                            getStudentPaymentStatus(uniqueId);

                                          // If it's a virtual record with no payment requirement
                                          if (
                                            paymentStatus?.isVirtual &&
                                            !paymentStatus?.mustPay
                                          ) {
                                            return (
                                              <div className="flex flex-col items-center space-y-1">
                                                <span className="px-2 py-1 rounded text-xs text-gray-500 bg-gray-50">
                                                  {paymentStatus?.paymentNote ||
                                                    "Nothing to pay"}
                                                </span>
                                              </div>
                                            );
                                          }

                                          // Show payment status for actual payment records
                                          if (user?.role === "admin") {
                                            return (
                                              <div className="flex flex-col items-center space-y-1">
                                                <button
                                                  onClick={() =>
                                                    handleTogglePayment(
                                                      student.id,
                                                    )
                                                  }
                                                  className={`px-3 py-1 rounded text-sm font-medium ${
                                                    paymentStatus?.isPaid
                                                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                      : "bg-red-100 text-red-800 hover:bg-red-200"
                                                  }`}
                                                  title={`${paymentStatus?.isPaid ? "مدفوع" : "غير مدفوع"} - اضغط للتغيير`}
                                                >
                                                  {paymentStatus?.isPaid
                                                    ? "✅"
                                                    : "❌"}
                                                </button>
                                                {paymentStatus?.paymentNote && (
                                                  <span className="text-xs text-gray-600">
                                                    {paymentStatus.paymentNote}
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className="flex flex-col items-center space-y-1">
                                                <span
                                                  className={`px-3 py-1 rounded text-sm font-medium ${
                                                    paymentStatus?.isPaid
                                                      ? "bg-green-100 text-green-800"
                                                      : "bg-red-100 text-red-800"
                                                  }`}
                                                >
                                                  {paymentStatus?.isPaid
                                                    ? "✅"
                                                    : "❌"}
                                                </span>
                                                {paymentStatus?.paymentNote && (
                                                  <span className="text-xs text-gray-600">
                                                    {paymentStatus.paymentNote}
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          }
                                        })()}
                                      </td>
                                      {currentMonthDates.map((date) => {
                                        // DEBUG: Log attendance lookup
                                        console.log(`[DEBUG] Looking for attendance: User ID ${uniqueId}, Date ${date}`);
                                        console.log(`[DEBUG] Available attendance records:`, attendanceHistory?.map(r => ({
                                          studentId: r.studentId,
                                          userId: r.userId,
                                          date: r.attendanceDate?.split("T")[0],
                                          student: r.student?.name
                                        })));
                                        
                                        const attendanceRecord =
                                          attendanceHistory.find(
                                            (record: any) =>
                                              (record.userId || record.studentId) === uniqueId &&
                                              record.attendanceDate?.split(
                                                "T",
                                              )[0] === date,
                                          );
                                          
                                        // DEBUG: Log match result
                                        if (attendanceRecord) {
                                          console.log(`[DEBUG] Found attendance record:`, {
                                            studentId: attendanceRecord.studentId,
                                            userId: attendanceRecord.userId,
                                            studentName: attendanceRecord.student?.name,
                                            status: attendanceRecord.status
                                          });
                                        }

                                        return (
                                          <td
                                            key={date}
                                            className="border border-gray-300 p-1 text-center"
                                          >
                                            <button
                                              onClick={() =>
                                                handleTableAttendanceClick(
                                                  uniqueId,
                                                  date,
                                                  attendanceRecord?.status,
                                                )
                                              }
                                              className={`w-8 h-8 rounded text-xs font-bold ${
                                                attendanceRecord?.status ===
                                                "present"
                                                  ? "bg-green-500 text-white hover:bg-green-600"
                                                  : attendanceRecord?.status ===
                                                      "absent"
                                                    ? "bg-red-500 text-white hover:bg-red-600"
                                                    : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                                              }`}
                                              title={`${studentName} - ${date} - ${
                                                attendanceRecord?.status ===
                                                "present"
                                                  ? "حاضر"
                                                  : attendanceRecord?.status ===
                                                      "absent"
                                                    ? "غائب"
                                                    : "غير مسجل"
                                              }`}
                                            >
                                              {attendanceRecord?.status ===
                                              "present"
                                                ? "✓"
                                                : attendanceRecord?.status ===
                                                    "absent"
                                                  ? "✗"
                                                  : "?"}
                                            </button>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>

                            {/* Monthly Statistics */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-green-100 rounded-lg p-3 text-center">
                                <h5 className="font-medium text-green-800">
                                  حضور الشهر
                                </h5>
                                <p className="text-xl font-bold text-green-900">
                                  {Array.isArray(attendanceHistory)
                                    ? attendanceHistory.filter((r: any) => {
                                        const recordDate =
                                          r.attendanceDate?.split("T")[0];
                                        return (
                                          r.status === "present" &&
                                          currentMonthDates.includes(recordDate)
                                        );
                                      }).length
                                    : 0}
                                </p>
                              </div>
                              <div className="bg-red-100 rounded-lg p-3 text-center">
                                <h5 className="font-medium text-red-800">
                                  غياب الشهر
                                </h5>
                                <p className="text-xl font-bold text-red-900">
                                  {Array.isArray(attendanceHistory)
                                    ? attendanceHistory.filter((r: any) => {
                                        const recordDate =
                                          r.attendanceDate?.split("T")[0];
                                        return (
                                          r.status === "absent" &&
                                          currentMonthDates.includes(recordDate)
                                        );
                                      }).length
                                    : 0}
                                </p>
                              </div>
                              <div className="bg-blue-100 rounded-lg p-3 text-center">
                                <h5 className="font-medium text-blue-800">
                                  نسبة حضور الشهر
                                </h5>
                                <p className="text-xl font-bold text-blue-900">
                                  {(() => {
                                    if (!Array.isArray(attendanceHistory))
                                      return 0;
                                    const monthRecords =
                                      attendanceHistory.filter((r: any) => {
                                        const recordDate =
                                          r.attendanceDate?.split("T")[0];
                                        return currentMonthDates.includes(
                                          recordDate,
                                        );
                                      });
                                    const presentCount = monthRecords.filter(
                                      (r: any) => r.status === "present",
                                    ).length;
                                    return monthRecords.length > 0
                                      ? Math.round(
                                          (presentCount / monthRecords.length) *
                                            100,
                                        )
                                      : 0;
                                  })()}
                                  %
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">
                              لا توجد مواعيد مجدولة متاحة
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-600">
                            لا توجد حصص مجدولة لهذه المجموعة
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            يجب ربط المجموعة بجدول الحصص أولاً
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      لا يوجد طلاب مسجلين في هذه المجموعة
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

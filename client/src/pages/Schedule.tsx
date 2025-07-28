import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, Edit2, Trash2, X, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';

interface ScheduleTable {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleCell {
  id: number;
  dayOfWeek: number;
  period: number;
  duration: number;
  startTime?: string;
  endTime?: string;
  educationLevel: string;
  subject: {
    id: number;
    name: string;
    nameAr: string;
    educationLevel: string;
  } | null;
  teacher: {
    id: number;
    name: string;
    gender: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface TeachingModule {
  id: number;
  name: string;
  nameAr: string;
  educationLevel: string;
  grade?: string;
}

interface Teacher {
  id: number;
  name: string;
  gender: string;
  specializations: {
    id: number;
    name: string;
    nameAr: string;
    educationLevel: string;
    grade: string;
  }[];
}

interface Teacher {
  id: number;
  name: string;
  gender: string;
  email: string;
  phone: string;
  role: string;
  specializations: {
    id: number;
    name: string;
    nameAr: string;
    educationLevel: string;
  }[];
}

export default function Schedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showTableForm, setShowTableForm] = useState(false);
  const [showCellForm, setShowCellForm] = useState(false);
  const [editingTable, setEditingTable] = useState<ScheduleTable | null>(null);
  const [editingCell, setEditingCell] = useState<ScheduleCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ day: number; period: number } | null>(null);
  
  // Days of the week (starting with Friday) and time slots (30-minute intervals)
  const daysOfWeek = ['الجمعة', 'السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const timeSlots = [
    { period: 1, time: '8:00', label: '8:00' },
    { period: 2, time: '8:30', label: '8:30' },
    { period: 3, time: '9:00', label: '9:00' },
    { period: 4, time: '9:30', label: '9:30' },
    { period: 5, time: '10:00', label: '10:00' },
    { period: 6, time: '10:30', label: '10:30' },
    { period: 7, time: '11:00', label: '11:00' },
    { period: 8, time: '11:30', label: '11:30' },
    { period: 9, time: '12:00', label: '12:00' },
    { period: 10, time: '12:30', label: '12:30' },
    { period: 11, time: '13:00', label: '13:00' },
    { period: 12, time: '13:30', label: '13:30' },
    { period: 13, time: '14:00', label: '14:00' },
    { period: 14, time: '14:30', label: '14:30' },
    { period: 15, time: '15:00', label: '15:00' },
    { period: 16, time: '15:30', label: '15:30' },
    { period: 17, time: '16:00', label: '16:00' },
    { period: 18, time: '16:30', label: '16:30' },
    { period: 19, time: '17:00', label: '17:00' },
    { period: 20, time: '17:30', label: '17:30' },
    { period: 21, time: '18:00', label: '18:00' },
    { period: 22, time: '18:30', label: '18:30' },
    { period: 23, time: '19:00', label: '19:00' },
    { period: 24, time: '19:30', label: '19:30' },
    { period: 25, time: '20:00', label: '20:00' },
    { period: 26, time: '20:30', label: '20:30' },
    { period: 27, time: '21:00', label: '21:00' },
    { period: 28, time: '21:30', label: '21:30' },
    { period: 29, time: '22:00', label: '22:00' },
    { period: 30, time: '22:30', label: '22:30' },
  ];
  
  // Education levels with detailed grades
  const educationLevels = [
    { 
      level: 'الابتدائي', 
      grades: ['الأولى ابتدائي', 'الثانية ابتدائي', 'الثالثة ابتدائي', 'الرابعة ابتدائي', 'الخامسة ابتدائي']
    },
    { 
      level: 'المتوسط', 
      grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط']
    },
    { 
      level: 'الثانوي', 
      grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي']
    }
  ];
  
  const [tableForm, setTableForm] = useState({ name: '', description: '' });
  const [cellForm, setCellForm] = useState({
    educationLevel: '',
    grade: '',
    gender: '',
    subjectId: '',
    teacherId: '',
    duration: 1,
    day: '',
    period: '',
    startTime: '',
    endTime: ''
  });

  const durationOptions = [
    { value: 1, label: '1.5 ساعة' },
    { value: 2, label: '2 ساعات' },
    { value: 3, label: '3 ساعات' },
    { value: 4, label: '4.5 ساعات' }
  ];

  // Get level colors function
  const getLevelColors = (level: string) => {
    switch (level) {
      case 'الابتدائي':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          badge: 'bg-green-100 text-green-800'
        };
      case 'المتوسط':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'الثانوي':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-800',
          badge: 'bg-purple-100 text-purple-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Fetch schedule tables
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['/api/schedule-tables']
  });

  // Fetch schedule cells for selected table
  const { data: cells = [], isLoading: cellsLoading } = useQuery({
    queryKey: ['/api/schedule-cells', selectedTable],
    enabled: selectedTable !== null
  });

  // Fetch teaching modules
  const { data: modules = [] } = useQuery({
    queryKey: ['/api/teaching-modules']
  });

  // Fetch teachers with specializations
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/teachers-with-specializations']
  });

  // Create schedule table
  const createTableMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating table with data:', data);
      const result = await apiRequest('POST', '/api/schedule-tables', data);
      console.log('Table created successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Table creation successful, refreshing queries...');
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-tables'] });
      queryClient.refetchQueries({ queryKey: ['/api/schedule-tables'] });
      setShowTableForm(false);
      setTableForm({ name: '', description: '' });
      console.log('Modal closed and form reset');
    },
    onError: (error) => {
      console.error('Error creating schedule table:', error);
      alert('حدث خطأ في إنشاء الجدول. تأكد من تسجيل الدخول كمدير.');
    }
  });

  // Update schedule table
  const updateTableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/schedule-tables/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-tables'] });
      setEditingTable(null);
      setTableForm({ name: '', description: '' });
    },
    onError: (error) => {
      console.error('Error updating schedule table:', error);
      alert('حدث خطأ في تحديث الجدول. تأكد من تسجيل الدخول كمدير.');
    }
  });

  // Delete schedule table
  const deleteTableMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/schedule-tables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-tables'] });
      setSelectedTable(null);
    }
  });

  // Create schedule cell
  const createCellMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating cell with data:', data);
      const result = await apiRequest('POST', '/api/schedule-cells', data);
      console.log('Cell created successfully:', result);
      return result;
    },
    onSuccess: () => {
      console.log('Cell creation successful, refreshing queries...');
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-cells', selectedTable] });
      queryClient.refetchQueries({ queryKey: ['/api/schedule-cells', selectedTable] });
      setShowCellForm(false);
      setSelectedCell(null);
      setCellForm({ educationLevel: '', grade: '', gender: '', subjectId: '', teacherId: '', duration: 1, day: '', period: '', startTime: '', endTime: '' });
      console.log('Cell modal closed and form reset');
    },
    onError: (error: any) => {
      console.error('Error creating schedule cell:', error);
      alert('حدث خطأ في إنشاء الحصة: ' + (error.message || 'خطأ غير معروف'));
    }
  });

  // Update schedule cell
  const updateCellMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/schedule-cells/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-cells', selectedTable] });
      setEditingCell(null);
      setCellForm({ educationLevel: '', grade: '', gender: '', subjectId: '', teacherId: '', duration: 1, day: '', period: '', startTime: '', endTime: '' });
    }
  });

  // Delete schedule cell
  const deleteCellMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/schedule-cells/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-cells', selectedTable] });
    }
  });

  // Handle table form submit
  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting table form:', tableForm);
    if (editingTable) {
      updateTableMutation.mutate({ id: editingTable.id, data: tableForm });
    } else {
      createTableMutation.mutate(tableForm);
    }
  };

  // Handle cell form submit
  const handleCellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedTable || !cellForm.educationLevel || !cellForm.subjectId || !cellForm.teacherId || !cellForm.day || !cellForm.startTime || !cellForm.endTime) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    // Auto-calculate period based on start time if not already set
    let period = parseInt(cellForm.period) || 1;
    if (cellForm.startTime) {
      const hour = parseInt(cellForm.startTime.split(':')[0]);
      if (hour >= 8 && hour < 9) period = 1;
      else if (hour >= 9 && hour < 10) period = 2;
      else if (hour >= 10 && hour < 11) period = 3;
      else if (hour >= 11 && hour < 12) period = 4;
      else if (hour >= 12 && hour < 13) period = 5;
      else if (hour >= 13 && hour < 14) period = 6;
      else if (hour >= 14 && hour < 15) period = 7;
      else if (hour >= 15 && hour < 16) period = 8;
      else if (hour >= 16 && hour < 17) period = 9;
      else if (hour >= 17 && hour < 18) period = 10;
      else if (hour >= 18 && hour < 19) period = 11;
      else if (hour >= 19 && hour < 20) period = 12;
      else if (hour >= 20 && hour < 21) period = 13;
      else if (hour >= 21 && hour < 22) period = 14;
      else if (hour >= 22 && hour < 23) period = 15;
    }

    const cellData = {
      scheduleTableId: selectedTable,
      dayOfWeek: parseInt(cellForm.day),
      period: period,
      duration: parseInt(cellForm.duration.toString()),
      startTime: cellForm.startTime || null,
      endTime: cellForm.endTime || null,
      educationLevel: cellForm.educationLevel,
      gender: cellForm.gender || null,
      subjectId: parseInt(cellForm.subjectId),
      teacherId: parseInt(cellForm.teacherId),
    };

    console.log('Submitting cell data:', cellData);

    if (editingCell) {
      updateCellMutation.mutate({ id: editingCell.id, data: cellData });
    } else {
      createCellMutation.mutate(cellData);
    }
  };

  // Get cell at specific day/period
  const getCellAtPosition = (day: number, period: number) => {
    return cells.find(cell => cell.dayOfWeek === day && cell.period === period);
  };

  // Check if cell is occupied by a longer duration cell (horizontally)
  const isCellOccupiedHorizontally = (day: number, period: number) => {
    for (let i = 1; i < period; i++) {
      const previousCell = getCellAtPosition(day, period - i);
      if (previousCell) {
        let actualSpan = 1;
        if (previousCell.startTime && previousCell.endTime) {
          const [startHour, startMin] = previousCell.startTime.split(':').map(Number);
          const [endHour, endMin] = previousCell.endTime.split(':').map(Number);
          const startTotalMin = startHour * 60 + startMin;
          const endTotalMin = endHour * 60 + endMin;
          const durationMin = endTotalMin - startTotalMin;
          
          // Use same logic as the table rendering - based on 30-minute intervals
          actualSpan = Math.max(1, Math.ceil(durationMin / 30)); // Each slot is 30 minutes
          if (durationMin === 90) actualSpan = 3; // 1.5 hours = 3 slots
          else if (durationMin === 120) actualSpan = 4; // 2 hours = 4 slots
          else if (durationMin === 150) actualSpan = 5; // 2.5 hours = 5 slots  
          else if (durationMin === 180) actualSpan = 6; // 3 hours = 6 slots
          else if (durationMin === 210) actualSpan = 7; // 3.5 hours = 7 slots
          else if (durationMin === 240) actualSpan = 8; // 4 hours = 8 slots
          else if (durationMin === 270) actualSpan = 9; // 4.5 hours = 9 slots
        } else {
          actualSpan = previousCell.duration;
        }
        
        if (actualSpan > i) {
          return true;
        }
      }
    }
    return false;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isAdmin ? 'إدارة الجداول الدراسية' : 'الجداول الدراسية'}
        </h2>
        {isAdmin && (
          <Button 
            onClick={() => setShowTableForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            إنشاء جدول جديد
          </Button>
        )}
      </div>

      {/* Schedule Tables List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {tables.map((table: ScheduleTable) => (
          <Card 
            key={table.id} 
            className={`cursor-pointer transition-all ${
              selectedTable === table.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedTable(table.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{table.name}</CardTitle>
                  {table.description && (
                    <p className="text-sm text-gray-600 mt-1">{table.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex space-x-reverse space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTable(table);
                        setTableForm({ name: table.name, description: table.description || '' });
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('هل أنت متأكد من حذف هذا الجدول؟')) {
                          deleteTableMutation.mutate(table.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Schedule Grid */}
      {selectedTable && (
        <Card>
          <CardHeader>
            <CardTitle>
              جدول: {tables.find(t => t.id === selectedTable)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin && (
              <div className="mb-6">
                <Button
                  onClick={() => setShowCellForm(true)}
                  className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0"
                >
                  <div className="flex items-center space-x-reverse space-x-2">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </div>
                    <span className="text-sm tracking-wide">إضافة حصة جديدة</span>
                  </div>
                </Button>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl shadow-2xl border border-gray-200 bg-white">
              <table className="w-full border-collapse">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="border-r border-slate-600 p-4 text-center font-bold text-white w-32 bg-slate-900">
                      <div className="flex items-center justify-center space-x-reverse space-x-2">
                        <Calendar className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm tracking-wide font-bold">اليوم</span>
                      </div>
                    </th>
                    {timeSlots.map((slot, index) => (
                      <th key={slot.period} className="border-r border-slate-600 p-1 text-center font-semibold w-12 min-w-12 bg-slate-900 hover:bg-slate-800 transition-colors duration-300">
                        <div className="flex flex-col items-center space-y-0.5">
                          <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                            <Clock className="w-2 h-2 text-slate-900" />
                          </div>
                          <div className="text-white text-sm font-bold tracking-wide bg-blue-600 px-2 py-1 rounded shadow-md">
                            {slot.label}
                          </div>
                          <div className="text-white text-xs font-bold bg-green-600 px-1 py-0.5 rounded-full shadow-sm">
                            {parseInt(slot.time.split(':')[0]) < 12 ? 'ص' : 'م'}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {daysOfWeek.map((day, dayIndex) => (
                    <tr key={dayIndex} className="hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="border-r border-gray-200 p-2 bg-gray-100 text-center font-bold text-slate-700 shadow-sm">
                        <div className="flex items-center justify-center">
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-bold tracking-wide border border-slate-700">
                            {day}
                          </div>
                        </div>
                      </td>
                      {timeSlots.map((slot) => {
                        const cell = getCellAtPosition(dayIndex, slot.period);
                        const isOccupied = isCellOccupiedHorizontally(dayIndex, slot.period);
                        
                        if (isOccupied) {
                          return null;
                        }
                        
                        if (cell) {
                          const levelColors = getLevelColors(cell.educationLevel);
                          // Calculate actual column span based on start and end times with proper fractional handling
                          let actualColSpan = 1;
                          if (cell.startTime && cell.endTime) {
                            const [startHour, startMin] = cell.startTime.split(':').map(Number);
                            const [endHour, endMin] = cell.endTime.split(':').map(Number);
                            const startTotalMin = startHour * 60 + startMin;
                            const endTotalMin = endHour * 60 + endMin;
                            const durationMin = endTotalMin - startTotalMin;
                            
                            // Convert duration to column spans based on 30-minute intervals
                            // Each 30-minute slot = 1 column, so 90 minutes = 3 columns
                            actualColSpan = Math.max(1, Math.ceil(durationMin / 30)); // Each slot is 30 minutes
                            
                            // For precise durations:
                            if (durationMin === 90) actualColSpan = 3; // 1.5 hours = 3 slots
                            else if (durationMin === 120) actualColSpan = 4; // 2 hours = 4 slots
                            else if (durationMin === 150) actualColSpan = 5; // 2.5 hours = 5 slots  
                            else if (durationMin === 180) actualColSpan = 6; // 3 hours = 6 slots
                            else if (durationMin === 210) actualColSpan = 7; // 3.5 hours = 7 slots
                            else if (durationMin === 240) actualColSpan = 8; // 4 hours = 8 slots
                            else if (durationMin === 270) actualColSpan = 9; // 4.5 hours = 9 slots
                          } else {
                            // Fallback to duration field
                            actualColSpan = cell.duration;
                          }
                          
                          return (
                            <td
                              key={slot.period}
                              className={`border-r border-gray-200 p-1 ${levelColors.bg} relative shadow-sm hover:shadow-md transition-all duration-300 group`}
                              colSpan={actualColSpan}
                            >
                              <div className="relative h-full min-h-[60px] rounded-md p-1 bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm border border-white/30 shadow-inner">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                <div className="relative space-y-1">
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${levelColors.badge} shadow-sm`}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-current mr-1"></div>
                                    <span className="text-xs">{cell.educationLevel}</span>
                                  </div>
                                  
                                  {cell.subject && (
                                    <div className="font-bold text-xs text-gray-800 bg-white/50 px-1 py-0.5 rounded shadow-sm backdrop-blur-sm">
                                      {cell.subject.nameAr}
                                    </div>
                                  )}
                                  
                                  {cell.teacher && (
                                    <div className="text-xs text-gray-700 bg-white/40 px-1 py-0.5 rounded font-medium">
                                      <span className="text-slate-600">
                                        {cell.teacher.gender === 'male' ? '👨‍🏫' : '👩‍🏫'}
                                      </span>
                                      <span className="font-bold ml-1">{cell.teacher.name}</span>
                                    </div>
                                  )}
                                  
                                  {(cell.startTime || cell.endTime) && (
                                    <div className="text-xs text-blue-700 font-bold bg-blue-50/80 px-1 py-0.5 rounded shadow-sm border border-blue-200/50">
                                      <span className="inline-flex items-center">
                                        <Clock className="w-2 h-2 mr-1" />
                                        <span className="text-xs">
                                          {cell.startTime && cell.endTime ? 
                                            `${cell.startTime} - ${cell.endTime}` : 
                                            cell.startTime ? `من ${cell.startTime}` : 
                                            cell.endTime ? `إلى ${cell.endTime}` : ''
                                          }
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {isAdmin && (
                                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 bg-white/80 hover:bg-blue-100 shadow-lg backdrop-blur-sm border border-white/50 rounded-full"
                                    onClick={() => {
                                      setEditingCell(cell);
                                      setCellForm({
                                        educationLevel: cell.educationLevel,
                                        grade: '',
                                        gender: '',
                                        subjectId: cell.subject?.id?.toString() || '',
                                        teacherId: cell.teacher?.id?.toString() || '',
                                        duration: cell.duration,
                                        day: dayIndex.toString(),
                                        period: cell.period.toString(),
                                        startTime: cell.startTime || '',
                                        endTime: cell.endTime || ''
                                      });
                                      setShowCellForm(true);
                                    }}
                                  >
                                    <Edit2 className="w-3 h-3 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 bg-white/80 hover:bg-red-100 shadow-lg backdrop-blur-sm border border-white/50 rounded-full"
                                    onClick={() => {
                                      if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
                                        deleteCellMutation.mutate(cell.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          );
                        }
                        
                        return (
                          <td
                            key={slot.period}
                            className="border-r border-gray-200 p-1 text-center h-16 bg-gradient-to-br from-gray-50/50 to-white hover:from-gray-100/50 hover:to-gray-50 transition-all duration-300 group"
                          >
                            <div className="h-full flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Form Modal - Admin Only */}
      {isAdmin && (showTableForm || editingTable) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingTable ? 'تعديل الجدول' : 'إنشاء جدول جديد'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTableForm(false);
                  setEditingTable(null);
                  setTableForm({ name: '', description: '' });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleTableSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tableName">اسم الجدول</Label>
                <Input
                  id="tableName"
                  value={tableForm.name}
                  onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                  placeholder="مثال: قاعة 1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="tableDescription">الوصف (اختياري)</Label>
                <Input
                  id="tableDescription"
                  value={tableForm.description}
                  onChange={(e) => setTableForm({ ...tableForm, description: e.target.value })}
                  placeholder="وصف الجدول"
                />
              </div>
              
              <div className="flex justify-end space-x-reverse space-x-2">
                <Button 
                  type="submit" 
                  disabled={createTableMutation.isPending || updateTableMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createTableMutation.isPending || updateTableMutation.isPending 
                    ? 'جاري الحفظ...' 
                    : (editingTable ? 'حفظ التغييرات' : 'إنشاء الجدول')
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cell Form Modal - Admin Only */}
      {isAdmin && (showCellForm || editingCell) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingCell ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCellForm(false);
                  setEditingCell(null);
                  setSelectedCell(null);
                  setCellForm({ educationLevel: '', grade: '', gender: '', subjectId: '', teacherId: '', duration: 1, day: '', period: '', startTime: '', endTime: '' });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleCellSubmit} className="space-y-4">
              {/* Day Selection */}
              <div>
                <Label htmlFor="day">اليوم</Label>
                <Select
                  value={cellForm.day}
                  onValueChange={(value) => setCellForm({ ...cellForm, day: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر اليوم" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">وقت البداية</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={cellForm.startTime}
                    onChange={(e) => {
                      const startTime = e.target.value;
                      // Automatically determine period based on start time (30-minute intervals)
                      const [hour, minute] = startTime.split(':').map(Number);
                      const timeSlot = timeSlots.find(slot => {
                        const [slotHour, slotMin] = slot.time.split(':').map(Number);
                        return slotHour === hour && slotMin === minute;
                      });
                      
                      const period = timeSlot ? timeSlot.period : 1;
                      setCellForm({ ...cellForm, startTime, period: period.toString() });
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">وقت النهاية</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={cellForm.endTime}
                    onChange={(e) => {
                      const endTime = e.target.value;
                      // Auto-calculate duration based on start and end times
                      let duration = 1;
                      if (cellForm.startTime && endTime) {
                        const [startHour, startMin] = cellForm.startTime.split(':').map(Number);
                        const [endHour, endMin] = endTime.split(':').map(Number);
                        const startTotalMin = startHour * 60 + startMin;
                        const endTotalMin = endHour * 60 + endMin;
                        const diffMin = endTotalMin - startTotalMin;
                        
                        // Convert to duration options (1=1.5h, 2=2h, 3=3h, 4=4.5h)
                        if (diffMin <= 90) duration = 1;        // 1.5h
                        else if (diffMin <= 120) duration = 2;  // 2h
                        else if (diffMin <= 180) duration = 3;  // 3h
                        else duration = 4;                      // 4.5h
                      }
                      setCellForm({ ...cellForm, endTime, duration });
                    }}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="educationLevel">المستوى التعليمي</Label>
                <Select
                  value={cellForm.educationLevel}
                  onValueChange={(value) => setCellForm({ ...cellForm, educationLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستوى التعليمي" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map((level) => (
                      <SelectItem key={level.level} value={level.level}>
                        {level.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Grade Selection */}
              {cellForm.educationLevel && (
                <div>
                  <Label htmlFor="grade">الصف</Label>
                  <Select
                    value={cellForm.grade}
                    onValueChange={(value) => setCellForm({ ...cellForm, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصف" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels
                        .find(level => level.level === cellForm.educationLevel)
                        ?.grades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Gender Selection for Groups */}
              <div>
                <Label htmlFor="gender">نوع المجموعة</Label>
                <Select
                  value={cellForm.gender}
                  onValueChange={(value) => setCellForm({ ...cellForm, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكور</SelectItem>
                    <SelectItem value="female">إناث</SelectItem>
                    <SelectItem value="mixed">مختلط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subject">المادة</Label>
                <Select
                  value={cellForm.subjectId}
                  onValueChange={(value) => setCellForm({ ...cellForm, subjectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules
                      .filter((module: TeachingModule) => 
                        cellForm.educationLevel === '' || 
                        module.educationLevel === cellForm.educationLevel ||
                        (cellForm.educationLevel === 'الابتدائي' && module.educationLevel === 'Primary') ||
                        (cellForm.educationLevel === 'المتوسط' && module.educationLevel === 'Middle') ||
                        (cellForm.educationLevel === 'الثانوي' && module.educationLevel === 'Secondary')
                      )
                      .map((module: TeachingModule) => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          {module.nameAr}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="teacher">المعلم</Label>
                <Select
                  value={cellForm.teacherId}
                  onValueChange={(value) => setCellForm({ ...cellForm, teacherId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المعلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers
                      .filter((teacher: Teacher) => 
                        cellForm.educationLevel === '' || 
                        teacher.specializations.some(spec => 
                          spec.educationLevel === cellForm.educationLevel ||
                          (cellForm.educationLevel === 'الابتدائي' && spec.educationLevel === 'Primary') ||
                          (cellForm.educationLevel === 'المتوسط' && spec.educationLevel === 'Middle') ||
                          (cellForm.educationLevel === 'الثانوي' && spec.educationLevel === 'Secondary')
                        )
                      )
                      .map((teacher: Teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.gender === 'male' ? 'الأستاذ ' : 'الأستاذة '}{teacher.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Duration is automatically calculated based on start and end times */}
              {cellForm.startTime && cellForm.endTime && (
                <div className="text-sm text-gray-600 text-center p-2 bg-gray-50 rounded">
                  مدة الحصة: {
                    (() => {
                      const [startHour, startMin] = cellForm.startTime.split(':').map(Number);
                      const [endHour, endMin] = cellForm.endTime.split(':').map(Number);
                      const startTotalMin = startHour * 60 + startMin;
                      const endTotalMin = endHour * 60 + endMin;
                      const diffMin = endTotalMin - startTotalMin;
                      const hours = Math.floor(diffMin / 60);
                      const minutes = diffMin % 60;
                      return `${hours > 0 ? hours + ' ساعة' : ''}${minutes > 0 ? (hours > 0 ? ' و ' : '') + minutes + ' دقيقة' : ''}`;
                    })()
                  }
                </div>
              )}
              
              <div className="flex justify-end space-x-reverse space-x-2">
                <Button 
                  type="submit" 
                  disabled={createCellMutation.isPending || updateCellMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createCellMutation.isPending || updateCellMutation.isPending 
                    ? 'جاري الحفظ...' 
                    : (editingCell ? 'حفظ التغييرات' : 'إضافة الحصة')
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
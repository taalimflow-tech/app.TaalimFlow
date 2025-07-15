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
  
  // Days of the week (starting with Friday) and time slots
  const daysOfWeek = ['الجمعة', 'السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const timeSlots = [
    { period: 1, time: '8' },
    { period: 2, time: '9' },
    { period: 3, time: '10' },
    { period: 4, time: '11' },
    { period: 5, time: '12' },
    { period: 6, time: '13' },
    { period: 7, time: '14' },
    { period: 8, time: '15' },
    { period: 9, time: '16' },
    { period: 10, time: '17' },
    { period: 11, time: '18' },
    { period: 12, time: '19' },
    { period: 13, time: '20' },
    { period: 14, time: '21' },
    { period: 15, time: '22' },
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

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/teachers']
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
      setCellForm({ educationLevel: '', grade: '', subjectId: '', teacherId: '', duration: 1, day: '', period: '', startTime: '', endTime: '' });
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
      setCellForm({ educationLevel: '', grade: '', subjectId: '', teacherId: '', duration: 1, day: '', period: '', startTime: '', endTime: '' });
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
          const [startHour] = previousCell.startTime.split(':').map(Number);
          const [endHour] = previousCell.endTime.split(':').map(Number);
          const startPeriod = Math.max(1, startHour - 7);
          const endPeriod = Math.max(1, endHour - 7);
          actualSpan = Math.max(1, endPeriod - startPeriod);
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
              <div className="mb-4">
                <Button
                  onClick={() => setShowCellForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة حصة جديدة
                </Button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 shadow-lg rounded-lg overflow-hidden">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-3 bg-gradient-to-b from-gray-50 to-gray-100 text-center font-bold text-gray-700 w-32">
                      <div className="flex items-center justify-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        اليوم
                      </div>
                    </th>
                    {timeSlots.map((slot) => (
                      <th key={slot.period} className="border border-gray-300 p-2 bg-gradient-to-b from-blue-50 to-blue-100 text-center font-semibold w-28 min-w-28">
                        <div className="flex flex-col items-center space-y-1">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <div className="text-blue-800 text-sm font-bold">
                            {slot.time}:00
                          </div>
                          <div className="text-blue-600 text-xs font-medium">
                            {parseInt(slot.time) < 12 ? 'ص' : 'م'}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daysOfWeek.map((day, dayIndex) => (
                    <tr key={dayIndex}>
                      <td className="border border-gray-300 p-3 bg-gradient-to-l from-gray-50 to-gray-100 text-center font-bold text-gray-700">
                        <div className="flex items-center justify-center">
                          {day}
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
                          // Calculate actual column span based on start and end times
                          let actualColSpan = 1;
                          let leftOffset = 0;
                          let width = 100;
                          
                          if (cell.startTime && cell.endTime) {
                            const [startHour, startMin] = cell.startTime.split(':').map(Number);
                            const [endHour, endMin] = cell.endTime.split(':').map(Number);
                            
                            // Calculate column span based on duration in hours
                            actualColSpan = Math.max(1, endHour - startHour);
                            
                            // Calculate left offset as percentage of hour (0-100%)
                            leftOffset = (startMin / 60) * 100;
                            
                            // Calculate width based on total minutes
                            const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                            const hoursSpanned = actualColSpan;
                            width = (totalMinutes / (hoursSpanned * 60)) * 100;
                          } else {
                            actualColSpan = cell.duration;
                          }
                          
                          return (
                            <td
                              key={slot.period}
                              className={`border border-gray-300 p-0 relative`}
                              colSpan={actualColSpan}
                            >
                              <div 
                                className={`absolute inset-y-0 ${levelColors.bg} border-l-2 border-r-2 border-gray-400`}
                                style={{ 
                                  left: `${leftOffset}%`, 
                                  width: `${width}%`,
                                  minHeight: '4rem'
                                }}
                              >
                                <div className="text-xs space-y-1 p-2">
                                <div className={`inline-block px-2 py-1 rounded text-xs ${levelColors.badge}`}>
                                  {cell.educationLevel}
                                </div>
                                
                                {cell.subject && (
                                  <div className="font-medium">
                                    {cell.subject.nameAr}
                                  </div>
                                )}
                                
                                {cell.teacher && (
                                  <div className="text-gray-600">
                                    {cell.teacher.gender === 'male' ? 'الأستاذ ' : 'الأستاذة '}
                                    {cell.teacher.name}
                                  </div>
                                )}
                                
                                {(cell.startTime || cell.endTime) && (
                                  <div className="text-xs text-blue-600 font-medium">
                                    {cell.startTime && cell.endTime ? 
                                      `${cell.startTime} - ${cell.endTime}` : 
                                      cell.startTime ? `من ${cell.startTime}` : 
                                      cell.endTime ? `إلى ${cell.endTime}` : ''
                                    }
                                  </div>
                                )}
                                </div>
                              </div>
                              
                              {isAdmin && (
                                <div className="absolute top-1 left-1 flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={() => {
                                      setEditingCell(cell);
                                      setCellForm({
                                        educationLevel: cell.educationLevel,
                                        grade: '',
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
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={() => {
                                      if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
                                        deleteCellMutation.mutate(cell.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          );
                        }
                        
                        return (
                          <td
                            key={slot.period}
                            className="border border-gray-300 p-2 text-center h-16"
                          >
                            <div className="text-gray-300">-</div>
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
                  setCellForm({ educationLevel: '', grade: '', subjectId: '', teacherId: '', duration: 1, day: '', period: '', startTime: '', endTime: '' });
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
                      // Automatically determine period based on start time hour
                      const hour = parseInt(startTime.split(':')[0]);
                      // Period mapping: 8:xx = period 1, 9:xx = period 2, etc.
                      const period = Math.max(1, Math.min(15, hour - 7));
                      
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
                        cellForm.educationLevel === '' || module.educationLevel === cellForm.educationLevel
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
                        teacher.specializations.some(spec => spec.educationLevel === cellForm.educationLevel)
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
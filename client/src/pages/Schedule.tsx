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
  
  const [tableForm, setTableForm] = useState({ name: '', description: '' });
  const [cellForm, setCellForm] = useState({
    educationLevel: '',
    subjectId: '',
    teacherId: '',
    duration: 1
  });

  const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];
  const educationLevels = ['الابتدائي', 'المتوسط', 'الثانوي'];
  const durationOptions = [
    { value: 1, label: '1.5 ساعة' },
    { value: 2, label: '3 ساعات' },
    { value: 3, label: '4.5 ساعات' }
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
    queryKey: ['/api/schedule-tables'],
    enabled: user?.role === 'admin'
  });

  // Fetch schedule cells for selected table
  const { data: cells = [], isLoading: cellsLoading } = useQuery({
    queryKey: ['/api/schedule-cells', selectedTable],
    enabled: selectedTable !== null
  });

  // Fetch teaching modules
  const { data: modules = [] } = useQuery({
    queryKey: ['/api/teaching-modules'],
    enabled: user?.role === 'admin'
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: user?.role === 'admin'
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
      setCellForm({ educationLevel: '', subjectId: '', teacherId: '', duration: 1 });
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
      setCellForm({ educationLevel: '', subjectId: '', teacherId: '', duration: 1 });
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
    console.log('Form data before processing:', cellForm);
    console.log('Selected cell:', selectedCell);
    console.log('Selected table:', selectedTable);
    
    // Validation
    if (!cellForm.educationLevel) {
      alert('يرجى اختيار المستوى التعليمي');
      return;
    }
    
    const cellData = {
      scheduleTableId: selectedTable,
      dayOfWeek: selectedCell?.day || editingCell?.dayOfWeek || 0,
      period: selectedCell?.period || editingCell?.period || 1,
      duration: parseInt(cellForm.duration.toString()),
      educationLevel: cellForm.educationLevel,
      subjectId: cellForm.subjectId ? parseInt(cellForm.subjectId) : null,
      teacherId: cellForm.teacherId ? parseInt(cellForm.teacherId) : null,
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

  // Check if cell is occupied by a longer duration cell
  const isCellOccupied = (day: number, period: number) => {
    for (let i = 1; i < period; i++) {
      const previousCell = getCellAtPosition(day, period - i);
      if (previousCell && previousCell.duration > i) {
        return true;
      }
    }
    return false;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">الجداول الدراسية</h3>
          <p className="text-gray-500">هذه الصفحة متاحة للمديرين فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">إدارة الجداول الدراسية</h2>
        <Button 
          onClick={() => setShowTableForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          إنشاء جدول جديد
        </Button>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 bg-gray-50">الحصة</th>
                    {daysOfWeek.map((day, index) => (
                      <th key={index} className="border border-gray-300 p-2 bg-gray-50 min-w-[150px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period}>
                      <td className="border border-gray-300 p-2 bg-gray-50 text-center font-medium">
                        {period}
                      </td>
                      {daysOfWeek.map((day, dayIndex) => {
                        const cell = getCellAtPosition(dayIndex, period);
                        const isOccupied = isCellOccupied(dayIndex, period);
                        
                        if (isOccupied) {
                          return null; // This cell is occupied by a longer duration cell
                        }
                        
                        if (cell) {
                          const levelColors = getLevelColors(cell.educationLevel);
                          return (
                            <td
                              key={dayIndex}
                              className={`border border-gray-300 p-2 ${levelColors.bg} ${levelColors.border} relative`}
                              rowSpan={cell.duration}
                            >
                              <div className="space-y-1">
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${levelColors.badge}`}>
                                  {cell.educationLevel}
                                </div>
                                
                                {cell.subject && (
                                  <div className="font-medium text-sm">
                                    {cell.subject.nameAr}
                                  </div>
                                )}
                                
                                {cell.teacher && (
                                  <div className="text-xs text-gray-600 flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    {cell.teacher.gender === 'male' ? 'الأستاذ ' : 'الأستاذة '}
                                    {cell.teacher.name}
                                  </div>
                                )}
                                
                                {cell.duration > 1 && (
                                  <div className="text-xs text-gray-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {cell.duration === 2 ? '3 ساعات' : '4.5 ساعات'}
                                  </div>
                                )}
                              </div>
                              
                              <div className="absolute top-1 left-1 flex space-x-reverse space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    setEditingCell(cell);
                                    setCellForm({
                                      educationLevel: cell.educationLevel,
                                      subjectId: cell.subject?.id?.toString() || '',
                                      teacherId: cell.teacher?.id?.toString() || '',
                                      duration: cell.duration
                                    });
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
                                      deleteCellMutation.mutate(cell.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          );
                        }
                        
                        return (
                          <td
                            key={dayIndex}
                            className="border border-gray-300 p-2 text-center cursor-pointer hover:bg-gray-50"
                            onClick={() => {
                              setSelectedCell({ day: dayIndex, period });
                              setShowCellForm(true);
                            }}
                          >
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Plus className="w-4 h-4" />
                            </Button>
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

      {/* Table Form Modal */}
      {(showTableForm || editingTable) && (
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

      {/* Cell Form Modal */}
      {(showCellForm || editingCell) && (
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
                  setCellForm({ educationLevel: '', subjectId: '', teacherId: '', duration: 1 });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleCellSubmit} className="space-y-4">
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
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
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
              
              <div>
                <Label htmlFor="duration">مدة الحصة</Label>
                <Select
                  value={cellForm.duration.toString()}
                  onValueChange={(value) => setCellForm({ ...cellForm, duration: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
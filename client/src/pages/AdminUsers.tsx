import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, Mail, Phone, Eye, Send, CheckSquare, Square, Baby, MessageSquare, Calendar, FileText, Plus, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher' | 'user' | 'student';
  createdAt: string;
  children?: Child[];
  student?: Student;
}

interface Child {
  id: number;
  name: string;
  educationLevel: string;
  grade: string;
  parentId: number;
  createdAt: string;
}

interface Student {
  id: number;
  userId: number;
  educationLevel: string;
  grade: string;
  createdAt: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  teacherId: number;
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface TeachingModule {
  id: number;
  name: string;
  nameAr: string;
  educationLevel: string;
  grade?: string;
  description?: string;
}

interface TeacherUser {
  id: number;
  name: string;
  email: string;
  role: string;
  specializations?: TeacherSpecialization[];
}

interface TeacherSpecialization {
  id: number;
  teacherId: number;
  moduleId: number;
  module: TeachingModule;
}

interface FilterState {
  educationLevel: string;
  subject: string;
  assignedTeacher: string;
  role: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingUserMessages, setViewingUserMessages] = useState<Message[]>([]);
  const [showBulkMessage, setShowBulkMessage] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    educationLevel: '',
    subject: '',
    assignedTeacher: '',
    role: ''
  });
  const [bulkMessageData, setBulkMessageData] = useState({
    subject: '',
    content: ''
  });

  // Fetch users with search and filters
  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ['/api/users', searchQuery, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.educationLevel) params.append('educationLevel', filters.educationLevel);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.assignedTeacher) params.append('assignedTeacher', filters.assignedTeacher);
      if (filters.role) params.append('role', filters.role);
      
      const url = `/api/users${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest('GET', url);
      return await response.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch teaching modules for filter dropdown
  const { data: teachingModules = [] } = useQuery<TeachingModule[]>({
    queryKey: ['/api/teaching-modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/teaching-modules');
      return await response.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch teachers for filter dropdown
  const { data: teacherUsers = [] } = useQuery<TeacherUser[]>({
    queryKey: ['/api/teachers-with-specializations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/teachers-with-specializations');
      return await response.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch specific user details
  const fetchUserDetails = async (userId: number) => {
    try {
      const userResponse = await apiRequest('GET', `/api/users/${userId}`);
      const messagesResponse = await apiRequest('GET', `/api/users/${userId}/messages`);
      const userDetails = await userResponse.json();
      const userMessages = await messagesResponse.json();
      setViewingUser(userDetails);
      setViewingUserMessages(userMessages);
    } catch (error) {
      toast({ title: 'خطأ في جلب تفاصيل المستخدم', variant: 'destructive' });
    }
  };

  // Filter handlers
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      educationLevel: '',
      subject: '',
      assignedTeacher: '',
      role: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  // Bulk message mutation
  const bulkMessageMutation = useMutation({
    mutationFn: async (data: { receiverIds: number[], subject: string, content: string }) => {
      const response = await apiRequest('POST', '/api/messages/bulk', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({ title: `تم إرسال ${data.count} رسالة بنجاح` });
      setBulkMessageData({ subject: '', content: '' });
      setShowBulkMessage(false);
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: () => {
      toast({ title: 'خطأ في إرسال الرسائل', variant: 'destructive' });
    }
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  // Handle user selection
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  // Handle bulk message send
  const handleBulkMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      toast({ title: 'يرجى اختيار المستخدمين أولاً', variant: 'destructive' });
      return;
    }
    
    if (!bulkMessageData.subject || !bulkMessageData.content) {
      toast({ title: 'العنوان والمحتوى مطلوبان', variant: 'destructive' });
      return;
    }

    bulkMessageMutation.mutate({
      receiverIds: selectedUsers,
      subject: bulkMessageData.subject,
      content: bulkMessageData.content
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">غير مسموح</h2>
          <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Users className="w-6 h-6" />
                إدارة المستخدمين
              </h1>
              <p className="text-gray-600">عرض وإدارة جميع المستخدمين المسجلين</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/admin/content')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                إدارة المحتوى
              </Button>
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => setShowBulkMessage(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  إرسال رسالة جماعية ({selectedUsers.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث بالاسم أو الإيميل أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="submit"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              بحث
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                showFilters || hasActiveFilters 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              } hover:bg-blue-100`}
            >
              <Filter className="w-4 h-4" />
              فلترة
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </button>
          </form>

          {/* Filter Panel */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الدور
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">جميع الأدوار</option>
                    <option value="admin">مدير</option>
                    <option value="teacher">معلم</option>
                    <option value="student">طالب</option>
                    <option value="user">ولي أمر</option>
                  </select>
                </div>

                {/* Education Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المستوى التعليمي
                  </label>
                  <select
                    value={filters.educationLevel}
                    onChange={(e) => handleFilterChange('educationLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">جميع المستويات</option>
                    <option value="الابتدائي">الابتدائي</option>
                    <option value="المتوسط">المتوسط</option>
                    <option value="الثانوي">الثانوي</option>
                  </select>
                </div>

                {/* Subject Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المادة
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">جميع المواد</option>
                    {teachingModules.map((module) => (
                      <option key={module.id} value={module.id.toString()}>
                        {module.nameAr} ({module.educationLevel})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Teacher Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المعلم المسؤول
                  </label>
                  <select
                    value={filters.assignedTeacher}
                    onChange={(e) => handleFilterChange('assignedTeacher', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">جميع المعلمين</option>
                    {teacherUsers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id.toString()}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                    مسح الفلاتر
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">المستخدمون ({users.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {selectedUsers.length === users.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  تحديد الكل
                </button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">جاري تحميل المستخدمين...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد مستخدمون</h3>
              <p className="text-sm text-gray-500">لم يتم العثور على مستخدمين</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اختيار
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستخدم
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الدور
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ التسجيل
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleUserSelection(user.id)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          {selectedUsers.includes(user.id) ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div className="mr-3">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'student' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'admin' ? 'مدير' : 
                           user.role === 'teacher' ? 'معلم' :
                           user.role === 'student' ? 'طالب' : 'ولي أمر'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => fetchUserDetails(user.id)}
                          className="text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">تفاصيل المستخدم</h2>
                <button
                  onClick={() => setViewingUser(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">المعلومات الشخصية</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">الاسم:</span>
                      <span>{viewingUser.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">الإيميل:</span>
                      <span>{viewingUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">الهاتف:</span>
                      <span>{viewingUser.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">الدور:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        viewingUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                        viewingUser.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                        viewingUser.role === 'student' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {viewingUser.role === 'admin' ? 'مدير' : 
                         viewingUser.role === 'teacher' ? 'معلم' :
                         viewingUser.role === 'student' ? 'طالب' : 'ولي أمر'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">تاريخ التسجيل:</span>
                      <span>{formatDate(viewingUser.createdAt)}</span>
                    </div>
                  </div>
                  
                  {/* Student Education Info */}
                  {viewingUser.role === 'student' && viewingUser.student && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9l-11-6z"/>
                        </svg>
                        المعلومات الدراسية
                      </h4>
                      <div className="bg-purple-50 p-3 rounded">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">المستوى التعليمي:</span>
                          <span>{viewingUser.student.educationLevel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <span className="font-medium">السنة الدراسية:</span>
                          <span>{viewingUser.student.grade}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Children Info */}
                  {viewingUser.children && viewingUser.children.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-1">
                        <Baby className="w-4 h-4" />
                        الأطفال ({viewingUser.children.length})
                      </h4>
                      <div className="space-y-2">
                        {viewingUser.children.map((child) => (
                          <div key={child.id} className="bg-gray-50 p-2 rounded">
                            <div className="font-medium">{child.name}</div>
                            <div className="text-sm text-gray-600">
                              {child.educationLevel} - {child.grade}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Messages */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-1">
                    <MessageSquare className="w-5 h-5" />
                    الرسائل ({viewingUserMessages.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {viewingUserMessages.length === 0 ? (
                      <p className="text-gray-500 text-sm">لا توجد رسائل</p>
                    ) : (
                      viewingUserMessages.map((message) => (
                        <div key={message.id} className="bg-gray-50 p-3 rounded">
                          <div className="font-medium text-sm">{message.subject}</div>
                          <div className="text-xs text-gray-600 mt-1">{message.content}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(message.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Message Modal */}
        {showBulkMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">إرسال رسالة جماعية</h2>
                <button
                  onClick={() => setShowBulkMessage(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  سيتم إرسال الرسالة إلى {selectedUsers.length} مستخدم
                </p>
              </div>
              
              <form onSubmit={handleBulkMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان
                  </label>
                  <input
                    type="text"
                    value={bulkMessageData.subject}
                    onChange={(e) => setBulkMessageData({...bulkMessageData, subject: e.target.value})}
                    placeholder="عنوان الرسالة"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المحتوى
                  </label>
                  <textarea
                    value={bulkMessageData.content}
                    onChange={(e) => setBulkMessageData({...bulkMessageData, content: e.target.value})}
                    placeholder="محتوى الرسالة"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkMessage(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={bulkMessageMutation.isPending}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {bulkMessageMutation.isPending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
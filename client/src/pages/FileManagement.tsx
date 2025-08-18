import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Eye,
  Search,
  Filter,
  FolderPlus,
  FileSpreadsheet
} from 'lucide-react';

interface FileItem {
  id: number;
  name: string;
  originalName: string;
  type: string;
  size: number;
  category: 'documents' | 'images' | 'videos' | 'audio' | 'other';
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  tags?: string[];
}

export default function FileManagement() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Admin access check
  if (!loading && (!user || user.role !== 'admin')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg mb-2">صلاحيات المدير مطلوبة</div>
            <div className="text-gray-600">تحتاج إلى صلاحيات المدير للوصول إلى إدارة الملفات</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch files
  const { data: files = [], isLoading } = useQuery<FileItem[]>({
    queryKey: ['/api/files', searchQuery, selectedCategory],
    enabled: !!user && user.role === 'admin'
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/files/upload', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      toast({
        title: "تم رفع الملفات بنجاح",
        description: "تم رفع جميع الملفات المحددة بنجاح"
      });
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في رفع الملفات",
        description: error.message || "حدث خطأ أثناء رفع الملفات",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      return apiRequest(`/api/files/${fileId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حذف الملف",
        description: "تم حذف الملف بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف الملف",
        description: error.message || "حدث خطأ أثناء حذف الملف",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('category', uploadCategory);

    uploadMutation.mutate(formData);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5 text-red-500" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5 text-green-500" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-5 w-5 text-orange-500" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-5 w-5 text-purple-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-600">جاري تحميل الملفات...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الملفات</h1>
          <p className="text-gray-600 mt-1">رفع وإدارة ملفات المدرسة</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              رفع ملفات جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>رفع ملفات جديدة</DialogTitle>
              <DialogDescription>
                اختر الملفات التي تريد رفعها وحدد التصنيف المناسب
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">التصنيف</label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documents">مستندات</SelectItem>
                    <SelectItem value="images">صور</SelectItem>
                    <SelectItem value="videos">مقاطع فيديو</SelectItem>
                    <SelectItem value="audio">ملفات صوتية</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">اختيار الملفات</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">الملفات المحددة:</label>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? 'جاري الرفع...' : 'رفع الملفات'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="البحث في الملفات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="جميع التصنيفات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التصنيفات</SelectItem>
            <SelectItem value="documents">مستندات</SelectItem>
            <SelectItem value="images">صور</SelectItem>
            <SelectItem value="videos">مقاطع فيديو</SelectItem>
            <SelectItem value="audio">ملفات صوتية</SelectItem>
            <SelectItem value="other">أخرى</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد ملفات</h3>
            <p className="text-gray-600 mb-4">لم يتم العثور على ملفات في هذا التصنيف</p>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              رفع ملف جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.type)}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm truncate">{file.originalName}</CardTitle>
                      <CardDescription className="text-xs">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('ar')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {file.category === 'documents' ? 'مستندات' :
                     file.category === 'images' ? 'صور' :
                     file.category === 'videos' ? 'فيديو' :
                     file.category === 'audio' ? 'صوت' : 'أخرى'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">رُفع بواسطة: {file.uploadedBy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
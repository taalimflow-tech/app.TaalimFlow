import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BlogPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download } from 'lucide-react';

export default function Blog() {
  const { user, loading: authLoading } = useAuth();
  
  const { data: posts = [], isLoading: loading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog-posts'],
    enabled: !!user && !authLoading,
  });

  const handleDownloadAttachment = (attachmentUrl: string, fileName: string) => {
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">المدونة</h2>
      
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.filter(post => post.published).map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), { 
                    addSuffix: true, 
                    locale: ar 
                  })}
                </p>
              </CardHeader>
              <CardContent>
                {post.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title} 
                      className="w-full h-48 object-cover rounded-lg"
                      style={{ aspectRatio: '16/9' }}
                    />
                  </div>
                )}
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                
                {/* File Attachment Section */}
                {post.attachmentUrl && post.attachmentName && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {post.attachmentName}
                          </p>
                          {post.attachmentSize && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(post.attachmentSize / 1024 / 1024).toFixed(2)} ميجابايت
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadAttachment(post.attachmentUrl!, post.attachmentName!)}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        تحميل
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">لا توجد مقالات حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}

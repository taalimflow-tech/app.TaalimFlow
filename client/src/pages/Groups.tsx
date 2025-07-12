import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Group } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: groups = [], isLoading: loading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await apiRequest('POST', '/api/group-registrations', {
        groupId,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم انضمامك للمجموعة بنجاح' });
      setShowJoinForm(false);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ['/api/group-registrations'] });
    },
    onError: () => {
      toast({ title: 'خطأ في الانضمام للمجموعة', variant: 'destructive' });
    }
  });

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroup) {
      joinGroupMutation.mutate(selectedGroup.id);
    }
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">المجموعات التعليمية</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {groups.length > 0 ? (
          groups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <p className="text-sm text-gray-600">{group.category}</p>
              </CardHeader>
              <CardContent>
                {group.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={group.imageUrl} 
                      alt={group.name} 
                      className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                <p className="text-gray-700 mb-4">{group.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    {group.maxMembers && `أقصى عدد: ${group.maxMembers} عضو`}
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowJoinForm(true);
                  }}
                >
                  انضم الآن
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">لا توجد مجموعات حالياً</p>
          </div>
        )}
      </div>

      {/* Join Group Modal */}
      {showJoinForm && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">الانضمام إلى {selectedGroup.name}</h2>
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
                  {joinGroupMutation.isPending ? 'جاري الانضمام...' : 'انضم الآن'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
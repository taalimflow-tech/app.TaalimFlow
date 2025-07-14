import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Formation } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Formations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: formations = [], isLoading: loading } = useQuery<Formation[]>({
    queryKey: ['/api/formations'],
  });

  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const joinFormationMutation = useMutation({
    mutationFn: async (formationId: number) => {
      const response = await apiRequest('POST', '/api/formation-registrations', {
        formationId,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم تسجيلك في التكوين بنجاح' });
      setShowJoinForm(false);
      setSelectedFormation(null);
      queryClient.invalidateQueries({ queryKey: ['/api/formation-registrations'] });
    },
    onError: () => {
      toast({ title: 'خطأ في التسجيل في التكوين', variant: 'destructive' });
    }
  });

  const handleJoinFormation = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFormation) {
      joinFormationMutation.mutate(selectedFormation.id);
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">التكوينات المهنية</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {formations.length > 0 ? (
          formations.map((formation) => (
            <Card key={formation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{formation.title}</CardTitle>
                <p className="text-sm text-gray-600">{formation.category}</p>
              </CardHeader>
              <CardContent>
                {formation.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={formation.imageUrl} 
                      alt={formation.title} 
                      className="w-full h-48 object-cover rounded-lg"
                      style={{ aspectRatio: '16/9' }}
                    />
                  </div>
                )}
                <p className="text-gray-700 mb-4">{formation.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-600">المدة</p>
                    <p className="font-medium">{formation.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">السعر</p>
                    <p className="font-medium text-primary">{formation.price}</p>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                  onClick={() => {
                    setSelectedFormation(formation);
                    setShowJoinForm(true);
                  }}
                >
                  سجل الآن
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">لا توجد تكوينات حالياً</p>
          </div>
        )}
      </div>

      {/* Join Formation Modal */}
      {showJoinForm && selectedFormation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">التسجيل في {selectedFormation.title}</h2>
              <button
                onClick={() => setShowJoinForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleJoinFormation} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  هل تريد التسجيل في هذا التكوين؟
                </p>
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>الوصف:</strong> {selectedFormation.description}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>المدة:</strong> {selectedFormation.duration}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>السعر:</strong> {selectedFormation.price}
                  </p>
                </div>
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
                  disabled={joinFormationMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {joinFormationMutation.isPending ? 'جاري التسجيل...' : 'سجل الآن'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

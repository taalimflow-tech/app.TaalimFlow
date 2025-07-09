import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Formation } from '@/types';

export default function Formations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);

  useEffect(() => {
    const fetchFormations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'formations'));
        const formationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Formation[];
        setFormations(formationsData);
      } catch (error) {
        console.error('Error fetching formations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormations();
  }, []);

  const handleJoinFormation = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement formation registration
    console.log('Joining formation:', selectedFormation?.id);
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
                {formation.imageUrl && (
                  <img 
                    src={formation.imageUrl} 
                    alt={formation.title}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                )}
                <CardTitle>{formation.title}</CardTitle>
                <p className="text-sm text-gray-600">{formation.category}</p>
              </CardHeader>
              <CardContent>
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
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-secondary"
                      onClick={() => setSelectedFormation(formation)}
                    >
                      انضم الآن
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>التسجيل في {formation.title}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleJoinFormation} className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">الاسم الكامل</Label>
                        <Input
                          id="fullName"
                          placeholder="أدخل اسمك الكامل"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">رقم الهاتف</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="أدخل رقم هاتفك"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="أدخل بريدك الإلكتروني"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        تأكيد التسجيل
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">لا توجد تكوينات متاحة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}

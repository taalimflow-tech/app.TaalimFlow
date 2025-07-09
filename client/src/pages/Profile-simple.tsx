import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings, Shield, GraduationCap, Users, Phone, Mail, Save } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">غير مسجل الدخول</h2>
          <p className="text-gray-600">يرجى تسجيل الدخول للوصول إلى الملف الشخصي</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">الملف الشخصي</h1>
          <p className="text-gray-600">إدارة معلومات حسابك الشخصي</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user?.name}</h3>
              <p className="text-gray-600">{user?.email}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                user?.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {user?.role === 'admin' ? 'مدير' : user?.role === 'teacher' ? 'معلم' : 'مستخدم'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="أدخل اسمك الكامل"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="أدخل رقم هاتفك"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'جاري التحديث...' : 'حفظ التغييرات'}
              <Save className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <button 
              onClick={logout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
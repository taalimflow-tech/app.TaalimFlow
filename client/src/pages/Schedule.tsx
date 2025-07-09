import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Schedule() {
  const schedule = [
    {
      subject: 'الرياضيات',
      teacher: 'الأستاذ أحمد محمد',
      time: '9:00 - 10:30',
      room: 'القاعة A1',
      color: 'bg-primary'
    },
    {
      subject: 'اللغة العربية',
      teacher: 'الأستاذة فاطمة علي',
      time: '11:00 - 12:30',
      room: 'القاعة B2',
      color: 'bg-secondary'
    },
    {
      subject: 'العلوم',
      teacher: 'الأستاذ محمد سالم',
      time: '1:00 - 2:30',
      room: 'القاعة C3',
      color: 'bg-green-500'
    },
  ];

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">الجدول الدراسي</h2>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200" 
              alt="خط عربي تعليمي" 
              className="w-full h-32 object-cover rounded-lg mb-4"
            />
            جدول الحصص اليومية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm mb-4">تابع جدولك الدراسي وأوقات الحصص</p>
          
          <div className="space-y-3">
            {schedule.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-reverse space-x-3">
                  <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{item.subject}</p>
                    <p className="text-sm text-gray-600">{item.teacher}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700">{item.time}</p>
                  <p className="text-xs text-gray-500">{item.room}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

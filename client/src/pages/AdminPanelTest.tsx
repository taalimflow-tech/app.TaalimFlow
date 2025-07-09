import { useAuth } from '@/contexts/AuthContext';

export default function AdminPanelTest() {
  const { user } = useAuth();
  
  console.log('AdminPanelTest rendering with user:', user);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel Test</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">User Info:</h2>
        <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
      </div>
      <div className="mt-4 p-4 bg-blue-100 rounded">
        <h2 className="font-semibold mb-2">Route Status:</h2>
        <p>✅ Route matched successfully</p>
        <p>✅ Component is rendering</p>
        <p>Current URL: {window.location.pathname}</p>
      </div>
    </div>
  );
}
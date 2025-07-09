import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-center">مدرستي</h1>
            <p className="text-center text-gray-600 mt-2">منصة التعلم الذكية</p>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

import ChatView from '@/components/ChatView';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <ChatView />
      
      {/* Features Link */}
      <div className="fixed top-4 right-4 z-50">
        <Link 
          href="/features" 
          className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 text-sm font-medium"
        >
          <span className="mr-2">🚀</span>
          T3 Features
        </Link>
      </div>
    </div>
  );
}

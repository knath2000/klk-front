import dynamic from 'next/dynamic';

// Dynamic import for ChatShell to avoid SSR with useAuth
const ChatShell = dynamic(() => import('@/components/ChatShell'), {
  ssr: false
});

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Dynamic background specific to chat */}
      <div className="fixed inset-0 -z-20">
        {/* Chat-specific gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 opacity-80" />
 
        {/* Additional floating orbs for chat */}
        <div
          className="absolute top-40 right-40 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl animate-glass-pulse"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-40 left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-glass-float"
          style={{ animationDelay: '3s' }}
        />
      </div>

      {/* Main chat interface (sidebar for authenticated users) */}
      <ChatShell />
    </div>
  );
}

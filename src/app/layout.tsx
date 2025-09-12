import './globals.css';

export const metadata = {
  title: 'AI Chat with Spanish Slang',
  description: 'Chat app with regional Spanish personas and translation features',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

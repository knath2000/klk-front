'use client';

import { ArrowLeft } from 'lucide-react';
import dynamicFn from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui';

export const dynamic = 'force-dynamic';

const DynamicStackSignIn = dynamicFn(
  () => import('@/components/StackAuthClient').then((mod) => ({ default: mod.StackSignIn })),
  { ssr: false }
);

export default function SignInPage() {
  return (
    <div className="relative min-h-[100svh] h-[100vh] h-[100lvh] px-4 sm:px-6 lg:px-8">
      {/* Decorative background orbs (on-brand, pointer-safe) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      {/* Centered auth panel */}
      <div className="max-w-3xl mx-auto py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <GlassCard
            variant="light"
            size="lg"
            gradient
            className="max-w-md mx-auto w-full text-white/90"
          >
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </Link>
              <div aria-hidden className="text-xs text-white/60">Bienvenido</div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Sign in to your account
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Access chat, translations, and your saved history
              </p>
            </div>

            {/* Auth provider UI (Stack Auth) */}
            <div className="space-y-6">
              {/* Provide a themed context for nested elements */}
              <div className="[&_button]:rounded-lg [&_button]:h-10 [&_button]:text-sm [&_button:hover]:opacity-90 [&_input]:bg-white/5 [&_input]:text-white [&_input]:placeholder-white/50 [&_input]:border-white/10 [&_input]:focus:ring-blue-400/50">
                <DynamicStackSignIn />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
'use client';

import { useState, ReactNode } from 'react';
import TranslatePage from './translate/page';

function Home() {
  // Render the Translate page as the default landing experience for all users.
  return <TranslatePage />;
}

export default Home;

'use client';

import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Perks from '@/components/Perks';
import BestSellers from '@/components/BestSellers';
import QuotesBanner from '@/components/QuotesBanner';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div id="shop">
      <Header />
      <main style={{ paddingBottom: '40px' }}>
        <Hero />
        <Perks />
        <QuotesBanner />
        <BestSellers />
      </main>
      <Footer />
    </div>
  );
}

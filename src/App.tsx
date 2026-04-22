/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";
import { Gallery } from "./components/Gallery";
import { BookingForm } from "./components/BookingForm";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="relative min-h-screen selection:bg-studio-white selection:text-studio-black">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Gallery />
        <BookingForm />
      </main>
      <Footer />
      
      {/* Subtle Noise Texture Overlay for high-end feel */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
}

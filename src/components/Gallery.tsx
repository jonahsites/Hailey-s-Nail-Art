/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

export function Gallery() {
  const images = [
    "https://drive.google.com/thumbnail?id=1ryMvg01P1wCYA5qSambSpQjBzbaQNfl6&sz=w1000",
    "https://drive.google.com/thumbnail?id=1pALNrIUEeRbFcoWtobht-Cu-MmWL8Umu&sz=w1000",
    "https://drive.google.com/thumbnail?id=1X7VFJKTe-dZGaZ2cquZBHkBUq0E-hxTZ&sz=w1000",
    "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600050218447-2483982a9dc6?auto=format&fit=crop&q=80&w=800"
  ];

  return (
    <section id="gallery" className="py-32 px-6 bg-studio-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 text-right">
          <h2 className="serif text-5xl uppercase tracking-tighter">The Vision</h2>
          <p className="cursive text-2xl text-studio-muted">Captured moments of precision</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {images.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative overflow-hidden aspect-[3/4] ${i === 1 || i === 4 ? 'translate-y-12' : ''}`}
            >
              <img 
                src={src} 
                alt={`Nail Art ${i + 1}`} 
                className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 hover:brightness-100 transition-all duration-700 cursor-crosshair"
              />
              <div className="absolute inset-0 border border-studio-white/5 pointer-events-none"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

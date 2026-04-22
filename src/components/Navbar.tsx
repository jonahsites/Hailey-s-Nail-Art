/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Menu, X, Instagram, Calendar } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-studio-black/90 backdrop-blur-sm border-b border-studio-line">
      <div className="max-w-7xl mx-auto px-10 h-24 flex items-center justify-between">
        <a href="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
             <img 
               src="/7C29F567-218E-4A64-B0E3-05FF5472E069.heic" 
               alt="Hailey's Logo" 
               className="w-full h-full object-contain invert"
             />
          </div>
          <span className="serif text-2xl tracking-[1px] hidden sm:block">Hailey's</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-12">
          {["Services", "Gallery", "Our Story", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="uppercase-label text-studio-white/80 hover:text-studio-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-studio-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-0 w-full bg-studio-black border-b border-studio-white/5 p-6 flex flex-col gap-6 md:hidden"
        >
          {["Services", "About", "Gallery", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm uppercase tracking-widest text-studio-muted"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </a>
          ))}
          <a
            href="#booking"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-studio-white text-studio-black text-xs uppercase tracking-widest font-medium"
            onClick={() => setIsOpen(false)}
          >
            <Calendar size={14} />
            Book Now
          </a>
        </motion.div>
      )}
    </nav>
  );
}

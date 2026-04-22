/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-24">
      <div className="max-w-7xl mx-auto px-10 grid md:grid-cols-5 gap-0 items-stretch h-full w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="md:col-span-3 flex flex-col justify-center pr-12 py-20"
        >
          <h1 className="cursive text-[80px] md:text-[110px] leading-[0.9] font-light mb-10">
            The Art of<br />
            <span className="pl-16 md:pl-28 inline-block">Precision.</span>
          </h1>
          <p className="text-lg opacity-80 max-w-[400px] leading-relaxed font-light mb-12">
            Luxury nail artistry tailored to your unique aesthetic. Experience the intersection of elegance and creative expression in our private studio.
          </p>
          <div className="flex gap-8">
            <a 
              href="#booking"
              className="px-10 py-5 bg-studio-white text-studio-black uppercase-label hover:opacity-90 transition-opacity"
            >
              Reserve Session
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="md:col-span-2 relative aspect-[3/4] md:aspect-auto h-full border-l border-studio-line"
        >
          <img 
            src="https://drive.google.com/uc?export=view&id=1sVV_rNsKfPfgtzDI6I_R_OICMEzkMIl0" 
            alt="Minimalist Nail Art"
            className="w-full h-full object-cover grayscale brightness-75 transition-all duration-1000"
          />
        </motion.div>
      </div>
    </section>
  );
}

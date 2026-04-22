/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Instagram, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="bg-studio-black pt-32 pb-12 border-t border-studio-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-16 mb-24">
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 rounded-full border border-studio-white/20 flex items-center justify-center">
                 <span className="cursive text-2xl">H</span>
               </div>
               <span className="serif text-2xl tracking-widest uppercase">Hailey's Studio</span>
            </div>
            <p className="text-studio-muted text-sm max-w-sm leading-loose font-light mb-10">
              Transforming self-care into a curated art form. Located in the heart of the design district, we specialize in monochrome aesthetics and healthy nail integrity.
            </p>
            <div className="flex gap-6">
              <a href="#" className="h-10 w-10 border border-studio-white/10 rounded-full flex items-center justify-center hover:border-studio-white transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="h-10 w-10 border border-studio-white/10 rounded-full flex items-center justify-center hover:border-studio-white transition-colors">
                 <Mail size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="uppercase text-[10px] tracking-[0.2em] font-bold mb-8">Contact</h4>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <MapPin size={16} className="mt-1 opacity-40" />
                <p className="text-xs text-studio-muted leading-relaxed">
                  128 Monochrome Ave,<br />
                  Suite 4, Design District
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <Phone size={16} className="mt-1 opacity-40" />
                <p className="text-xs text-studio-muted">+1 (555) 012-9843</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="uppercase text-[10px] tracking-[0.2em] font-bold mb-8">Hours</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-studio-muted">
                <span>Mon — Thu</span>
                <span>10:00 - 19:00</span>
              </div>
              <div className="flex justify-between text-xs text-studio-muted">
                <span>Fri — Sat</span>
                <span>10:00 - 21:00</span>
              </div>
              <div className="flex justify-between text-xs text-studio-muted border-t border-studio-white/5 pt-2 mt-2">
                <span>Sunday</span>
                <span className="text-white">Studio Closed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-studio-white/5 italic text-[10px] text-studio-muted gap-4">
          <p>© 2026 HAILEY'S NAIL ART STUDIO. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
             <a href="#" className="hover:text-studio-white transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-studio-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

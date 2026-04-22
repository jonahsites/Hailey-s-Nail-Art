/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from "react";
import { SERVICES } from "../constants";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function BookingForm() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setCompleted(true);
    }, 2000);
  };

  if (completed) {
    return (
      <div className="max-w-xl mx-auto p-16 bg-studio-gray border border-studio-line text-center">
        <h3 className="serif text-4xl mb-6">Reservation Confirmed</h3>
        <p className="text-studio-white/60 mb-10 text-lg font-light leading-relaxed">
          Your session is scheduled. We look forward to seeing you in the studio.
        </p>
        <button 
          onClick={() => setCompleted(false)}
          className="uppercase-label border-b border-studio-white pb-2"
        >
          Book another session
        </button>
      </div>
    );
  }

  return (
    <section id="booking" className="py-40 px-10">
      <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-0 border border-studio-line">
        <div className="md:col-span-2 bg-studio-black p-12 flex flex-col justify-center border-r border-studio-line">
          <span className="uppercase-label text-studio-white/40 mb-4 block">Inquiry</span>
          <h2 className="serif text-6xl leading-tight italic">Reserve<br />Your Session.</h2>
        </div>

        <div className="md:col-span-3 bg-studio-gray p-12">
          <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            <div className="border-b border-studio-white/20 pb-4">
              <h3 className="serif text-2xl italic">Select Experience</h3>
            </div>

            <div className="grid gap-6">
              <div className="grid grid-cols-7 gap-2 mb-10">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                   <div key={i} className="text-center text-[10px] opacity-40 py-2">{d}</div>
                ))}
                {[12, 13, 14, 15, 16, 17, 18].map((d, i) => (
                   <div 
                    key={i} 
                    className={`text-center text-xs py-3 cursor-pointer border border-transparent transition-colors ${d === 15 ? 'bg-studio-white text-studio-black' : 'opacity-40 hover:border-studio-white/20'}`}
                    onClick={() => setDate(`2026-04-${d}`)}
                   >
                     {d}
                   </div>
                ))}
              </div>

              <div className="uppercase-label text-[10px] opacity-50 mb-4">Available Times</div>
              <div className="grid grid-cols-2 gap-4">
                {["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={`p-4 text-xs border transition-all ${time === t ? 'bg-studio-white text-studio-black border-studio-white uppercase font-bold' : 'border-studio-white/30 hover:border-studio-white text-studio-white/70'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-studio-white text-studio-black uppercase-label text-sm flex items-center justify-center gap-4 hover:bg-studio-white/90 disabled:opacity-30"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Confirm Booking"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

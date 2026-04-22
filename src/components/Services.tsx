/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SERVICES } from "../constants";
import { motion } from "motion/react";

export function Services() {
  return (
    <section id="services" className="py-32 px-10 border-t border-studio-line">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 items-end">
        <div className="flex-1 border-t border-studio-line-strong pt-6">
          <h3 className="uppercase-label mb-2">Sculpted</h3>
          <p className="serif text-3xl">Structured Gel</p>
        </div>
        <div className="flex-1 border-t border-studio-line-strong pt-6">
          <h3 className="uppercase-label mb-2">Creative</h3>
          <p className="serif text-3xl">Hand-Painted Art</p>
        </div>
        <div className="flex-1 border-t border-studio-line-strong pt-6">
          <h3 className="uppercase-label mb-2">Classic</h3>
          <p className="serif text-3xl">Russian Mani</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-32 grid gap-px bg-studio-line">
        {SERVICES.map((service, index) => (
          <div
            key={service.id}
            className="group bg-studio-black p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-studio-line"
          >
            <div className="flex-1">
              <h3 className="serif text-2xl mb-2">{service.name}</h3>
              <p className="text-studio-white/60 text-sm max-w-xl font-light leading-relaxed">
                {service.description}
              </p>
            </div>
            <div className="text-right min-w-[120px]">
              <p className="text-xl serif italic">{service.price}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import avatar1 from "@/assets/avatar-1.png";
import avatar2 from "@/assets/avatar-2.png";
import avatar3 from "@/assets/avatar-3.png";
import avatar4 from "@/assets/avatar-4.png";
import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { useRef } from "react";

const testimonials = [
  {
    text: "ArthSaarthi helped me move from confusion to clarity. I finally understand where my money is going and why.",
    name: "Aarav Sharma",
    title: "First-Time Investor",
    avatarImg: avatar2,
  },
  {
    text: "The explanations feel human, not technical. Mutual funds and crypto finally make sense without endless YouTube videos.",
    name: "Priya Mehta",
    title: "Finance & Economics Student",
    avatarImg: avatar3,
  },
  {
    text: "Managing stocks, funds, and crypto in one place has made my investment decisions more disciplined and data-driven.",
    name: "Rahul Khanna",
    title: "Product Manager",
    avatarImg: avatar4,
  },
  {
    text: "It doesn’t push products or hype. ArthSaarthi feels like a calm, unbiased guide for long-term Indian investors.",
    name: "Neha Kapoor",
    title: "Founder & Angel Investor",
    avatarImg: avatar1,
  },
];

export const Testimonials = () => {
  const sectionRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const onMouseMove = (e) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const spotlight = useMotionTemplate`
    radial-gradient(350px 350px at ${mouseX}px ${mouseY}px, black, transparent 70%)
  `;

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      onMouseMove={onMouseMove}
      className="relative py-28 overflow-hidden
        bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900"
    >
      {/* GRID BACKGROUND (ALWAYS VISIBLE) */}
      <motion.div
        className="absolute inset-0 opacity-45"
        animate={{ backgroundPositionY: ["0%", "100%"] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(125,211,252,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(125,211,252,0.25) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* GRID HOVER FOCUS (PINK + BLUE) */}
      <motion.div
        className="absolute inset-0 opacity-0 md:opacity-100"
        style={{
          maskImage: spotlight,
          backgroundImage:
            "linear-gradient(to right, rgba(244,114,182,0.65) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(56,189,248,0.65) 1.5px, transparent 1.5px)",
          backgroundSize: "36px 36px",
        }}
      />


      <div className="relative container mx-auto px-4 flex flex-col items-center">

        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white text-center">
          Built for Thoughtful Investors
        </h2>

        <p className="text-sky-200 text-lg max-w-md text-center mt-5">
          Real stories from people using ArthSaarthi to invest with clarity and long-term confidence.
        </p>

        {/* Horizontal motion track */}
        <div
          className="relative w-full mt-16 overflow-hidden
          [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
        >
          <motion.div
            initial={{ x: "-50%" }}
            animate={{ x: "0%" }}
            transition={{
              duration: 45,
              ease: "linear",
              repeat: Infinity,
            }}
            className="flex gap-8 pr-8 will-change-transform"
          >
            {[...testimonials, ...testimonials].map((t, idx) => (
              <motion.div
                key={`${t.name}-${idx}`}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 120, damping: 15 }}
                className="
                  flex-none w-[320px] md:w-[380px]
                  rounded-2xl
                  border border-white/15
                  bg-white/5 backdrop-blur-xl
                  p-7 md:p-9
                  hover:border-sky-400/50
                  hover:shadow-[0_0_40px_rgba(56,189,248,0.18)]
                  transition-all
                "
              >
                <div className="text-sky-400 text-3xl mb-3">“</div>

                <p className="text-white/90 text-base md:text-lg leading-relaxed">
                  {t.text}
                </p>

                <div className="flex items-center gap-4 mt-7">
                  <Image
                    src={t.avatarImg}
                    alt={t.name}
                    className="h-11 w-11 rounded-xl object-cover border border-white/20"
                  />
                  <div>
                    <div className="text-white font-medium">{t.name}</div>
                    <div className="text-sky-300 text-sm">{t.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

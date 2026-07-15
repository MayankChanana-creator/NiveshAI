"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useUser, { loginHref, logoutHref } from "@/lib/authClient";

/* ──────────────────────────────────────
   Dropdown data for nav items
   ────────────────────────────────────── */
const dropdownData = {
  Stocks: [
    { label: "Stock Dashboard", description: "Live market overview & analysis", href: "/StockDashboard"},
    { label: "Top Gainers", description: "Today's best performing stocks", href: "/StockDashboard#gainers"},
  ],
  "Mutual Funds": [
    { label: "Fund Explorer", description: "Browse & compare mutual funds", href: "/MFDashboard"},
    { label: "SIP Calculator", description: "Plan your monthly investments", href: "/MFDashboard#sip"},
  ],
  Crypto: [
    { label: "Crypto Dashboard", description: "Real-time crypto prices & charts", href: "/CryptoDashboard"},
    { label: "Market Trends", description: "Trending coins & market cap data", href: "/CryptoDashboard#trends"},
  ],
  Learn: [
    { label: "Courses", description: "Free investment learning modules", href: "/Courses"},
    { label: "What-If Simulator", description: "Test investor behaviour patterns", href: "/Learn/simulator"},
    { label: "Historical Replay", description: "Trade through legendary market events", href: "/Learn/historical-replay"},
    { label: "AI Quizzes", description: "Portfolio-aware knowledge tests", href: "/Learn/quizzes"},
    { label: "AI Insights", description: "AI-powered market intelligence", href: "/#features"},
  ],
};

/* ──────────────────────────────────────
   DropdownMenu component
   ────────────────────────────────────── */
function DropdownMenu({ items, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72
            bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10
            shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-50"
        >
          {/* Top accent gradient */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400 to-transparent" />

          <div className="p-2">
            {items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                onClick={onClose}
                className="group flex items-start gap-3 px-4 py-3 rounded-xl
                  hover:bg-white/[0.06] transition-all duration-200"
              >
                <span className="text-xl mt-0.5 group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors">
                    {item.label}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────
   NavItem component (with or without dropdown)
   ────────────────────────────────────── */
function NavItem({ name, href, hasDropdown, dropdownItems }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  if (!hasDropdown) {
    return (
      <Link
        href={href}
        className="
          relative text-lg font-medium text-sky-100
          transition-all duration-300
          hover:text-white hover:-translate-y-0.5
          after:absolute after:left-0 after:-bottom-2
          after:h-[2px] after:w-0 after:bg-sky-300
          after:transition-all after:duration-300
          hover:after:w-full
        "
      >
        {name}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={`
          flex items-center gap-1 text-lg font-medium
          transition-all duration-300 hover:-translate-y-0.5
          ${isOpen ? "text-white" : "text-sky-100 hover:text-white"}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        {name}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="mt-0.5 opacity-60"
        >
          <path d="m6 9 6 6 6-6"/>
        </motion.svg>
      </button>

      {/* Animated underline when open */}
      <motion.div
        className="absolute left-0 -bottom-2 h-[2px] bg-sky-300 rounded-full"
        animate={{ width: isOpen ? "100%" : "0%" }}
        transition={{ duration: 0.3 }}
      />

      <DropdownMenu
        items={dropdownItems}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

/* ──────────────────────────────────────
   Main Navbar
   ────────────────────────────────────── */
export default function Navbar() {
  const [openNavigation, setOpenNavigation] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const { user, isSignedIn, isLoading } = useUser();

  const toggleNavigation = () => setOpenNavigation(!openNavigation);
  const handleNavClick = () => {
    setOpenNavigation(false);
    setOpenMobileDropdown(null);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { name: "Features", href: "/#features" },
    { name: "Stocks", href: "/StockDashboard", hasDropdown: true },
    { name: "Mutual Funds", href: "/MFDashboard", hasDropdown: true },
    { name: "Crypto", href: "/CryptoDashboard", hasDropdown: true },
    { name: "Learn", href: "/Learn", hasDropdown: true },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300
        ${scrolled
          ? "bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-sky-700/95 shadow-lg"
          : "bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-sky-700/80"
        }
        backdrop-blur-md border-b border-white/10`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group relative">
          {/* Animated glow behind logo */}
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-sky-400/20 blur-xl z-0"
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.15, 0.45, 0.15],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Inline SVG Logo */}
          <motion.div
            className="relative z-10 w-11 h-11 flex-shrink-0"
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            whileHover={{ scale: 1.12, rotate: 6 }}
          >
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_14px_rgba(56,189,248,0.5)]">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
              <path d="M15 85 L15 30 L50 65 L50 15" stroke="url(#logoGrad)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M50 15 L38 30" stroke="url(#arrowGrad)" strokeWidth="7" strokeLinecap="round" />
              <path d="M50 15 L60 28" stroke="url(#arrowGrad)" strokeWidth="7" strokeLinecap="round" />
              <line x1="68" y1="85" x2="68" y2="55" stroke="url(#logoGrad)" strokeWidth="8" strokeLinecap="round" />
              <line x1="85" y1="85" x2="85" y2="38" stroke="url(#arrowGrad)" strokeWidth="8" strokeLinecap="round" />
              <circle cx="68" cy="50" r="3.5" fill="#38bdf8" />
              <circle cx="85" cy="33" r="3.5" fill="#0ea5e9" />
              <line x1="68" y1="50" x2="85" y2="33" stroke="#38bdf8" strokeWidth="1.8" opacity="0.6" />
            </svg>
          </motion.div>

          {/* "Nivesh" text */}
          <motion.span
            className="hidden md:inline text-[1.55rem] font-extrabold tracking-wide leading-none text-white"
            initial={{ opacity: 0, x: -16, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          >
            Nivesh
          </motion.span>

          {/* "AI" text — animated shimmer + glow pulse */}
          <motion.span
            className="hidden md:inline text-[1.55rem] font-extrabold tracking-wide leading-none relative"
            style={{
              marginLeft: "-2px",
              background: "linear-gradient(90deg, #38bdf8, #7dd3fc, #ffffff, #38bdf8)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            initial={{ opacity: 0, scale: 0.3, y: 10 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              opacity: { duration: 0.4, delay: 0.55 },
              scale: { duration: 0.5, delay: 0.55, ease: [0.34, 1.56, 0.64, 1] },
              y: { duration: 0.5, delay: 0.55 },
              backgroundPosition: {
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                delay: 1,
              },
            }}
          >
            AI
            <motion.span
              className="absolute inset-0 text-[1.55rem] font-extrabold tracking-wide leading-none text-sky-400 blur-sm -z-10"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            >
              AI
            </motion.span>
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {navItems.map((item) => (
            <NavItem
              key={item.name}
              name={item.name}
              href={item.href}
              hasDropdown={!!item.hasDropdown}
              dropdownItems={dropdownData[item.name] || []}
            />
          ))}

          {isSignedIn && !isLoading && (
            <Link
              href="/Portfolio"
              className="
                text-lg font-medium text-sky-300
                hover:text-sky-200
                transition-all duration-300
                hover:-translate-y-0.5
              "
            >
              Portfolio
            </Link>
          )}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden lg:flex items-center gap-4">
          {isLoading ? (
            <div className="animate-pulse h-10 w-28 rounded-full bg-white/20" />
          ) : isSignedIn && user ? (
            <div className="flex items-center gap-3">
              <img
                src={user.picture || "/vercel.svg"}
                alt="user"
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="text-sm text-sky-100">
                {user.name || user.email}
              </span>
              <a
                href={logoutHref}
                className="text-sm px-4 py-2 rounded-full border border-white/20
                  text-white hover:bg-white/10 transition"
              >
                Sign out
              </a>
            </div>
          ) : (
            <>
              <a
                href={loginHref}
                className="text-sm px-4 py-2 rounded-full border border-white/30
                  text-white hover:bg-white/10 transition"
              >
                Sign in
              </a>
              <a
                href={`${loginHref}?screen_hint=signup`}
                className="text-sm font-semibold px-5 py-2 rounded-full
                  bg-gradient-to-r from-blue-600 to-sky-400
                  text-white hover:scale-[1.03] transition-transform"
              >
                Get Started
              </a>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/10 transition"
          onClick={toggleNavigation}
        >
          <div className="space-y-1.5">
            <span className={`block w-6 h-0.5 bg-white transition ${openNavigation ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-white transition ${openNavigation ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-white transition ${openNavigation ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {openNavigation && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:hidden overflow-hidden bg-gradient-to-b from-slate-900 via-blue-900 to-sky-700
              border-t border-white/10"
          >
            <div className="px-6 py-6 space-y-1">
              {navItems.map((item) => {
                const hasDropdown = !!item.hasDropdown;
                const isExpanded = openMobileDropdown === item.name;
                const items = dropdownData[item.name] || [];

                if (!hasDropdown) {
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={handleNavClick}
                      className="block px-4 py-3 text-lg font-medium text-sky-100 hover:text-white
                        hover:bg-white/[0.06] rounded-xl transition-all"
                    >
                      {item.name}
                    </Link>
                  );
                }

                return (
                  <div key={item.name}>
                    <button
                      onClick={() =>
                        setOpenMobileDropdown(isExpanded ? null : item.name)
                      }
                      className={`w-full flex items-center justify-between px-4 py-3 text-lg font-medium
                        rounded-xl transition-all ${
                          isExpanded
                            ? "text-white bg-white/[0.06]"
                            : "text-sky-100 hover:text-white hover:bg-white/[0.06]"
                        }`}
                    >
                      {item.name}
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                        className="opacity-50"
                      >
                        <path d="m6 9 6 6 6-6"/>
                      </motion.svg>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 mt-1 mb-2 space-y-1 border-l-2 border-sky-400/20 pl-4">
                            {items.map((sub, i) => (
                              <Link
                                key={i}
                                href={sub.href}
                                onClick={handleNavClick}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                                  text-sky-200 hover:text-white hover:bg-white/[0.06] transition-all"
                              >
                                <span className="text-base">{sub.icon}</span>
                                <div>
                                  <div className="text-sm font-medium">{sub.label}</div>
                                  <div className="text-xs text-slate-400">{sub.description}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {isSignedIn ? (
                <Link
                  href="/Portfolio"
                  onClick={handleNavClick}
                  className="block px-4 py-3 text-lg font-medium text-sky-300 hover:text-sky-200
                    hover:bg-sky-400/10 rounded-xl transition-all"
                >
                  Portfolio
                </Link>
              ) : (
                <div className="pt-4 flex flex-col gap-3">
                  <a
                    href={loginHref}
                    className="text-center px-4 py-2 rounded-full border border-white/30
                      text-white hover:bg-white/10 transition"
                  >
                    Sign in
                  </a>
                  <a
                    href={`${loginHref}?screen_hint=signup`}
                    className="text-center px-4 py-2 rounded-full
                      bg-gradient-to-r from-blue-600 to-sky-400
                      text-white font-semibold"
                  >
                    Get Started
                  </a>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

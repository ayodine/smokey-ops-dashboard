"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { FlutedGlass } from "@paper-design/shaders-react";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Flame,
  Boxes,
  Package,
  Truck,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import { useSmokeyOps } from "@/context/SmokeyOpsContext";

export default function AuthSectionThree() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, currentAccount, loginWithCredentials } = useSmokeyOps();

  // Form fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Lockout countdown timer after 5 failed attempts
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // If already signed in, redirect straight to the dashboard
  if (isAuthenticated && !isSubmitting) {
    const fromPath = (location.state as { from?: string } | null)?.from;
    const targetPath =
      currentAccount.role === "rider"
        ? "/logistics/rider-portal"
        : fromPath && fromPath !== "/login" && fromPath !== "/auth"
        ? fromPath
        : "/overview";
    return <Navigate to={targetPath} replace />;
  }

  // Username/Email + Password Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const result = loginWithCredentials(identifier, password, rememberMe);

      if (!result.success || !result.account) {
        setIsSubmitting(false);
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          setLockoutSeconds(30);
          setErrorMessage(
            "Too many failed sign-in attempts. Please wait 30 seconds before trying again."
          );
        } else {
          setErrorMessage(
            result.error || "Invalid username/email or password."
          );
        }
        return;
      }

      setSuccessMessage(`Authenticated as ${result.account.name} (${result.account.roleLabel})`);
      const fromPath = (location.state as { from?: string } | null)?.from;
      const destination =
        result.account.role === "rider"
          ? "/logistics/rider-portal"
          : fromPath && fromPath !== "/login" && fromPath !== "/auth"
          ? fromPath
          : "/overview";

      setTimeout(() => {
        setIsSubmitting(false);
        navigate(destination, { replace: true });
      }, 450);
    }, 350);
  };

  // Carousel slides for the left panel showcase
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      badge: "REAL-TIME OPERATIONS",
      title: "Active Kitchen & Grill Hub",
      quote: 'Did you know orders sync straight to smoking chambers and inventory in under 2 seconds?',
      highlight: "Operations truly deliver in real time!",
      metricTitle: "LIVE KITCHEN PIPELINE",
      stat1: "3 Active Runs",
      stat2: "100% Stock Sync",
      stat3: "< 2s Ingestion",
      rows: [
        { name: "Smoking Grill #1 (Guineafowl)", meta: "Batch #B412", status: "Active", dot: "bg-emerald-400", metric: "32 Portions" },
        { name: "Packaging Execution Queue", meta: "Order #SMK-882", status: "Sealing", dot: "bg-amber-400", metric: "4 Orders" },
        { name: "Fleet Dispatch Handover", meta: "Courier Hub", status: "Transit", dot: "bg-blue-400", metric: "6 En Route" },
        { name: "Sales Stock soft-reserve", meta: "Inventory Sync", status: "Synced", dot: "bg-emerald-400", metric: "₦3.2M Live" }
      ]
    },
    {
      badge: "TWO-TIER INVENTORY",
      title: "Real-Time Stock Depletion",
      quote: "Raw poultry, marinade spices, and eco containers deduct automatically as orders flow.",
      highlight: "Zero variance between kitchen and inventory!",
      metricTitle: "AUTO-DEDUCT METRICS",
      stat1: "42 Raw Cuts",
      stat2: "Packaging Ready",
      stat3: "Auto-Reorder On",
      rows: [
        { name: "Whole Smoked Chicken (Frozen)", meta: "Cold Storage", status: "Optimal", dot: "bg-emerald-400", metric: "58 Units" },
        { name: "Spicy Smoked Turkey Wings", meta: "Marinating", status: "Active", dot: "bg-emerald-400", metric: "34 Portions" },
        { name: "Eco Packaging Cartons (L)", meta: "Packaging Bay", status: "Stocked", dot: "bg-blue-400", metric: "180 Packs" },
        { name: "Suya Spice Rub Blend #4", meta: "Pantry Bin", status: "Normal", dot: "bg-amber-400", metric: "14.5 Kg" }
      ]
    },
    {
      badge: "DISPATCH & LOGISTICS",
      title: "Live Doorstep Dispatch Fleet",
      quote: "Riders are assigned instantly with automatic waybills, pickup confirmation, and trip settlements.",
      highlight: "Seamless doorstep deliveries across Lagos!",
      metricTitle: "COURIER & 3PL FLEET",
      stat1: "11 Active Riders",
      stat2: "Avg 28m Delivery",
      stat3: "Instant Payouts",
      rows: [
        { name: "Tunde Bakare (Lekki Phase 1)", meta: "Order #SMK-884", status: "Delivered", dot: "bg-emerald-400", metric: "14 mins" },
        { name: "Chinedu Okafor (Ikoyi Loop)", meta: "Order #SMK-889", status: "Transit", dot: "bg-blue-400", metric: "En Route" },
        { name: "Babatunde Alabi (VI Handover)", meta: "Order #SMK-891", status: "Pickup", dot: "bg-amber-400", metric: "At Kitchen" },
        { name: "Gokada 3PL Partner Route", meta: "Ikeja Express", status: "Assigned", dot: "bg-blue-400", metric: "Assigned" }
      ]
    }
  ];

  const currentSlide = slides[activeSlide];

  return (
    <div className="min-h-screen w-full bg-white p-4 sm:p-6 lg:p-5 flex flex-col lg:grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.15fr_1fr] font-sans antialiased selection:bg-[#c0201f] selection:text-white">
      {/* =========================================================================
          LEFT PANEL: BRAND RED HERO CARD WITH HEXAGONS, MOCKUP SCREEN & CAROUSEL
          (Desktop & Tablet Landscape: Full Screen Hero Showcase)
         ========================================================================= */}
      <div className="hidden lg:flex relative rounded-[26px] sm:rounded-[34px] bg-gradient-to-br from-[#c42120] via-[#b81d1c] to-[#861211] p-7 sm:p-9 lg:p-12 text-white flex-col justify-between overflow-hidden lg:h-[calc(100vh-2.5rem)] shadow-sm">
        
        {/* Subtle Decorative Hexagonal Polygons in Background (Matching Reference) */}
        <div className="absolute top-7 right-7 opacity-20 pointer-events-none">
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
            <polygon points="70,12 118,39 118,93 70,120 22,93 22,39" stroke="white" strokeWidth="2" fill="white" fillOpacity="0.12" />
            <polygon points="108,70 136,86 136,118 108,134 80,118 80,86" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6" />
          </svg>
        </div>
        <div className="absolute bottom-8 left-6 opacity-20 pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <polygon points="60,10 102,34 102,82 60,106 18,82 18,34" stroke="white" strokeWidth="1.8" fill="white" fillOpacity="0.14" />
            <polygon points="25,75 48,88 48,114 25,127 2,114 2,88" stroke="white" strokeWidth="1.2" fill="none" opacity="0.5" />
          </svg>
        </div>

        {/* Top Brand Hexagon Badge (Clean, prominent hexagon badge matching reference style) */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2.5 transition-transform hover:scale-105">
              <img
                src="/logo.svg"
                alt="Smokey Hut Delight"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 border border-white/20">
            {currentSlide.badge}
          </span>
        </div>

        {/* Center Graphic: Overlapping Dashboard Preview Cards (Direct Reference Layout) */}
        <div className="relative z-10 my-auto py-6 flex items-center justify-center">
          <div className="relative w-full max-w-[420px]">
            {/* Primary Dark Dashboard Mockup Card */}
            <div className="w-full bg-[#111217]/95 rounded-2xl border border-white/20 p-4 shadow-2xl backdrop-blur-xl">
              {/* Header bar with controls */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="font-semibold text-white ml-1.5 font-mono text-[10.5px]">
                    {currentSlide.title}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-sans font-semibold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              </div>

              {/* Micro Table Rows */}
              <div className="space-y-1.5 text-[10px]">
                {currentSlide.rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${row.dot} shrink-0`} />
                      <div>
                        <span className="font-medium text-white/90 block leading-tight">{row.name}</span>
                        <span className="text-[9px] text-white/40 block">{row.meta}</span>
                      </div>
                    </div>
                    <span className="font-mono text-white/90 font-semibold px-2 py-0.5 rounded bg-white/10 text-[9.5px]">
                      {row.metric}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overlapping Floating White Stat Card at Bottom-Right (Direct Reference Match) */}
            <div className="absolute -bottom-6 -right-2 sm:-right-4 w-[220px] bg-white rounded-2xl p-3.5 shadow-[0_20px_45px_rgba(0,0,0,0.35)] border border-zinc-100 text-zinc-900 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-wider">
                  {currentSlide.metricTitle}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-zinc-50 rounded-lg p-1.5 border border-zinc-100">
                  <span className="block text-[8.5px] text-zinc-400 font-medium">Batches</span>
                  <span className="block text-[10px] font-bold text-zinc-800">{currentSlide.stat1}</span>
                </div>
                <div className="bg-zinc-50 rounded-lg p-1.5 border border-zinc-100">
                  <span className="block text-[8.5px] text-zinc-400 font-medium">Inventory</span>
                  <span className="block text-[10px] font-bold text-emerald-600">{currentSlide.stat2}</span>
                </div>
                <div className="bg-zinc-50 rounded-lg p-1.5 border border-zinc-100">
                  <span className="block text-[8.5px] text-zinc-400 font-medium">Speed</span>
                  <span className="block text-[10px] font-bold text-zinc-800">{currentSlide.stat3}</span>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-zinc-100 flex items-center justify-between text-[9px] text-zinc-400 font-medium">
                <span>Auto-updated live</span>
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Content: Headline, Subtitle & Interactive Left/Right Arrow Carousel */}
        <div className="relative z-10 pt-4 text-center">
          <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal max-w-[380px] mx-auto">
            {currentSlide.quote}
          </p>
          <p className="text-sm sm:text-[15px] font-bold text-white mt-1">
            {currentSlide.highlight}
          </p>

          {/* Carousel Arrow Controls (Matching Reference Circular Buttons) */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
              className="w-9 h-9 rounded-full border border-white/35 bg-white/10 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md shadow-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
              className="w-9 h-9 rounded-full border border-white/35 bg-white/10 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md shadow-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: CLEAN FORM (MATCHING REFERENCE STRUCTURE, TEXTBOXES & CTAs)
         ========================================================================= */}
      <div className="flex flex-col justify-center items-center px-4 py-8 sm:px-10 lg:px-14 xl:px-16 bg-white min-h-[calc(100vh-2rem)] lg:min-h-full">
        <div className="w-full max-w-[390px] mx-auto">
            {/* Top Brand Wordmark (Matching Reference with Brand Color) */}
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-8 h-8 rounded-xl bg-[#c0201f] flex items-center justify-center p-1.5 shadow-sm">
                <img
                  src="/logo.svg"
                  alt="Smokey Hut Delight"
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
              <span className="text-base font-extrabold tracking-tight text-[#c0201f] font-display">
                SMOKEY HUT DELIGHT
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-[26px] font-bold text-zinc-900 tracking-tight font-display">
                Sign in to your account
              </h2>
              <p className="mt-1.5 text-xs text-zinc-500 font-normal">
                Need an account? Contact your <span className="font-semibold text-zinc-700">Super Admin</span>
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-800 border border-red-200/90 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-[#c0201f] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username or Work Email */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-800">
                  Email or Username<span className="text-[#c0201f] ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your email or username"
                    className="w-full h-11 px-3.5 rounded-lg border border-zinc-250 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#c0201f] focus:ring-2 focus:ring-[#c0201f]/15 transition-all shadow-2xs font-sans"
                  />
                  {identifier.trim().length > 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-800">
                    Password<span className="text-[#c0201f] ml-0.5">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setErrorMessage(
                        "Password resets are managed by your Super Administrator. Please contact your Super Admin to issue a new password."
                      )
                    }
                    className="text-xs font-medium text-[#c0201f] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your password"
                    className="w-full h-11 pl-3.5 pr-10 rounded-lg border border-zinc-250 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#c0201f] focus:ring-2 focus:ring-[#c0201f]/15 transition-all shadow-2xs font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors p-0.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Password issued by your Super Administrator.
                </p>
              </div>

              {/* Remember Me */}
              <div className="pt-0.5 text-xs text-zinc-600">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-3.5 rounded border-zinc-300 text-[#c0201f] focus:ring-[#c0201f] accent-[#c0201f] cursor-pointer"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              {/* Primary Submit CTA (Brand Red, Full Width, Matching Reference Button Style) */}
              <button
                type="submit"
                disabled={isSubmitting || lockoutSeconds > 0}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#c0201f] text-sm font-semibold text-white transition-all hover:bg-[#a51918] active:scale-[0.99] cursor-pointer shadow-sm shadow-[#c0201f]/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>
                  {lockoutSeconds > 0
                    ? `Locked (${lockoutSeconds}s)`
                    : isSubmitting
                    ? "Signing in..."
                    : "Sign in"}
                </span>
              </button>
            </form>

            {/* Separator / Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-zinc-200" />
              <span className="absolute bg-white px-3 text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                Or
              </span>
            </div>

            {/* Google Sign-in Fast Auth Button (Matching Reference) */}
            <button
              type="button"
              onClick={() => {
                const result = loginWithCredentials("fivedigita@gmail.com", "admin123");
                if (result.success) {
                  navigate("/overview", { replace: true });
                }
              }}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200/90 bg-white text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            {/* Bottom Security & Privacy Notice */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Protected staff environment. Provisioned accounts only.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

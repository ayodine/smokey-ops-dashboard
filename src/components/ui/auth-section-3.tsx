"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Flame,
  Boxes,
  Truck
} from "lucide-react";
import { useSmokeyOps } from "@/context/SmokeyOpsContext";
import { MetricCard } from "@/components/ui/MetricCard";

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

  // Carousel slides showcasing real dashboard metrics and operations
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      badge: "KITCHEN & SMOKING RUNS",
      metricTitle1: "Smoking Grill Batches",
      metricVal1: "3 Active Runs",
      metricDelta1: { value: "100% Sync", isPositive: true },
      sparkline1: "dense" as const,
      metricTitle2: "Fulfillment Hit Rate",
      metricVal2: "98.20%",
      metricDelta2: { value: "+2.4%", isPositive: true },
      sparkline2: "wave" as const,
      mainMetricTitle: "Live Operations Control Center",
      mainMetricValue: "32 Portions In Pit",
      mainMetricDelta: { value: "< 2s Ingestion", isPositive: true },
      mainSparkline: "spikes" as const,
      mainSubtext: "Guineafowl & Turkey smoking chambers synchronized with kitchen inventory.",
      quote: "Did you know orders sync straight to smoking chambers and inventory in under 2 seconds?",
      highlight: "Operations truly deliver in real time!"
    },
    {
      badge: "TWO-TIER INVENTORY",
      metricTitle1: "Stock Valuation Requests",
      metricVal1: "₦3,240,000",
      metricDelta1: { value: "+4.8%", isPositive: true },
      sparkline1: "wave" as const,
      metricTitle2: "Critical Stockout Errors",
      metricVal2: "0 Errors",
      metricDelta2: { value: "Optimal", isPositive: true },
      sparkline2: "flat" as const,
      mainMetricTitle: "Raw Cuts & Packaging Depletion",
      mainMetricValue: "42 Raw Cuts Monitored",
      mainMetricDelta: { value: "Auto-Reorder Active", isPositive: true },
      mainSparkline: "wave" as const,
      mainSubtext: "Spices, poultry, and eco containers deduct automatically on dispatch.",
      quote: "Raw poultry, marinade spices, and eco containers deduct automatically as orders flow.",
      highlight: "Zero variance between kitchen and inventory!"
    },
    {
      badge: "FLEET & DISPATCH",
      metricTitle1: "Active Courier Fleet",
      metricVal1: "11 Active Riders",
      metricDelta1: { value: "Lagos Hubs", isPositive: true },
      sparkline1: "dense" as const,
      metricTitle2: "Average Delivery Time",
      metricVal2: "28 min",
      metricDelta2: { value: "-4.2 min", isPositive: true },
      sparkline2: "spikes" as const,
      mainMetricTitle: "Doorstep Handover & Payouts",
      mainMetricValue: "100% Reconciled",
      mainMetricDelta: { value: "Instant Waybills", isPositive: true },
      mainSparkline: "wave" as const,
      mainSubtext: "Real-time rider assignment with automatic courier fees and proof of delivery.",
      quote: "Riders are assigned instantly with automatic waybills, pickup confirmation, and trip settlements.",
      highlight: "Seamless doorstep deliveries across Lagos!"
    }
  ];

  const currentSlide = slides[activeSlide];

  return (
    <div className="min-h-screen w-full bg-white p-4 sm:p-6 lg:p-5 flex flex-col lg:grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.15fr_1fr] font-sans antialiased selection:bg-[#c0201f] selection:text-white">
      {/* =========================================================================
          LEFT PANEL: BRAND RED HERO CARD WITH REAL DASHBOARD METRIC COMPONENTS
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

        {/* Center Graphic: Actual MetricCard Components from Dashboard */}
        <div className="relative z-10 my-auto py-5 flex items-center justify-center">
          <div className="w-full max-w-[430px] space-y-3">
            {/* Top Row: 2 Actual MetricCard Components from Dashboard */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                title={currentSlide.metricTitle1}
                value={currentSlide.metricVal1}
                delta={currentSlide.metricDelta1}
                sparklineType={currentSlide.sparkline1}
                className="bg-white/95 backdrop-blur-md shadow-xl text-zinc-900 border-0 rounded-2xl ring-0 p-3.5"
              />
              <MetricCard
                title={currentSlide.metricTitle2}
                value={currentSlide.metricVal2}
                delta={currentSlide.metricDelta2}
                sparklineType={currentSlide.sparkline2}
                className="bg-white/95 backdrop-blur-md shadow-xl text-zinc-900 border-0 rounded-2xl ring-0 p-3.5"
              />
            </div>

            {/* Bottom Row: Main Focus MetricCard Component from Dashboard */}
            <MetricCard
              title={currentSlide.mainMetricTitle}
              value={currentSlide.mainMetricValue}
              delta={currentSlide.mainMetricDelta}
              sparklineType={currentSlide.mainSparkline}
              subtext={currentSlide.mainSubtext}
              className="bg-white/95 backdrop-blur-md shadow-xl text-zinc-900 border-0 rounded-2xl ring-0 p-4"
            />
          </div>
        </div>

        {/* Bottom Content: Headline, Subtitle & Interactive Left/Right Arrow Carousel */}
        <div className="relative z-10 pt-4 text-center">
          <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal max-w-[380px] mx-auto">
            “{currentSlide.quote}”
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
          RIGHT PANEL: CLEAN FORM (NO LOGO/WORDMARK, CLEAN INPUTS, NO GOOGLE AUTH)
         ========================================================================= */}
      <div className="flex flex-col justify-center items-center px-4 py-8 sm:px-10 lg:px-14 xl:px-16 bg-white min-h-[calc(100vh-2rem)] lg:min-h-full">
        <div className="w-full max-w-[390px] mx-auto">
          {/* Title & Subtitle (No logo or wordmark above) */}
          <div className="mb-7 text-left">
            <h2 className="text-2xl sm:text-[28px] font-bold text-zinc-900 tracking-tight font-display">
              Sign in to your account
            </h2>
            <p className="mt-1.5 text-xs sm:text-[13px] text-zinc-500 font-normal">
              Need an account? Contact your <span className="font-semibold text-zinc-800">Administrator</span>
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
              <label className="block text-xs font-semibold text-zinc-800">
                Email or Username <span className="text-[#c0201f]">*</span>
              </label>
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
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#c0201f] focus:ring-2 focus:ring-[#c0201f]/15 transition-all shadow-xs"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-800">
                  Password <span className="text-[#c0201f]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setErrorMessage(
                      "Password resets are managed by your Administrator. Please contact your Administrator to issue a new password."
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
                  className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#c0201f] focus:ring-2 focus:ring-[#c0201f]/15 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Password issued by your Administrator.
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

            {/* Primary Submit CTA (Brand Red, Full Width) */}
            <button
              type="submit"
              disabled={isSubmitting || lockoutSeconds > 0}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#c0201f] text-sm font-semibold text-white transition-all hover:bg-[#a51918] active:scale-[0.99] cursor-pointer shadow-sm shadow-[#c0201f]/20 disabled:opacity-60 disabled:cursor-not-allowed"
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

          {/* Bottom Security & Privacy Notice */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>Protected staff environment. Provisioned by an Administrator.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

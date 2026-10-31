"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck
} from "lucide-react";
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

  // Operational Highlights Carousel for Left Column
  const [activeHighlight, setActiveHighlight] = useState(0);
  const highlights = [
    {
      quote:
        "Orders sync directly to our kitchen grills, packaging queue, and logistics in real time. Kitchen execution has never been faster.",
      tag: "Kitchen & Order Execution"
    },
    {
      quote:
        "Real-time inventory tracking ensures our Full Smokey Guineafowl, marinades, and packaging deduct accurately with zero stock variance.",
      tag: "Real-Time Inventory Sync"
    },
    {
      quote:
        "Automated waybills and instant rider dispatch get freshly grilled orders delivered to customers across Lagos on time, every time.",
      tag: "Logistics & Doorstep Delivery"
    }
  ];

  // Auto-cycle highlights every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % highlights.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [highlights.length]);

  return (
    <div className="min-h-screen w-full bg-white p-4 sm:p-6 lg:p-5 flex flex-col lg:grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.15fr_1fr] font-sans antialiased selection:bg-[#c0201f] selection:text-white">
      {/* =========================================================================
          LEFT PANEL: OPERATIONAL HERO PHOTO CARD (Matching Reference Layout)
          (Desktop & Tablet Landscape: Full Screen Showcase)
         ========================================================================= */}
      <div className="hidden lg:flex relative rounded-[26px] sm:rounded-[34px] overflow-hidden lg:h-[calc(100vh-2.5rem)] shadow-xl bg-zinc-950 select-none group">
        {/* Background Operational Smokehouse Photo */}
        <img
          src="/operations-hero.jpg"
          alt="Smokey Hut Delight Smokehouse Operations"
          className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-[1.03]"
        />

        {/* Ambient Dark Gradient Overlay for optimal readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />

        {/* Top Operational Pill Badge */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center p-2 backdrop-blur-sm">
            <img
              src="/logo.svg"
              alt="Smokey Hut Delight"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="px-3.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white/90 text-[11px] font-semibold tracking-wider uppercase border border-white/20">
            {highlights[activeHighlight].tag}
          </span>
        </div>

        {/* Bottom Highlights Overlay Content */}
        <div className="absolute inset-x-0 bottom-0 p-8 sm:p-10 lg:p-12 z-10 flex flex-col justify-end text-white select-none">
          {/* 5 Golden Stars */}
          <div className="flex items-center gap-1 mb-3.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className="w-4 h-4 fill-amber-400 text-amber-400"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>

          {/* Operational Copy / Quote */}
          <blockquote className="text-xl sm:text-[23px] lg:text-[25px] font-bold text-white leading-snug tracking-tight max-w-[480px] font-display transition-all duration-300">
            “{highlights[activeHighlight].quote}”
          </blockquote>

          {/* Operational Brand & Pagination Pill Dots (No staff name attribution) */}
          <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-semibold text-white/95 tracking-wide">
                Operations Control Platform
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                Kitchen, Inventory &amp; Logistics
              </p>
            </div>

            {/* Pagination Indicators: Active elongated pill + inactive dots (Direct reference match) */}
            <div className="flex items-center gap-1.5 pb-1">
              {highlights.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveHighlight(idx)}
                  className={`transition-all duration-300 cursor-pointer h-1.5 rounded-full ${
                    activeHighlight === idx
                      ? "w-6 bg-white shadow-xs"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
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

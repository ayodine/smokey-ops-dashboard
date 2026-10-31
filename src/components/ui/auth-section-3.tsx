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
  Check
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

  return (
    <div className="min-h-screen bg-[#1c1c1e] p-4 sm:p-8 md:p-12 flex items-center justify-center font-sans antialiased selection:bg-[#c0201f] selection:text-white">
      {/* Outer Floating Rounded Container with Large Corner Radius and Subtle Shadow */}
      <div className="w-full max-w-[1140px] bg-white rounded-[36px] sm:rounded-[44px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.45)] grid grid-cols-1 lg:grid-cols-[1.12fr_1fr] p-3 sm:p-4">
        
        {/* =========================================================================
            LEFT PANEL: BRAND GRADIENT HERO CARD WITH PILL, HEADINGS & STEP CARDS
           ========================================================================= */}
        <div className="relative rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-[#c0201f] via-[#b01c1c] to-[#7f1111] p-8 sm:p-12 lg:p-14 text-white flex flex-col justify-between overflow-hidden min-h-[580px] lg:min-h-[660px]">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-b from-white/15 to-transparent rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-black/25 rounded-full blur-[70px] pointer-events-none -ml-16 -mb-16" />

          {/* Top Brand Header: Logo + Brand Name */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center p-1.5 shadow-sm">
              <img
                src="/logo.svg"
                alt="Smokey Hut Delight"
                className="w-full h-full object-contain drop-shadow-xs"
              />
            </div>
            <span className="text-base font-bold tracking-tight text-white font-display">
              smokey hut delight
            </span>
          </div>

          {/* Center Content: Pill, Big Bold Headline & Subtitle */}
          <div className="relative z-10 my-auto py-10 lg:py-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/95 mb-5 shadow-xs">
              <span>Operations Portal</span>
              <span className="text-sm">🔥</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.12] font-display">
              Start your Shift
            </h1>

            <p className="mt-3.5 text-sm sm:text-[15px] text-white/80 max-w-[420px] leading-relaxed font-normal">
              Sign in to manage kitchen batches, raw inventory, order packaging, and live dispatch deliveries.
            </p>
          </div>

          {/* Bottom Row: 3 Modular Step / Feature Cards (Matching Reference Layout) */}
          <div className="relative z-10 grid grid-cols-3 gap-2.5 sm:gap-3 pt-4">
            {/* Step 1: Active Card (Solid White with Brand Red Badge) */}
            <div className="rounded-[22px] bg-white p-4 text-zinc-900 shadow-md flex flex-col justify-between min-h-[110px]">
              <div className="w-6 h-6 rounded-full bg-[#c0201f] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                1
              </div>
              <div className="text-[12.5px] font-semibold leading-tight text-zinc-900 pt-3">
                Sign in with credentials
              </div>
            </div>

            {/* Step 2: Frosted Glass Card */}
            <div className="rounded-[22px] bg-white/15 backdrop-blur-md border border-white/20 p-4 text-white flex flex-col justify-between min-h-[110px]">
              <div className="w-6 h-6 rounded-full bg-white/25 text-white/90 flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <div className="text-[12px] font-medium leading-tight text-white/90 pt-3">
                Review assigned station
              </div>
            </div>

            {/* Step 3: Frosted Glass Card */}
            <div className="rounded-[22px] bg-white/15 backdrop-blur-md border border-white/20 p-4 text-white flex flex-col justify-between min-h-[110px]">
              <div className="w-6 h-6 rounded-full bg-white/25 text-white/90 flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <div className="text-[12px] font-medium leading-tight text-white/90 pt-3">
                Execute live workflow
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: CLEAN, SLEEK FORM (MATCHING REFERENCE STRUCTURE & STYLES)
           ========================================================================= */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-16 bg-white">
          <div className="w-full max-w-[390px] mx-auto">
            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-[28px] font-bold text-zinc-900 tracking-tight font-display">
                Sign In
              </h2>
              <p className="mt-1 text-xs text-zinc-500 font-normal">
                Access your provisioned staff operational workspace
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-red-50 text-red-800 border border-red-200/90 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-[#c0201f] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-xs flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username or Work Email */}
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider block">
                  Username or email
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
                    placeholder="e.g. fivedigita@gmail.com"
                    className="w-full h-12 px-4 rounded-2xl bg-[#f4f4f6] border border-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-[#c0201f] focus:ring-4 focus:ring-[#c0201f]/10 transition-all font-sans"
                  />
                  {identifier.trim().length > 3 && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setErrorMessage(
                        "Password resets are managed by your Super Administrator. Please contact your Super Admin to issue a new password."
                      )
                    }
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                  >
                    Forgot?
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
                    className="w-full h-12 pl-4 pr-11 rounded-2xl bg-[#f4f4f6] border border-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-[#c0201f] focus:ring-4 focus:ring-[#c0201f]/10 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 pt-0.5 leading-tight">
                  Issued by Super Admin for your assigned operational role.
                </p>
              </div>

              {/* Primary Submit CTA (Brand Red) */}
              <button
                type="submit"
                disabled={isSubmitting || lockoutSeconds > 0}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#c0201f] text-sm font-semibold text-white transition-all hover:bg-[#a51918] active:scale-[0.99] cursor-pointer shadow-md shadow-[#c0201f]/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>
                  {lockoutSeconds > 0
                    ? `Locked (${lockoutSeconds}s)`
                    : isSubmitting
                    ? "Signing in..."
                    : "Continue"}
                </span>
              </button>
            </form>

            {/* Remember Me Option */}
            <div className="mt-4 flex items-center justify-center text-xs text-zinc-500">
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

            {/* Separator / Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-zinc-200" />
              <span className="absolute bg-white px-3 text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                Or
              </span>
            </div>

            {/* Google Sign-in Mock / Fast-Auth Button (Matching Reference Card) */}
            <button
              type="button"
              onClick={() => {
                const result = loginWithCredentials("fivedigita@gmail.com", "admin123");
                if (result.success) {
                  navigate("/overview", { replace: true });
                }
              }}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-zinc-200/90 bg-white text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer shadow-2xs"
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

            {/* Bottom Terms & Security Notice */}
            <p className="mt-7 text-center text-[10.5px] text-zinc-400 leading-normal">
              By signing in you confirm that you have read and agree to the Smokey Hut Delight Operations Privacy Policy and Staff Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

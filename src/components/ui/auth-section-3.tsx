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
  Truck
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
    <section className="min-h-screen bg-[#fafafa] p-3 text-zinc-900 antialiased [font-synthesis:none] dark:bg-[#09090b] dark:text-zinc-100 font-sans">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-4 lg:grid-cols-[0.98fr_1.02fr]">
        {/* Left Side - Authentication Form */}
        <div className="flex min-h-[760px] items-center justify-center rounded-2xl border border-zinc-200/80 bg-white px-6 py-12 dark:border-zinc-800 dark:bg-zinc-950 lg:min-h-0 lg:px-14 lg:py-16 xl:px-20 relative shadow-2xs">
          <div className="mx-auto w-full max-w-[440px]">
            {/* Brand Logo & Identification Badge */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.svg"
                  alt="Smokey Hut Delight"
                  className="w-10 h-10 object-contain drop-shadow-xs"
                />
                <div>
                  <span className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white block font-display">
                    SMOKEY HUT DELIGHT
                  </span>
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block -mt-0.5">
                    Operations & Command Center
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live System
              </span>
            </div>

            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-zinc-900 dark:text-white font-display">
                Sign in to your account
              </h1>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Enter your username or work email and password provisioned by your Super Admin to access the operations dashboard.
              </p>
            </div>

            {/* Error notification banner */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-800 border border-red-200/90 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/80 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-[#c0201f] dark:text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success notification banner if signing in */}
            {successMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80 text-xs flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {/* Username or Work Email */}
              <div className="space-y-1.5 text-left w-full">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Username or email address
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
                  placeholder="e.g. fivedigita@gmail.com or ayobami"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-[#c0201f] focus:ring-2 focus:ring-[#c0201f]/15 transition-all shadow-2xs"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left w-full">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setErrorMessage(
                        "Password resets are managed by your Super Administrator. Please contact your Super Admin to issue a new password."
                      )
                    }
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200 underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex h-11 items-center rounded-xl border border-zinc-300/80 bg-white px-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 focus-within:border-[#c0201f] focus-within:ring-2 focus-within:ring-[#c0201f]/15 transition-all shadow-2xs">
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
                    className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="pt-1 text-xs text-zinc-600 dark:text-zinc-400">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-zinc-300 text-[#c0201f] focus:ring-[#c0201f] accent-[#c0201f] cursor-pointer"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              {/* Submit CTA Button (Brand Red: #c0201f) */}
              <button
                type="submit"
                disabled={isSubmitting || lockoutSeconds > 0}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#c0201f] text-sm font-semibold text-white transition-all hover:bg-[#a01817] active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>
                  {lockoutSeconds > 0
                    ? `Locked (${lockoutSeconds}s)`
                    : isSubmitting
                    ? "Signing in..."
                    : "Sign In"}
                </span>
              </button>
            </form>

            {/* Security Notice Footer */}
            <div className="mt-8 pt-5 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Protected operations environment. Accounts are provisioned exclusively by a Super Administrator.
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Brand Bento Grid of Operations Departments */}
        <div className="relative flex min-h-[720px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-950 via-[#101014] to-zinc-950 p-7 text-white sm:p-10 lg:min-h-0 lg:p-12 border border-zinc-800/90 shadow-2xl">
          {/* Subtle Red Brand Glow / Ambient Lights */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#c0201f]/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#c0201f]/15 rounded-full blur-[120px] pointer-events-none" />

          {/* Top Section: Brand Statement & Executive Quote */}
          <div className="relative z-10 max-w-[520px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/10 backdrop-blur-md mb-5">
              <span className="w-2 h-2 rounded-full bg-[#c0201f]" />
              <span>Smokey Ops Platform</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-white leading-tight font-display">
              Unified operational intelligence for kitchen batches, inventory & delivery.
            </h2>

            <div className="mt-5 flex items-center gap-3.5 pt-4 border-t border-white/10">
              <div className="size-10 shrink-0 rounded-full bg-[#c0201f]/20 border border-[#c0201f]/40 flex items-center justify-center font-bold text-white text-sm">
                BO
              </div>
              <div>
                <div className="font-semibold leading-tight text-white text-sm">
                  Babajide Ogundipe
                </div>
                <div className="text-xs text-white/60">
                  Head of Kitchen & Operations
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Operations Bento Grid */}
          <div className="relative z-10 mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
            {/* Bento Card 1: Production & Kitchen Batches */}
            <div className="group rounded-xl border border-white/10 bg-white/[0.04] p-4.5 backdrop-blur-md hover:bg-white/[0.07] hover:border-[#c0201f]/40 transition-all shadow-lg">
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#c0201f]/20 border border-[#c0201f]/30 flex items-center justify-center text-[#ff6b6b]">
                  <Flame className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 group-hover:text-white/60 transition-colors">
                  01 / Kitchen
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Production Batches
              </h3>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                Live monitoring of grill chambers, recipe preps, meat marination and finished stock output.
              </p>
            </div>

            {/* Bento Card 2: Sales & Raw Material Inventory */}
            <div className="group rounded-xl border border-white/10 bg-white/[0.04] p-4.5 backdrop-blur-md hover:bg-white/[0.07] hover:border-[#c0201f]/40 transition-all shadow-lg">
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Boxes className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 group-hover:text-white/60 transition-colors">
                  02 / Stock
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Two-Tier Inventory
              </h3>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                Raw goods replenishment, central warehouse stock, packaging materials, and reorder alerts.
              </p>
            </div>

            {/* Bento Card 3: Packaging & Assembly Queue */}
            <div className="group rounded-xl border border-white/10 bg-white/[0.04] p-4.5 backdrop-blur-md hover:bg-white/[0.07] hover:border-[#c0201f]/40 transition-all shadow-lg">
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Package className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 group-hover:text-white/60 transition-colors">
                  03 / Assembly
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Packaging Execution
              </h3>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                Real-time queue assembly, automated container deductions, and tamper-proof dispatch handover.
              </p>
            </div>

            {/* Bento Card 4: Logistics & Dispatch Fleet */}
            <div className="group rounded-xl border border-white/10 bg-white/[0.04] p-4.5 backdrop-blur-md hover:bg-white/[0.07] hover:border-[#c0201f]/40 transition-all shadow-lg">
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Truck className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 group-hover:text-white/60 transition-colors">
                  04 / Fleet
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Logistics & Dispatch
              </h3>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                Internal fleet riders, courier waybills, scheduled pre-orders, and transparent trip settlements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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

  return (
    <div className="min-h-screen w-full bg-white p-4 sm:p-6 lg:p-5 flex flex-col lg:grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.15fr_1fr] font-sans antialiased selection:bg-[#c0201f] selection:text-white">
      {/* =========================================================================
          LEFT PANEL: TEAM HERO CARD (From User Uploaded Design)
          (Desktop & Tablet Landscape: Full Screen Showcase)
         ========================================================================= */}
      <div className="hidden lg:flex relative rounded-[26px] sm:rounded-[34px] overflow-hidden lg:h-[calc(100vh-2.5rem)] shadow-md bg-zinc-900 select-none group">
        <img
          src="/login-team.jpg"
          alt="Operations Team"
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
        />
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

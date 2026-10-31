"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { FlutedGlass } from "@paper-design/shaders-react";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
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
    <section className="min-h-screen bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white font-sans">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        {/* Left Side - Authentication Form */}
        <div className="flex min-h-[760px] items-center justify-center rounded-md border border-black/10 bg-white px-6 py-12 dark:border-white/5 dark:bg-[#0a0a0c] lg:min-h-0 lg:px-14 lg:py-20 xl:px-20 relative">
          <div className="mx-auto w-full max-w-[460px]">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.012em] sm:text-3xl text-black dark:text-white font-display">
                Sign in to your account
              </h1>
              <p className="mt-1.5 text-xs text-black/55 dark:text-white/55 leading-relaxed">
                Enter your username or work email and password provisioned by your Super Admin to access the operations dashboard.
              </p>
            </div>

            {/* Error notification banner */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-[#c0201f] dark:text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success notification banner if signing in */}
            {successMessage && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {/* Username or Work Email */}
              <div className="space-y-1.5 text-left w-full">
                <label className="text-xs font-semibold text-black/70 dark:text-white/70">
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
                  placeholder="Enter your username or work email"
                  className="w-full h-11 px-3.5 rounded-lg border border-black/15 bg-white dark:border-white/10 dark:bg-white/5 text-sm text-black dark:text-white outline-none focus:border-black/50 dark:focus:border-white/50"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left w-full">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-black/70 dark:text-white/70">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setErrorMessage(
                        "Password resets are managed by your Super Administrator. Please contact your Super Admin to issue a new password."
                      )
                    }
                    className="text-xs font-medium text-black/80 hover:text-black dark:text-white/80 dark:hover:text-white underline underline-offset-2 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex h-11 items-center rounded-lg border border-black/15 bg-white px-3.5 dark:border-white/10 dark:bg-white/5">
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
                    className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="space-y-2 pt-1 text-xs text-black/60 dark:text-white/60">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-3.5 rounded border border-black/25 accent-[#c0201f]"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              {/* Submit CTA Button (Brand Red: #c0201f) */}
              <button
                type="submit"
                disabled={isSubmitting || lockoutSeconds > 0}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#c0201f] text-sm font-semibold text-white transition-colors hover:bg-[#a01817] cursor-pointer shadow-sm disabled:opacity-70"
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
            <div className="mt-6 pt-5 border-t border-black/10 dark:border-white/10 flex items-center gap-2 text-[11px] text-black/50 dark:text-white/50">
              <ShieldCheck className="w-4 h-4 text-black/50 dark:text-white/50 shrink-0" />
              <span>
                Protected operations environment. Accounts are provisioned exclusively by a Super Administrator.
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Marketing Testimonial and Local Store Inventory Stock Image */}
        <div className="relative flex min-h-[720px] flex-col overflow-hidden rounded-md bg-linear-to-b from-black to-zinc-950 p-8 text-white sm:p-12 lg:min-h-0 lg:p-16">
          {/* Background Shader */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <FlutedGlass
              size={0.89}
              shape="lines"
              angle={0}
              distortionShape="prism"
              distortion={0.5}
              shift={0}
              blur={0}
              edges={0.25}
              stretch={0}
              scale={1.11}
              fit="cover"
              highlights={0.1}
              shadows={0.2}
              grainMixer={0.1}
              grainOverlay={0.1}
              colorBack="#00000000"
              colorHighlight="#FFFFFF"
              colorShadow="#000000"
              className="w-full h-full bg-transparent"
            />
          </div>

          <div className="relative z-10 h-full w-full">
            <div className="max-w-[460px] lg:pt-12">
              <motion.div
                initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-4"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
                  alt="Babajide Ogundipe"
                  className="size-11 shrink-0 rounded-full border border-white/20 object-cover"
                />
                <div>
                  <div className="font-semibold leading-tight text-white text-sm">
                    Babajide Ogundipe
                  </div>
                  <div className="mt-0.5 text-xs text-white/60">
                    Head of Kitchen & Meat Operations
                  </div>
                </div>
              </motion.div>

              <motion.blockquote
                initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{
                  duration: 0.8,
                  delay: 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mt-7 text-2xl font-light leading-snug tracking-normal text-white/95 sm:text-3xl font-display"
              >
                “Everything we need to track our meat stock, kitchen cooking batches, and delivery drivers is right here in one place.”
              </motion.blockquote>
            </div>

            {/* Local Store Inventory Management Stock Image */}
            <div className="mt-10 w-full translate-y-[20%] overflow-hidden rounded-2xl border border-white/15 bg-black/75 p-2 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:translate-y-[18%] lg:absolute lg:left-[12%] lg:-bottom-24 lg:mt-0 lg:w-[105%] lg:max-w-none lg:origin-bottom-left lg:translate-y-0 lg:-rotate-2 xl:left-[14%] xl:-bottom-[130px] xl:w-[108%]">
              <motion.div
                initial={{ opacity: 0, y: 72, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{
                  duration: 1,
                  delay: 0.22,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="overflow-hidden rounded-xl border border-white/10 bg-black"
              >
                <div className="flex items-center gap-1.5 border-b border-white/10 bg-black/50 px-4 py-2.5 select-none">
                  <div className="size-2 rounded-full bg-white/35" />
                  <div className="size-2 rounded-full bg-white/25" />
                  <div className="size-2 rounded-full bg-white/15" />
                  <span className="ml-3 text-[10px] font-mono tracking-wider text-white/50">
                    staging.smokeyhutdelight.com/overview
                  </span>
                </div>
                {/* Red Abstract Network Background Wallpaper */}
                <img
                  src="/red-abstract-network.jpg"
                  alt="Red Abstract Network Background Wallpaper"
                  className="h-auto w-full object-cover object-center opacity-95 [filter:brightness(0.95)_contrast(1.05)]"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FlutedGlass } from "@paper-design/shaders-react";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2, Truck, Bike, ShieldCheck, MapPin, Building, Phone } from "lucide-react";
import { motion } from "motion/react";
import { useSmokeyOps, type UserRole } from "@/context/SmokeyOpsContext";
import { Select } from "@/components/ui/Select";

export default function AuthSectionThree() {
  const navigate = useNavigate();
  const { createAccount } = useSmokeyOps();

  // Mode: 'login' (Sign in) vs 'signup' (Create account)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Form fields
  const [firstName, setFirstName] = useState("Babajide");
  const [lastName, setLastName] = useState("Ogundipe");
  const [email, setEmail] = useState("ayodine47@gmail.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Role-based KYC Fields (Sign Up)
  const [role, setRole] = useState<UserRole>('manager');
  const [phone, setPhone] = useState('08031234567');
  const [assignedHub, setAssignedHub] = useState('Victoria Island Central Hub');
  const [nationalId, setNationalId] = useState('7829-4821-9921');
  const [vehicleType, setVehicleType] = useState('Bajaj Boxer 150 Motorcycle');
  const [plateNumber, setPlateNumber] = useState('LND-482-XA');
  const [licenseNumber, setLicenseNumber] = useState('DL-98234-LAG');
  const [codLimit, setCodLimit] = useState(50000);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email/Password Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (authMode === 'signup') {
      const roleLabels: Record<UserRole, string> = {
        admin: 'Administrator',
        manager: 'Operations Manager',
        kitchen: 'Kitchen Chef / Lead',
        inventory: 'Inventory & Stock Officer',
        dispatcher: 'Logistics Dispatcher',
        rider: 'Delivery Fleet Rider',
      };
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Smokey Staff';
      createAccount({
        email: email.trim(),
        name: fullName,
        role,
        roleLabel: roleLabels[role],
        phone: phone.trim() || '080' + Math.floor(10000000 + Math.random() * 90000000),
        staff_id: `SHD-${role.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        assigned_hub: assignedHub,
        national_id_nin: nationalId.trim() || '7829-4821-9921',
        vehicle_type: role === 'rider' ? vehicleType : undefined,
        plate_number: role === 'rider' ? (plateNumber.trim() || 'LND-482-XA') : undefined,
        license_number: role === 'rider' ? (licenseNumber.trim() || 'DL-98234-LAG') : undefined,
        cod_limit: role === 'rider' ? Number(codLimit) : undefined,
      });

      setSuccessMessage("Account created with verified role profile!");
      setTimeout(() => {
        setIsSubmitting(false);
        if (role === 'rider') {
          navigate("/logistics/rider-portal");
        } else {
          navigate("/overview");
        }
      }, 900);
      return;
    }

    setSuccessMessage("Signing you in...");
    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/overview");
    }, 900);
  };

  // Google OAuth flow handler
  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setSuccessMessage("Connecting to Google Account...");
    
    setTimeout(() => {
      setGoogleLoading(false);
      navigate("/overview");
    }, 1100);
  };

  return (
    <section className="min-h-screen bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white font-sans">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        {/* Left Side - Authentication Form */}
        <div className="flex min-h-[760px] items-center justify-center rounded-md border border-black/10 bg-white px-6 py-12 dark:border-white/5 dark:bg-[#0a0a0c] lg:min-h-0 lg:px-14 lg:py-20 xl:px-20 relative">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate("/overview")}
            className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home overview</span>
          </button>

          <div className="mx-auto w-full max-w-[460px]">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.012em] sm:text-3xl text-black dark:text-white font-display">
                {authMode === 'login' ? "Sign in to your account" : "Create an account"}
              </h1>
              <p className="mt-1.5 text-xs text-black/55 dark:text-white/55 leading-relaxed">
                {authMode === 'login'
                  ? "Enter your work email and password to access the operations dashboard."
                  : "Sign up with your work email to manage food inventory, cooking batches, and delivery drivers."}
              </p>
            </div>

            {/* Success notification banner if signing in */}
            {successMessage && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Social Authentication: Google Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-black/15 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer disabled:opacity-60 shadow-2xs"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black dark:text-white" />
                ) : (
                  <GoogleIcon />
                )}
                <span>{authMode === 'login' ? "Sign in with Google" : "Sign up with Google"}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4 text-xs font-medium text-black/40 dark:text-white/30">
              <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              <span>or continue with email</span>
              <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* If Sign Up mode, show First and Last name */}
              {authMode === 'signup' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 text-left w-full">
                    <label className="text-xs font-semibold text-black/70 dark:text-white/70">
                      First name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Babajide"
                      className="w-full h-11 px-3.5 rounded-lg border border-black/15 bg-white dark:border-white/10 dark:bg-white/5 text-sm text-black dark:text-white outline-none focus:border-black/50 dark:focus:border-white/50"
                    />
                  </div>

                  <div className="space-y-1.5 text-left w-full">
                    <label className="text-xs font-semibold text-black/70 dark:text-white/70">
                      Last name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Ogundipe"
                      className="w-full h-11 px-3.5 rounded-lg border border-black/15 bg-white dark:border-white/10 dark:bg-white/5 text-sm text-black dark:text-white outline-none focus:border-black/50 dark:focus:border-white/50"
                    />
                  </div>
                </div>
              )}

              {/* Work Email */}
              <div className="space-y-1.5 text-left w-full">
                <label className="text-xs font-semibold text-black/70 dark:text-white/70">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@smokeyhutdelight.com"
                  className="w-full h-11 px-3.5 rounded-lg border border-black/15 bg-white dark:border-white/10 dark:bg-white/5 text-sm text-black dark:text-white outline-none focus:border-black/50 dark:focus:border-white/50"
                />
              </div>

              {/* Role Selection & KYC Fields for Signup */}
              {authMode === 'signup' && (
                <div className="space-y-3.5 pt-1">
                  <div className="space-y-1.5 text-left w-full">
                    <Select
                      label="Operational Role & Permissions"
                      value={role}
                      onValueChange={(val) => setRole(val as UserRole)}
                      options={[
                        { value: 'manager', label: 'Operations Manager (Kitchen & Logistics)' },
                        { value: 'admin', label: 'Administrator (Full Access)' },
                        { value: 'kitchen', label: 'Kitchen Chef / Prep Lead' },
                        { value: 'inventory', label: 'Inventory & Stock Officer' },
                        { value: 'dispatcher', label: 'Logistics Dispatcher' },
                        { value: 'rider', label: 'Delivery Fleet Rider (Trip Portal & Wallet)' },
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div className="space-y-1.5 text-left w-full">
                      <label className="text-xs font-semibold text-black/70 dark:text-white/70">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08012345678"
                        className="w-full h-11 px-3.5 rounded-lg border border-black/15 bg-white dark:border-white/10 dark:bg-white/5 text-sm text-black dark:text-white outline-none focus:border-black/50 dark:focus:border-white/50"
                      />
                    </div>

                    <div className="space-y-1.5 text-left w-full">
                      <label className="text-xs font-semibold text-black/70 dark:text-white/70">
                        National ID / NIN
                      </label>
                      <input
                        type="text"
                        required
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        placeholder="7829-4821-9921"
                        className="w-full h-11 px-3.5 rounded-lg border border-black/15 bg-white dark:border-white/10 dark:bg-white/5 text-sm text-black dark:text-white outline-none focus:border-black/50 dark:focus:border-white/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left w-full">
                    <label className="text-xs font-semibold text-black/70 dark:text-white/70">
                      Operating Hub / Office
                    </label>
                    <div className="flex items-center justify-between h-11 px-3.5 rounded-lg border border-black/15 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] text-sm text-black dark:text-white">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="font-medium truncate">Victoria Island Central Hub</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                        Active HQ
                      </span>
                    </div>
                  </div>

                  {/* Rider Specific KYC Card */}
                  {role === 'rider' && (
                    <div className="p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] space-y-3">
                      <div className="text-xs font-semibold text-black/80 dark:text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Driver Fleet KYC Details</span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1 text-left">
                          <label className="text-[11px] font-medium text-black/60 dark:text-white/60">Vehicle Model</label>
                          <input
                            type="text"
                            required
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            placeholder="e.g. TVS HLX 125 Motorcycle"
                            className="w-full h-9 px-2.5 rounded-lg border border-black/15 bg-white dark:border-white/10 dark:bg-white/5 text-xs text-black dark:text-white"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[11px] font-medium text-black/60 dark:text-white/60">Plate Number</label>
                          <input
                            type="text"
                            required
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value)}
                            placeholder="LND-482-XA"
                            className="w-full h-9 px-2.5 rounded-lg border border-black/15 bg-white dark:border-white/10 dark:bg-white/5 text-xs text-black dark:text-white"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[11px] font-medium text-black/60 dark:text-white/60">Driver's License No</label>
                          <input
                            type="text"
                            required
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            placeholder="DL-98234-LAG"
                            className="w-full h-9 px-2.5 rounded-lg border border-black/15 bg-white dark:border-white/10 dark:bg-white/5 text-xs text-black dark:text-white"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[11px] font-medium text-black/60 dark:text-white/60">Max Cash Limit (₦)</label>
                          <input
                            type="number"
                            min="5000"
                            step="5000"
                            value={codLimit}
                            onChange={(e) => setCodLimit(Number(e.target.value))}
                            className="w-full h-9 px-2.5 rounded-lg border border-black/15 bg-white dark:border-white/10 dark:bg-white/5 text-xs text-black dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5 text-left w-full">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-black/70 dark:text-white/70">
                    Password
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => alert("Password reset link sent to your email.")}
                      className="text-xs font-medium text-black/80 hover:text-black dark:text-white/80 dark:hover:text-white underline underline-offset-2 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative flex h-11 items-center rounded-lg border border-black/15 bg-white px-3.5 dark:border-white/10 dark:bg-white/5">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Checkboxes / Terms */}
              <div className="space-y-2 pt-1 text-xs text-black/60 dark:text-white/60">
                {authMode === 'login' ? (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-3.5 rounded border border-black/25 accent-black dark:accent-white"
                    />
                    <span>Remember me</span>
                  </label>
                ) : (
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 size-3.5 rounded border border-black/25 accent-black dark:accent-white"
                    />
                    <span>
                      I agree to the Smokey Hut terms of service and operational privacy policy.
                    </span>
                  </label>
                )}
              </div>

              {/* Submit CTA Button (Brand Red: #c0201f) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#c0201f] text-sm font-semibold text-white transition-colors hover:bg-[#a01817] cursor-pointer shadow-sm disabled:opacity-70"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>{authMode === 'login' ? "Sign In" : "Create Account"}</span>
              </button>
            </form>

            {/* Toggle between Sign In and Sign Up */}
            <div className="mt-6 text-center text-xs text-black/60 dark:text-white/60">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setSuccessMessage(null);
                    }}
                    className="font-semibold text-black dark:text-white underline underline-offset-2 hover:opacity-80 cursor-pointer ml-1"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setSuccessMessage(null);
                    }}
                    className="font-semibold text-black dark:text-white underline underline-offset-2 hover:opacity-80 cursor-pointer ml-1"
                  >
                    Sign in to your account
                  </button>
                </p>
              )}
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

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
        fill="#EB4335"
      />
    </svg>
  );
}

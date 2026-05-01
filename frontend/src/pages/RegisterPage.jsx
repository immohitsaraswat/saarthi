import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Compass, Eye, EyeOff, Mail, Lock, User, Zap } from 'lucide-react';
import DotField from '../components/common/DotField';
import BlurText from '../components/common/BlurText';
import FeatureCarousel from '../components/common/FeatureCarousel';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to Saarthi 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-400', width: '25%' };
    if (p.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: '50%' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Fair', color: 'bg-amber-400', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  })();

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding + animations ───────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #2d1f6e 45%, #1d1a56 100%)' }}>

        {/* DotField canvas */}
        <DotField dotColor="rgba(196,181,253,0.22)" dotSpacing={22} speed={0.35} />

        {/* Gradient orbs */}
        <div className="absolute top-[-80px] right-[-60px] w-[380px] h-[380px] rounded-full opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-80px] left-[-40px] w-[360px] h-[360px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">Saarthi</p>
            <p className="text-xs text-violet-300">Navigate Your Workflow</p>
          </div>
        </div>

        {/* Hero + stats */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight">
            <BlurText
              text="Start your journey."
              className="block gradient-text"
              delay={70}
              baseDelay={100}
            />
            <BlurText
              text="Free forever."
              className="block text-white mt-1"
              delay={70}
              baseDelay={420}
            />
          </h1>

          <p className="text-violet-300 text-base leading-relaxed max-w-xs animate-blur-in"
            style={{ animationDelay: '700ms' }}>
            Join teams that already use Saarthi to ship great products together.
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 animate-blur-in" style={{ animationDelay: '800ms' }}>
            {[
              { label: 'Active Projects', value: '10K+' },
              { label: 'Tasks Completed', value: '2M+' },
              { label: 'Teams Using',     value: '5K+' },
              { label: 'Uptime',          value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card px-4 py-3">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-violet-300 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Feature Carousel */}
          <div className="animate-blur-in" style={{ animationDelay: '950ms' }}>
            <FeatureCarousel />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-violet-400 text-xs animate-blur-in" style={{ animationDelay: '1050ms' }}>
          © {new Date().getFullYear()} Saarthi. All rights reserved.
        </div>
      </div>

      {/* ── Right panel — form (unchanged) ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#0f0f1a]">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">Saarthi</p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Create account</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Get started — it's free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label" htmlFor="name">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="name" type="text" name="name" value={form.name}
                  onChange={handleChange} placeholder="John Doe" className="input pl-10" required />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="reg-email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-email" type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com" className="input pl-10" required />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="reg-password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-password" type={showPass ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="Min. 6 characters" className="input pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{strength.label}</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>

          {/* Try Demo */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>
          <Link
            to="/demo"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
              border-2 border-dashed border-amber-300 dark:border-amber-700
              text-amber-600 dark:text-amber-400 text-sm font-semibold
              hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
          >
            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Try Demo — no account needed
          </Link>
        </div>
      </div>
    </div>
  );
}

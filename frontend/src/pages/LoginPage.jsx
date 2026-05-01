import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Compass, Eye, EyeOff, Mail, Lock, Zap } from 'lucide-react';
import SaarthiLogo from '../components/common/SaarthiLogo';
import DotField from '../components/common/DotField';
import BlurText from '../components/common/BlurText';
import FeatureCarousel from '../components/common/FeatureCarousel';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding + animations ───────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1d1a56 100%)' }}>

        {/* DotField canvas background */}
        <DotField dotColor="rgba(165,180,252,0.25)" dotSpacing={22} speed={0.4} />

        {/* Gradient orbs for depth */}
        <div className="absolute top-[-100px] left-[-80px] w-[420px] h-[420px] rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-80px] right-[-60px] w-[340px] h-[340px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <SaarthiLogo size={180} glow />
        </div>

        {/* Hero text with BlurText animation */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight">
            <BlurText
              text="Manage tasks."
              className="block gradient-text"
              delay={70}
              baseDelay={100}
            />
            <BlurText
              text="Ship faster."
              className="block text-white mt-1"
              delay={70}
              baseDelay={380}
            />
          </h1>

          <p className="text-indigo-300 text-base leading-relaxed max-w-xs animate-blur-in"
            style={{ animationDelay: '680ms' }}>
            Collaborate with your team, track progress in real-time, and never miss a deadline again.
          </p>

          {/* Feature Carousel */}
          <div className="animate-blur-in" style={{ animationDelay: '800ms' }}>
            <FeatureCarousel />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-indigo-400 text-xs animate-blur-in" style={{ animationDelay: '900ms' }}>
          © {new Date().getFullYear()} Saarthi. All rights reserved.
        </div>
      </div>

      {/* ── Right panel — form (unchanged) ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#0f0f1a]">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <SaarthiLogo size={100} />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label" htmlFor="email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="email" type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com"
                  className="input pl-10" required />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="password" type={showPass ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••" className="input pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Create one free
            </Link>
          </p>

          {/* Try Demo ─────────────────────────────────────── */}
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

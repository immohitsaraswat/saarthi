import { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutDashboard, Zap, Clock, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    icon: LayoutDashboard,
    color: 'text-indigo-300',
    bg:    'bg-indigo-500/20',
    title: 'Kanban Workflow',
    desc:  'Visualize your entire sprint on a drag-friendly board. Move tasks across To Do, In Progress, and Done columns instantly.',
    tag:   'Productivity',
  },
  {
    icon: Zap,
    color: 'text-emerald-300',
    bg:    'bg-emerald-500/20',
    title: 'Real-Time Updates',
    desc:  'Tasks refresh every 5 seconds with smart deduplication — changes by any team member appear instantly without a page reload.',
    tag:   'Collaboration',
  },
  {
    icon: Clock,
    color: 'text-amber-300',
    bg:    'bg-amber-500/20',
    title: 'Smart Deadlines',
    desc:  'Automatic overdue detection highlights red-border cards and surfaces a banner so no deadline slips through the cracks.',
    tag:   'Reliability',
  },
  {
    icon: BarChart3,
    color: 'text-rose-300',
    bg:    'bg-rose-500/20',
    title: 'Analytics Dashboard',
    desc:  'Pie, bar, and priority charts give a bird\'s-eye view of completion rate and workload distribution across your team.',
    tag:   'Insights',
  },
];

const INTERVAL_MS = 3500;

export default function FeatureCarousel() {
  const [current, setCurrent]   = useState(0);
  const [visible, setVisible]   = useState(true);
  const [hovering, setHovering] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback((index) => {
    setVisible(false);
    setTimeout(() => {
      setCurrent(index);
      setVisible(true);
    }, 260);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % FEATURES.length);
  }, [current, goTo]);

  useEffect(() => {
    if (hovering) return;
    timerRef.current = setTimeout(next, INTERVAL_MS);
    return () => clearTimeout(timerRef.current);
  }, [current, hovering, next]);

  const slide = FEATURES[current];
  const Icon  = slide.icon;

  return (
    <div
      className="glass-card p-6 select-none"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Tag */}
      <span className="inline-block text-xs font-semibold tracking-wider uppercase text-primary-300 mb-4 opacity-80">
        {slide.tag}
      </span>

      {/* Slide content */}
      <div
        className="space-y-3"
        style={{
          opacity:   visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(12px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
      >
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl ${slide.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${slide.color}`} />
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold text-white leading-tight">{slide.title}</h3>
        <p className="text-sm text-primary-200 leading-relaxed">{slide.desc}</p>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2 mt-5">
        {FEATURES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="transition-all duration-300 rounded-full"
            style={{
              width:           i === current ? '20px' : '7px',
              height:          '7px',
              background:      i === current ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.25)',
            }}
          />
        ))}

        {/* Progress bar */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-primary-300/60">
          {hovering ? 'Paused' : `${current + 1} / ${FEATURES.length}`}
        </div>
      </div>
    </div>
  );
}

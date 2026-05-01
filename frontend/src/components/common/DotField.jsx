import { useEffect, useRef } from 'react';

/**
 * DotField — lightweight canvas-based animated dot background.
 * Uses requestAnimationFrame for smooth rendering.
 * Subtle mouse parallax on hover. Zero dependencies.
 *
 * Props:
 *   dotColor     — rgba string, default 'rgba(165,180,252,0.35)'
 *   dotSpacing   — px between dots grid, default 20 (≥14 for perf)
 *   speed        — drift speed multiplier, default 0.3
 */
export default function DotField({
  dotColor   = 'rgba(165, 180, 252, 0.3)',
  dotSpacing = 20,
  speed      = 0.3,
}) {
  const canvasRef  = useRef(null);
  const mouseRef   = useRef({ x: 0, y: 0 });
  const frameRef   = useRef(null);
  const offsetRef  = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width  - 0.5,
        y: (e.clientY - rect.top)  / rect.height - 0.5,
      };
    };
    canvas.parentElement?.addEventListener('mousemove', handleMouse);

    let tick = 0;
    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Smoothly drift offset toward mouse position (parallax)
      offsetRef.current.x += (mouseRef.current.x * 14 - offsetRef.current.x) * 0.04;
      offsetRef.current.y += (mouseRef.current.y * 14 - offsetRef.current.y) * 0.04;

      const ox = offsetRef.current.x;
      const oy = offsetRef.current.y;

      const cols = Math.ceil(width  / dotSpacing) + 2;
      const rows = Math.ceil(height / dotSpacing) + 2;

      tick += speed * 0.008;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * dotSpacing + ox;
          const y = r * dotSpacing + oy;

          // Subtle breathing: size oscillates slightly per dot
          const phase = Math.sin(tick + c * 0.4 + r * 0.3);
          const radius = 1.2 + phase * 0.5;

          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.5, radius), 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouse);
    };
  }, [dotColor, dotSpacing, speed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

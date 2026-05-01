/**
 * SaarthiLogo — uses the real logo.svg asset.
 *
 * Props:
 *   size      — height in px (width scales automatically)  default: 32
 *   full      — show full logo (true) or icon-only cropped (false)
 *   className — extra classes
 *
 * Dark mode: logo is dark on transparent → `dark:invert` makes it white.
 * Optional `glow` prop adds a subtle indigo glow for dark backgrounds.
 */
import logo from '../../assets/logo.svg';

export default function SaarthiLogo({
  size = 32,
  full = false,
  className = '',
  glow = false,
}) {
  return (
    <img
      src={logo}
      alt="Saarthi"
      height={size}
      style={{ height: size, width: 'auto' }}
      className={[
        'dark:invert',                                // white on dark bg
        glow ? 'dark:drop-shadow-[0_0_6px_#818cf8]' : '', // optional glow
        className,
      ].join(' ')}
    />
  );
}

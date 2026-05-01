/**
 * BlurText — animates text word-by-word with a staggered blur-in effect.
 * Uses CSS keyframe `blur-in` defined in index.css.
 *
 * Props:
 *   text        — the string to animate
 *   className   — extra classes on the wrapper span
 *   delay       — stagger delay in ms between each word (default: 80)
 *   baseDelay   — initial delay before first word animates (default: 0)
 */
export default function BlurText({
  text,
  className = '',
  delay     = 80,
  baseDelay = 0,
}) {
  const words = text.split(' ');

  return (
    <span
      className={`inline ${className}`}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block animate-blur-in"
          style={{ animationDelay: `${baseDelay + i * delay}ms` }}
          aria-hidden="true"
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  );
}

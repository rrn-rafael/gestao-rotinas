import type { CardIcon } from "../model/types";

type CardIconGlyphProps = {
  type: CardIcon;
};

export function CardIconGlyph({ type }: CardIconGlyphProps) {
  if (type === "cube") {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-3.5 w-3.5 shrink-0 text-neutral-400"
        aria-hidden="true"
      >
        <path
          d="M8 2.2 12.5 4.7V11.3L8 13.8 3.5 11.3V4.7L8 2.2Z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M8 2.2V8M12.5 4.7 8 8 3.5 4.7"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "pulse") {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-3.5 w-3.5 shrink-0 text-neutral-400"
        aria-hidden="true"
      >
        <path
          d="M2.5 8H5.2L6.6 5.3L9 10.8L10.5 7.2H13.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="2.5"
          y="2.5"
          width="11"
          height="11"
          rx="2"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5 shrink-0 text-neutral-400"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="2.5"
        width="11"
        height="11"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M2.5 6H13.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M6 2.5V13.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M10 2.5V13.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

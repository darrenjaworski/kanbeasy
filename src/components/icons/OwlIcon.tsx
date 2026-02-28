import type { FC, SVGProps } from "react";

export const OwlIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    fill="currentColor"
    aria-hidden
    focusable="false"
    {...props}
  >
    <path d="M480-80q-134 0-227-93t-93-227v-200q0-122 96-201t224-79q128 0 224 79t96 201v520H480Zm0-80h80q-19-25-29.5-55.5T520-280v-42q-10 1-20 1.5t-20 .5q-67 0-129.5-23.5T240-415v15q0 100 70 170t170 70Zm120-120q0 50 35 85t85 35v-255q-26 26-56 44.5T600-340v60ZM440-560q0-66-45-111t-109-48q-22 24-34 54t-12 65q0 89 72.5 144.5T480-400q95 0 167.5-55.5T720-600q0-35-12-65.5T674-720q-64 2-109 48t-45 112h-80Zm-128.5-11.5Q300-583 300-600t11.5-28.5Q323-640 340-640t28.5 11.5Q380-617 380-600t-11.5 28.5Q357-560 340-560t-28.5-11.5Zm280 0Q580-583 580-600t11.5-28.5Q603-640 620-640t28.5 11.5Q660-617 660-600t-11.5 28.5Q637-560 620-560t-28.5-11.5ZM370-778q34 14 62 37t48 52q20-29 47.5-52t61.5-37q-25-11-52.5-16.5T480-800q-29 0-56.5 5.5T370-778Zm430 618H520h280Zm-320 0q-100 0-170-70t-70-170q0 100 70 170t170 70h80-80Zm120-120q0 50 35 85t85 35q-50 0-85-35t-35-85ZM480-689Z" />
  </svg>
);

/** Sleepy variant with half-closed eyes — used during night owl hours (10 PM – 4 AM). */
export const SleepyOwlIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    fill="currentColor"
    aria-hidden
    focusable="false"
    {...props}
  >
    {/* Same owl body path */}
    <path d="M480-80q-134 0-227-93t-93-227v-200q0-122 96-201t224-79q128 0 224 79t96 201v520H480Zm0-80h80q-19-25-29.5-55.5T520-280v-42q-10 1-20 1.5t-20 .5q-67 0-129.5-23.5T240-415v15q0 100 70 170t170 70Zm120-120q0 50 35 85t85 35v-255q-26 26-56 44.5T600-340v60ZM440-560q0-66-45-111t-109-48q-22 24-34 54t-12 65q0 89 72.5 144.5T480-400q95 0 167.5-55.5T720-600q0-35-12-65.5T674-720q-64 2-109 48t-45 112h-80ZM370-778q34 14 62 37t48 52q20-29 47.5-52t61.5-37q-25-11-52.5-16.5T480-800q-29 0-56.5 5.5T370-778Zm430 618H520h280Zm-320 0q-100 0-170-70t-70-170q0 100 70 170t170 70h80-80Zm120-120q0 50 35 85t85 35q-50 0-85-35t-35-85ZM480-689Z" />
    {/* Half-closed left eye — droopy eyelid */}
    <ellipse cx="340" cy="600" rx="28" ry="14" />
    {/* Half-closed right eye — droopy eyelid */}
    <ellipse cx="620" cy="600" rx="28" ry="14" />
    {/* "Zzz" sleep indicator */}
    <g fontSize="80" fontWeight="bold" fontFamily="sans-serif">
      <text x="720" y="-700" fontSize="60" opacity="0.5">
        z
      </text>
      <text x="760" y="-760" fontSize="72" opacity="0.7">
        z
      </text>
      <text x="800" y="-830" fontSize="84" opacity="0.9">
        z
      </text>
    </g>
  </svg>
);

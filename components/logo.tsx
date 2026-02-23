import React, { SVGProps } from "react";

// 1. Define the props interface for type safety.
// We extend React.SVGProps<SVGSVGElement> to automatically include
// all standard SVG attributes (like 'role', 'aria-label', etc.) without
// having to list them manually. This is a best practice.
export interface LogoIconProps extends SVGProps<SVGSVGElement> {
  /**
   * Optional CSS class name for the wrapper SVG.
   */
  className?: string;

  /**
   * Color for the primary elements. Defaults to 'currentColor' for easy inheritance.
   */
  fill?: string;

  /**
   * The width and height of the icon.
   */
  size?: number | string;

  /**
   * Optional inline style object for the wrapper SVG.
   */
  style?: React.CSSProperties;
}

/**
 * A reusable, type-safe React component for the provided SVG logo icon.
 * It is designed to be highly customizable while preserving the original SVG structure.
 * * @param {LogoIconProps} props - The component props, including standard SVG attributes.
 * @returns {React.ReactElement} The rendered SVG icon.
 */
export const LogoIcon = ({
  className,
  fill = "currentColor",
  size = 48,
  style,
  ...rest
}: LogoIconProps): React.ReactElement => {
  // The original SVG had hardcoded width/height and used fill="#fff".
  // The component ensures size is set via props and allows fill color to be customized.

  const finalStyle: React.CSSProperties = {
    // We explicitly type the style object for safety
    ...style,
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      style={finalStyle}
      // Spread the 'rest' properties (from SVGProps) onto the root element
      {...rest}
    >
      <g fill={fill} transform="translate(4 0)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="m19.9957 35.3266c6.2579 0 11.3309-5.073 11.3309-11.3309s-5.073-11.3309-11.3309-11.3309-11.33089 5.073-11.33089 11.3309 5.07299 11.3309 11.33089 11.3309zm0 8.6648c11.0434 0 19.9957-8.9523 19.9957-19.9957 0-11.0433-8.9523-19.9957-19.9957-19.9957-11.04331 0-19.9957 8.9524-19.9957 19.9957 0 11.0434 8.95239 19.9957 19.9957 19.9957z"
        />
        <path d="m20.2237 24.4335c2.0824-2.0823 5.4585-2.0823 7.5409 0l10.3686 10.3687c2.0824 2.0823 2.0824 5.4585 0 7.5409-2.0823 2.0823-5.4585 2.0823-7.5408 0l-10.3687-10.3687c-2.0823-2.0824-2.0823-5.4585 0-7.5409z" />
      </g>
    </svg>
  );
};

/**
 * Props for the LogoWithText component.
 */
export interface LogoWithTextProps {
  /**
   * Optional CSS class name for the wrapper div.
   */
  className?: string;

  /**
   * Size of the logo icon. Defaults to 40.
   */
  iconSize?: number | string;

  /**
   * Color for the logo icon. Defaults to 'currentColor'.
   */
  iconFill?: string;

  /**
   * Font size for the text. Defaults to '1.5rem'.
   */
  textSize?: string;

  /**
   * Optional inline style object for the wrapper div.
   */
  style?: React.CSSProperties;
}

/**
 * A logo component that displays the LogoIcon alongside the "Vibe" text.
 * Perfect for headers, navigation bars, and branding.
 * @param {LogoWithTextProps} props - The component props.
 * @returns {React.ReactElement} The rendered logo with text.
 */
export const Logo = ({
  className = "",
  iconSize = 30,
  iconFill = "currentColor",
  textSize = "1.3rem",
  style,
}: LogoWithTextProps): React.ReactElement => {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={style}>
      <LogoIcon size={iconSize} fill={iconFill} />
      <span
        style={{
          fontSize: textSize,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        Quest
      </span>
    </div>
  );
};

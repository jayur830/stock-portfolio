import type { SVGProps } from 'react';

export interface BrandLogoProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export default function BrandLogo({ size = 20, width, height, className, ...props }: BrandLogoProps) {
  const finalWidth = width ?? size;
  const finalHeight = height ?? size;

  return (
    <svg
      className={className}
      fill="none"
      height={finalHeight}
      viewBox="0 0 227 227"
      width={finalWidth}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect fill="currentColor" height="27" rx="4" width="51" y="200" />
      <rect fill="currentColor" height="50" rx="4" width="53" x="57" y="177" />
      <rect fill="currentColor" height="104" rx="4" width="54" x="116" y="123" />
      <rect fill="currentColor" height="164" rx="4" width="51" x="176" y="63" />
      <path
        d="M215 7L163.847 16.1291L197.329 55.8646L215 7ZM18 173L20.8997 176.441L186.929 36.5384L184.029 33.0972L181.13 29.656L15.1003 169.559L18 173Z"
        fill="currentColor"
      />
    </svg>
  );
}

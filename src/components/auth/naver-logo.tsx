interface NaverLogoProps {
  className?: string;
  size?: number;
}

const NaverLogo = ({ className, size = 20 }: NaverLogoProps) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16.27 12.77 7.38 0H0v24h7.73V11.23L16.62 24H24V0h-7.73v12.77Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default NaverLogo;

interface LogoProps {
  className?: string;
  height?: string | number;
}

const Logo: React.FC<LogoProps> = ({ className, height }) => {
  return (
    <svg
      className={className}
      height={height}
      viewBox="0 0 176 176"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_8702_5737)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M173.013 -0.00244141C174.654 -0.00244141 175.981 1.34466 175.892 2.98312C174.792 23.3297 166.256 42.5794 151.885 56.9499C137.515 71.3202 118.396 79.7257 98.2846 80.5915C96.6589 80.6615 95.3333 79.3397 95.3333 77.7125V2.93089C95.3333 1.31086 96.6466 -0.00244141 98.2667 -0.00244141H173.013Z"
          fill="currentColor"
        />
        <path
          d="M40.3333 80.6642C62.6088 80.6642 80.6667 62.6064 80.6667 40.3309C80.6667 18.0554 62.6088 -0.00244141 40.3333 -0.00244141C18.0578 -0.00244141 0 18.0554 0 40.3309C0 62.6064 18.0578 80.6642 40.3333 80.6642Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M175.891 173.011C175.981 174.65 174.653 175.998 173.012 175.998L85.4333 175.998C64.1604 175.61 39.1003 166.987 24.0555 151.942C9.7163 137.603 1.21045 118.496 0.108668 98.3167C0.0192045 96.6782 1.34632 95.3309 2.98727 95.3309H94.3434C115.789 95.4632 136.333 103.974 151.589 119.045C166.136 133.416 174.777 152.665 175.891 173.011Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_8702_5737">
          <rect width="176" height="176" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default Logo;

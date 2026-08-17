export function WavingHand({ className = "" }: { className?: string }) {
	return (
		<span
			className={`inline-block origin-bottom-right animate-wave cursor-grab select-none transition-[scale,transform-origin] [transition-duration:200ms] [transition-timing-function:ease-out] hover:origin-center hover:scale-120 motion-reduce:animate-none ${className}`}
		>
			👋
		</span>
	);
}

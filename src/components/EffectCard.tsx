import { useEffect, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";

interface EffectCardProps {
	id: string;
	title: string;
	description: string;
	className: string;
	code: string;
	hasAnimation?: boolean;
	onInit: () => void;
	onRestart?: () => void;
	onEdit?: () => void;
	onClick?: () => void;
	backgroundColor: string;
	textStyle?: React.CSSProperties;
	cardStyle?: React.CSSProperties;
	cardClassName?: string;
}

export default function EffectCard({
	id,
	title,
	description,
	className,
	code,
	hasAnimation,
	onInit,
	onRestart,
	onEdit,
	onClick,
	backgroundColor,
	textStyle,
	cardStyle,
	cardClassName,
}: EffectCardProps) {
	const [showCode, setShowCode] = useState(false);

	useEffect(() => {
		onInit();
	}, [onInit]);

	const toggleCode = () => setShowCode((prev) => !prev);
	const closeCode = () => setShowCode(false);

	const handleMouseEnter = () => {
		if (hasAnimation && onRestart) {
			onRestart();
		}
	};

	return (
		<div 
			className={`effect-card ${cardClassName || ''}`} 
			style={{ backgroundColor, ...cardStyle }} 
			onMouseEnter={handleMouseEnter}
			onClick={onClick}
		>
			<div className="card-header">
				<p className="effect-description">{description}</p>
				<div className="card-actions">
					{hasAnimation && onRestart && (
						<button className="restart-toggle" onClick={onRestart} aria-label="Restart animation">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="23 4 23 10 17 10" />
								<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
							</svg>
						</button>
					)}
					<button className="code-toggle" onClick={toggleCode} aria-label="View code">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="16 18 22 12 16 6" />
							<polyline points="8 6 2 12 8 18" />
						</svg>
					</button>
					{onEdit && (
						<button className="edit-toggle" onClick={(e) => { e.stopPropagation(); onEdit(); }} aria-label="Edit effect">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
								<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
							</svg>
						</button>
					)}
				</div>
			</div>
			<div className="effect-content">
				<h2 id={id} className={className} style={textStyle}>{title}</h2>
			</div>
			{showCode && (
				<div className="code-overlay" onClick={closeCode}>
					<button className="close-overlay" onClick={closeCode} aria-label="Close code view">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
					<div className="code-content" onClick={(e) => e.stopPropagation()}>
						<Highlight theme={themes.oneDark} code={code} language="javascript">
							{({ style, tokens, getLineProps, getTokenProps }) => (
								<pre style={{ ...style, margin: 0, borderRadius: '8px', padding: '1rem' }}>
									{tokens.map((line, i) => (
										<div key={i} {...getLineProps({ line })}>
											{line.map((token, key) => (
												<span key={key} {...getTokenProps({ token })} />
											))}
										</div>
									))}
								</pre>
							)}
						</Highlight>
					</div>
				</div>
			)}
		</div>
	);
}

import { useState, useRef, useEffect } from 'react';
import { Highlight, themes } from "prism-react-renderer";
import EffectCard from "./components/EffectCard";
import ConfigPanel from './components/ConfigPanel';
import { applyLongShadow } from "./effects/infinite-shadow.js";
import { applyStripedShadow as applyStripedShadowSimplified } from "./effects/striped-shadow-simplified.js";
import { applyStripedShadow as applyWebApiAnimatedStripedShadow } from "./effects/striped-shadow-animated-web-api.js";
import "./App.css";

interface EffectConfig {
	id: string;
	title: string;
	description: string;
	className: string;
	hasAnimation?: boolean;
	initEffect: () => void;
	restartEffect?: () => void;
	code: string;
	backgroundColor: string;
	textStyle?: React.CSSProperties;
	cardStyle?: React.CSSProperties;
	cardClassName?: string;
	config: Record<string, unknown>;
	effectFn: (selector: string, config: Record<string, unknown>) => (() => void) | void;
    type: 'infinite' | 'striped' | 'striped-animated';
}

const DEFAULT_INFINITE_SHADOW_CONFIG = {
    angle: 45,
    textColor: '#ed40fdff',
    shadowColor: '#c52f2fff',
    shadowOutlineColor: 'black',
    shadowOutlineThickness: 2,
    textOutlineColor: 'black',
    textStrokeThickness: 2,
    shadowLength: 150,
    stagger: 300,
    sortByAngle: false,
    infiniteShadow: true,
    maxShadowLayers: 1000,
    boundaryElement: 'viewport',
};

const DEFAULT_STRIPED_SHADOW_CONFIG = {
    angles: 30,
    textOutlineThickness: 2,
    textColor: '#fef2d6ff',
    textOutlineColor: '#A0522D',
    stripeColors: ['#A0522D', '#D2691E', '#e18b4dff', '#DEB887'],
    stripeThicknesses: [22, 20, 15, 8],
    sortByAngle: true,
    step: 0.1,
    shadowOutlineColor: 'white',
    shadowOutlineThickness: 3,
};

const DEFAULT_ANIMATED_STRIPED_CONFIG = {
    angles: 30,
    textOutlineThickness: 2,
    textColor: '#fef2d6ff',
    textOutlineColor: '#A0522D',
    stripeColors: ['#A0522D', '#D2691E', '#e18b4dff', '#DEB887'],
    stripeThicknesses: [22, 20, 15, 8],
    stagger: 500,
    sortByAngle: true,
    animationDuration: 1200,
    motionScaleFactor: 5,
    animation: true,
    step: 1,
    shadowOutlineColor: 'white',
    shadowOutlineThickness: 3,
    boundaryElement: 'viewport',
};

const INFINITE_SHADOW_CONFIG = {
	angle: 45,
	textColor: "#ed40fdff",
	shadowColor: "#c52f2fff",
	shadowOutlineColor: "black",
	shadowOutlineThickness: 2,
	textOutlineColor: "black",
	textStrokeThickness: 2,
	shadowLength: 150,
	stagger: 300,
	sortByAngle: false,
	infiniteShadow: true,
	maxShadowLayers: 500,
	boundaryElement: '.effect-card:has(.long-shadow-effect)',
} as const;

const STRIPED_SHADOW_CONFIG = {
	angles: 220,
	textOutlineThickness: 3,
	textColor: '#fef2d6ff',
	textOutlineColor: "#A0522D",
	stripeColors: ['#A0522D', '#D2691E', '#e18b4dff', '#DEB887'],
	stripeThicknesses: [22, 20, 15, 8],
	sortByAngle: true,
} as const;

const ONE_STRIP_SHADOW_CONFIG = {
	angles: 32,
	textOutlineThickness: 3,
	textColor: '#ffffffff',
	stripeColors: ['#A0522D'],
	stripeThicknesses: [28],
	sortByAngle: true,
	shadowOutlineColor: 'transparent',
	shadowOutlineThickness: 0,
	step: 0.2,
} as const;

const THREE_D_STRIPED_SHADOW_CONFIG = {
	angles: [145, 30, 145],
	textOutlineThickness: 3,
	textOutlineColor: "#e7a3b3ff",
	textColor: '#fcf794ff',
	stripeColors: ['#85505fff', '#c05b79ff', '#37433eff'],
	stripeThicknesses: [3, 15, 30],
	sortByAngle: true,
	shadowOutlineColor: 'transparent',
	shadowOutlineThickness: 0,
} as const;

const ANIMATED_STRIPED_CONFIG = {
	angles: 30,
	textOutlineThickness: 3,
	textColor: '#fef2d6ff',
	stripeColors: ['#5e647fff', '#ea8f81ff', '#ffeabaff', '#b3d3c5ff'],
	stripeThicknesses: [22, 20, 15, 8],
	sortByAngle: true,
	stagger: 500,
	animationDuration: 1200,
	motionScaleFactor: 5,
	animation: true,
	
} as const;

const LAYERED_ANIMATED_STRIPED_CONFIG = {
	angles: 155,
	textOutlineThickness: 1,
	textColor: '#fdf55e99',
	textOutlineColor: '#fdf55e',
	stripeColors: ['#fbc506', '#fb6808', '#f93505', '#da0202'],
	stripeThicknesses: 12,
	shadowOutlineColor: 'transparent',
	shadowOutlineThickness: 0,
	sortByAngle: true,
	step: 'layer',
	stagger: 500,
	animationDuration: 1200,
	motionScaleFactor: 5,
	animation: true,
	// boundaryElement: '.effect-content:has(.layered-animated-striped-shadow)',
} as const;

const LAYERED_STRIPED_SHADOW_CONFIG = {
	angles: 155,
	textOutlineThickness: 1,
	textColor: '#fdf55e99',
	textOutlineColor: '#fdf55e',
	stripeColors: ['#fbc506', '#fb6808', '#f93505', '#da0202'],
	stripeThicknesses: 12,
	shadowOutlineColor: 'transparent',
	shadowOutlineThickness: 0,
	sortByAngle: true,
	step: 'layer',
} as const;

const OUTLINED_STRIPED_SHADOW_CONFIG = {
	angles: 150,
	textOutlineThickness: 1,
	textColor: '#ffffff',
	textOutlineColor: 'black',
	stripeColors: ['black', '#3498db', '#3187c0ff', 'black', '#2980b9', '#2b71a0ff', 'black', '#1abc9c', '#16a085'],
	stripeThicknesses: [5, 14, 6, 5, 13, 5, 5, 12, 4],
	shadowOutlineColor: 'black',
	shadowOutlineThickness: 2,
	sortByAngle: true,
} as const;

const effects: EffectConfig[] = [
	{
		id: "web-api-animated-striped-shadow",
		title: "Dynamic Striped Shadow",
		description: "An animated striped shadow effect.",
		className: "striped-shadow-animated inside-card",
		hasAnimation: true,
		backgroundColor: "#d7cfc7ff",
		initEffect: () => applyWebApiAnimatedStripedShadow(".striped-shadow-animated", ANIMATED_STRIPED_CONFIG),
		restartEffect: () => {
			const element = document.querySelector(".striped-shadow-animated.inside-card");
			if (element) applyWebApiAnimatedStripedShadow(".striped-shadow-animated.inside-card", ANIMATED_STRIPED_CONFIG);
		},
		code: `applyWebApiAnimatedStripedShadow(".striped-shadow-animated", ${JSON.stringify(ANIMATED_STRIPED_CONFIG, null, 2)});`,
		textStyle: {
			fontFamily: "'Titan One', sans-serif",
			fontSize: "clamp(2rem, 7vw, 5rem)",
			lineHeight: "1.2em",
		},
		config: ANIMATED_STRIPED_CONFIG,
		effectFn: applyWebApiAnimatedStripedShadow,
        type: 'striped-animated',
	},
	{
		id: "layered-animated-striped-shadow-first",
		title: "LAYERED AND ANIMATED",
		description: "An animated layered striped shadow effect.",
		className: "layered-animated-striped-shadow inside-card",
		hasAnimation: true,
		backgroundColor: "#543ee6ff",
		initEffect: () => applyWebApiAnimatedStripedShadow(".layered-animated-striped-shadow", LAYERED_ANIMATED_STRIPED_CONFIG), // Apply to all elements in document with the class
		restartEffect: () => {
			// Restart the effect only to the specific element inside the card (part of desired card functionality)
			const element = document.querySelector(".layered-animated-striped-shadow.inside-card");
			if (element) applyWebApiAnimatedStripedShadow(".layered-animated-striped-shadow.inside-card", LAYERED_ANIMATED_STRIPED_CONFIG);
		},
		code: `applyWebApiAnimatedStripedShadow(".layered-animated-striped-shadow", ${JSON.stringify(LAYERED_ANIMATED_STRIPED_CONFIG, null, 2)});`,
		textStyle: {
			fontFamily: "'Fugaz One', sans-serif",
			fontSize: "clamp(2.5rem, 9vw, 7rem)",
			lineHeight: "1.2em",
			marginLeft: "clamp(2rem, 12vw, 8.5rem)",
			marginRight: "clamp(1.5rem, 8vw, 6rem)",
			marginTop: "1rem",
			marginBottom: 0,
		},
		config: LAYERED_ANIMATED_STRIPED_CONFIG,
		effectFn: applyWebApiAnimatedStripedShadow,
        type: 'striped-animated',
	},
	{
		id: "layered-striped-shadow",
		title: "LAYERS",
		description: "A striped shadow effect with separated layers.",
		className: "layered-striped-shadow-effect with-grain",
		backgroundColor: "#1698ef",
		initEffect: () => applyStripedShadowSimplified(".layered-striped-shadow-effect", LAYERED_STRIPED_SHADOW_CONFIG),
		code: `applyStripedShadow(".layered-striped-shadow-effect", ${JSON.stringify(LAYERED_STRIPED_SHADOW_CONFIG, null, 2)});`,
		textStyle: {
			fontFamily: "'Fugaz One', sans-serif",
			fontSize: "clamp(2.5rem, 10vw, 8rem)",
			lineHeight: "1.2em"
		},
		cardClassName: "with-grain",
		config: LAYERED_STRIPED_SHADOW_CONFIG,
		effectFn: applyStripedShadowSimplified,
        type: 'striped',
	},
	{
		id: "striped-shadow-one-layer",
		title: "Striped Shadow",
		description: "A striped shadow effect.",
		className: "striped-shadow-effect-one",
		backgroundColor: "#ede9b2ff",
		initEffect: () => applyStripedShadowSimplified(".striped-shadow-effect-one", ONE_STRIP_SHADOW_CONFIG),
		code: `applyStripedShadow(".striped-shadow-effect-one", ${JSON.stringify(ONE_STRIP_SHADOW_CONFIG, null, 2)});`,
		textStyle: {
			fontFamily: "'Titan One', sans-serif",
			fontSize: "clamp(2rem, 7vw, 5rem)",
			lineHeight: "1.2em",
		},
		config: ONE_STRIP_SHADOW_CONFIG,
		effectFn: applyStripedShadowSimplified,
        type: 'striped',
	},
	{
		id: "three-d-striped-shadow",
		title: "3D Striped Shadow",
		description: "A multi-directional striped shadow effect.",
		className: "three-d-striped-shadow-effect",
		backgroundColor: "#8ea2b1ff",
		initEffect: () => applyStripedShadowSimplified(".three-d-striped-shadow-effect", THREE_D_STRIPED_SHADOW_CONFIG),
		code: `applyStripedShadow(".three-d-striped-shadow-effect", ${JSON.stringify(THREE_D_STRIPED_SHADOW_CONFIG, null, 2)});`,
		textStyle: {
			fontFamily: "'Titan One', sans-serif",
			fontSize: "clamp(2rem, 7vw, 5rem)",
			lineHeight: "1.2em",
		},
		config: THREE_D_STRIPED_SHADOW_CONFIG,
		effectFn: applyStripedShadowSimplified,
        type: 'striped',
	},
	{
		id: "outlined-striped-shadow",
		title: "OUTLINED",
		description: "A striped shadow effect with outlined stripes.",
		className: "outlined-striped-shadow-effect",
		backgroundColor: "#ecf0f1",
		initEffect: () => applyStripedShadowSimplified(".outlined-striped-shadow-effect", OUTLINED_STRIPED_SHADOW_CONFIG),
		code: `applyStripedShadow(".outlined-striped-shadow-effect", ${JSON.stringify(OUTLINED_STRIPED_SHADOW_CONFIG, null, 2)});`,
		textStyle: {
			fontFamily: "'Titan One', sans-serif",
			fontSize: "clamp(2rem, 7vw, 5rem)",
			lineHeight: "1.2em",
		},
		config: OUTLINED_STRIPED_SHADOW_CONFIG,
		effectFn: applyStripedShadowSimplified,
        type: 'striped',
	},
	{
		id: "striped-shadow",
		title: "Striped Shadow",
		description: "A striped shadow effect.",
		className: "striped-shadow-effect",
		backgroundColor: "#cebaa2ff",
		initEffect: () => applyStripedShadowSimplified(".striped-shadow-effect", STRIPED_SHADOW_CONFIG),
		code: `applyStripedShadow(".striped-shadow-effect", ${JSON.stringify(STRIPED_SHADOW_CONFIG, null, 2)});`,
		textStyle: {
			fontFamily: "'Titan One', sans-serif",
			fontSize: "clamp(2rem, 7vw, 5rem)",
			lineHeight: "1.2em",
		},
		config: STRIPED_SHADOW_CONFIG,
		effectFn: applyStripedShadowSimplified,
        type: 'striped',
	},
	{
		id: "infinite-shadow",
		title: "Animated Infinite Shadow",
		description: "An animated long shadow effect.",
		className: "long-shadow-effect inside-card",
		hasAnimation: true,
		backgroundColor: "#e9928bff",
		initEffect: () => applyLongShadow(".long-shadow-effect", INFINITE_SHADOW_CONFIG),
		restartEffect: () => {
			const element = document.querySelector(".long-shadow-effect.inside-card");
			if (element) applyLongShadow(".long-shadow-effect.inside-card", INFINITE_SHADOW_CONFIG);
		},
		code: `applyLongShadow(".long-shadow-effect", ${JSON.stringify(INFINITE_SHADOW_CONFIG, null, 2)});`,
		textStyle: {
			fontFamily: "'Pacifico', cursive",
			fontSize: "clamp(2.5rem, 8vw, 6rem)",
		},
		config: INFINITE_SHADOW_CONFIG,
		effectFn: applyLongShadow,
        type: 'infinite',
	}
];

const staticEffects = effects.filter(effect => !effect.hasAnimation);
const animatedEffects = effects.filter(effect => effect.hasAnimation);

function App() {
	const [editorMode, setEditorMode] = useState(false);
	const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
	const [currentConfig, setCurrentConfig] = useState<Record<string, unknown> | null>(null);
    const [showCodeOverlay, setShowCodeOverlay] = useState(false);
    const [restartTrigger, setRestartTrigger] = useState(0);

	const previewRef = useRef<HTMLHeadingElement>(null);

    const getFullConfig = (effect: EffectConfig) => {
        let defaults = {};
        if (effect.type === 'infinite') defaults = DEFAULT_INFINITE_SHADOW_CONFIG;
        else if (effect.type === 'striped') defaults = DEFAULT_STRIPED_SHADOW_CONFIG;
        else if (effect.type === 'striped-animated') defaults = DEFAULT_ANIMATED_STRIPED_CONFIG;
        
        // Deep copy defaults to ensure no reference sharing and include all available parameters
        const defaultsCopy = JSON.parse(JSON.stringify(defaults));
        return { ...defaultsCopy, ...effect.config };
    };

	const handleEdit = (effect: EffectConfig) => {
		setSelectedEffectId(effect.id);
		setCurrentConfig(getFullConfig(effect));
		setEditorMode(true);
        setShowCodeOverlay(false);
	};

	const handleConfigChange = (newConfig: Record<string, unknown>) => {
		setCurrentConfig(newConfig);
	};
    
    const handleCloseEditor = () => {
        setEditorMode(false);
        // selectedEffectId is purposely not cleared to allow exit animation
    };

    const handleReset = () => {
        if (selectedEffect) {
            setCurrentConfig(getFullConfig(selectedEffect));
        }
    };

    const handleRestart = () => {
        setRestartTrigger(prev => prev + 1);
    };

    const handleShowCode = () => {
        setShowCodeOverlay(true);
    };

    const handleCloseCode = () => {
        setShowCodeOverlay(false);
    };

	const selectedEffect = effects.find(e => e.id === selectedEffectId);

    // Scroll selected card into view when returning to gallery mode
    useEffect(() => {
        if (!editorMode && selectedEffectId) {
            const start = performance.now();
            const duration = 650;

            const animateScroll = (now: number) => {
                const element = document.getElementById(selectedEffectId)?.closest('.effect-card');
                if (element) {
                    element.scrollIntoView({ behavior: 'auto', block: 'center' });
                }
                
                if (now - start < duration) {
                    requestAnimationFrame(animateScroll);
                }
            };
            requestAnimationFrame(animateScroll);
        }
    }, [editorMode, selectedEffectId]);

	useEffect(() => {
		if (selectedEffect && previewRef.current && currentConfig) {
            let cleanupFn: (() => void) | void = undefined;
            
			// Small timeout to ensure DOM is ready and clear previous effects if needed
			const timer = setTimeout(() => {
				// We need to target the element inside the preview card
				// Using a unique class for the preview to avoid conflict with sidebar
				const previewSelector = ".preview-effect-content";
                // Only run effect if preview element exists (it might be hidden but exists)
                if (document.querySelector(previewSelector)) {
				    cleanupFn = selectedEffect.effectFn(previewSelector, currentConfig);
                }
			}, 50);
            
			return () => {
                clearTimeout(timer);
                if (cleanupFn) cleanupFn();
            };
		}
	}, [editorMode, selectedEffect, currentConfig, restartTrigger]);

	return (
		<div className={`App ${editorMode ? 'editor-mode' : ''}`}>
			<h1>TEXT SHADOW EFFECTS GALLERY</h1>

			<div className={`main-content-wrapper ${editorMode ? 'shrunk' : ''}`}>
				<section className="effects-section">
					<h2 className={`section-title ${editorMode ? 'hidden' : ''}`}>Static Effects</h2>
					{staticEffects.map((effect) => (
						<EffectCard
							key={effect.id}
							id={effect.id}
							title={effect.title}
							description={effect.description}
							className={effect.className}
							code={effect.code}
							hasAnimation={effect.hasAnimation}
							onInit={effect.initEffect}
							onRestart={effect.restartEffect}
							backgroundColor={effect.backgroundColor}
							textStyle={effect.textStyle}
							cardStyle={effect.cardStyle}
							cardClassName={`${effect.cardClassName || ''} ${selectedEffectId === effect.id ? 'selected-card' : ''}`}
							onEdit={() => handleEdit(effect)}
							onClick={() => editorMode && handleEdit(effect)}
						/>
					))}
				</section>

				<section className="effects-section">
					<h2 className={`section-title ${editorMode ? 'hidden' : ''}`}>Animated Effects</h2>
					{animatedEffects.map((effect) => (
						<EffectCard
							key={effect.id}
							id={effect.id}
							title={effect.title}
							description={effect.description}
							className={effect.className}
							code={effect.code}
							hasAnimation={effect.hasAnimation}
							onInit={effect.initEffect}
							onRestart={effect.restartEffect}
							backgroundColor={effect.backgroundColor}
							textStyle={effect.textStyle}
							cardStyle={effect.cardStyle}
							cardClassName={`${effect.cardClassName || ''} ${selectedEffectId === effect.id ? 'selected-card' : ''}`}
							onEdit={() => handleEdit(effect)}
							onClick={() => editorMode && handleEdit(effect)}
						/>
					))}
				</section>
			</div>

			{selectedEffect && (
				<div className={`editor-container ${!editorMode ? 'closing' : ''}`}>
					<button className="close-editor-btn" onClick={handleCloseEditor} aria-label="Close Editor">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
					</button>
					<div className="preview-area">
                        <div className="preview-wrapper">
                            <div 
                                className={`effect-card preview-card ${selectedEffect.cardClassName || ''}`} 
                                style={{ backgroundColor: selectedEffect.backgroundColor, ...selectedEffect.cardStyle }}
                            >
                                <div className="effect-content">
                                    <h2 
                                        ref={previewRef}
                                        className={`preview-effect-content ${selectedEffect.className.split(' ')[0]}`} 
                                        style={selectedEffect.textStyle}
                                    >
                                        {selectedEffect.title}
                                    </h2>
                                </div>
                                {showCodeOverlay && (
                                    <div className="code-overlay" onClick={handleCloseCode}>
                                        <button className="close-overlay" onClick={handleCloseCode} aria-label="Close code view">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                        <div className="code-content" onClick={(e) => e.stopPropagation()}>
                                            <Highlight theme={themes.oneDark} code={selectedEffect.code.replace(JSON.stringify(selectedEffect.config, null, 2), JSON.stringify(currentConfig, null, 2))} language="javascript">
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
                            <div className="preview-actions">
                                <button 
                                    className={`action-btn ${!selectedEffect.hasAnimation ? 'disabled' : ''}`} 
                                    onClick={selectedEffect.hasAnimation ? handleRestart : undefined} 
                                    disabled={!selectedEffect.hasAnimation}
                                    aria-label="Restart Animation"
                                    title="Restart Animation"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                </button>
                                <button className="action-btn" onClick={handleReset} aria-label="Reset to Default" title="Reset">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                                </button>
                                <button className="action-btn" onClick={handleShowCode} aria-label="Show Code" title="View Code">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                                </button>
                            </div>
                        </div>
					</div>
					<div className="config-panel-area">
						<ConfigPanel 
							config={currentConfig} 
							onConfigChange={handleConfigChange} 
						/>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
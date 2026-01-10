import EffectCard from "./components/EffectCard";
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
}

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
			fontSize: "6rem",
		},
	},
	{
		id: "web-api-animated-striped-shadow",
		title: "Dynamic Striped Shadow",
		description: "An animated striped shadow effect using Web Animations API.",
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
			fontSize: "5rem",
			lineHeight: "1.2em",
		},
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
			fontSize: "7rem",
			lineHeight: "1.2em",
			marginLeft: "8.5rem",
			marginRight: "6rem",
			marginTop: "1rem",
			marginBottom: 0,
		},
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
			fontSize: "8rem",
			lineHeight: "1.2em"
		},
		cardClassName: "with-grain",
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
			fontSize: "5rem",
			lineHeight: "1.2em",
		},
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
			fontSize: "5rem",
			lineHeight: "1.2em",
		},
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
			fontSize: "5rem",
			lineHeight: "1.2em",
		},
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
			fontSize: "5rem",
			lineHeight: "1.2em",
		},
	}
];

const staticEffects = effects.filter(effect => !effect.hasAnimation);
const animatedEffects = effects.filter(effect => effect.hasAnimation);

function App() {
	return (
		<div className="App">
			{/* <h1>Text Shadow Effects Gallery</h1> */}
			<h1>TEXT SHADOW EFFECTS GALLERY</h1>

			<section className="effects-section">
				<h2 className="section-title">Static Effects</h2>
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
						cardClassName={effect.cardClassName}
					/>
				))}
			</section>

			<section className="effects-section">
				<h2 className="section-title">Animated Effects</h2>
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
						cardClassName={effect.cardClassName}
					/>
				))}
			</section>

			{/* <h2 className="layered-animated-striped-shadow" style={{ 
				fontFamily: "'Fugaz One', sans-serif",
				fontSize: '8rem',
				textAlign: 'center', 
				marginTop: '4rem', 
				marginBottom: '4rem' 
			}}>
				TEST SHADOW
			</h2> */}
		</div>
	);
}

export default App;

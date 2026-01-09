export function applyStripedShadow(selector, options = {}) {
    const STYLE_ID = 'striped-shadow-styles';

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        // font-family: 'Titan One', sans-serif;
        //         font-size: 11rem;
        //         line-height: 1.2em;

        const css = `
            @import url('https://fonts.googleapis.com/css2?family=Titan+One&display=swap');

            .striped-shadow-container {
                -webkit-font-smoothing: antialiased;
                text-rendering: geometricPrecision;
                position: relative;
                isolation: isolate;
            }

            .striped-shadow-anim-word {
                position: relative;
                display: inline-block;
            }
            @keyframes fly-in {
                from {
                    transform: var(--start-transform);
                }
                to {
                    transform: translate(0, 0);
                }
            }
            .striped-shadow-anim-word.animate {
                animation-name: fly-in;
                animation-timing-function: ease-out;
                animation-fill-mode: forwards;
            }
        `;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    injectStyles();

    document.querySelectorAll(selector).forEach(element => {
        const defaults = {
            angle: 30,
            textOutlineThickness: 2,
            textColor: '#fef2d6ff',
            stripeColors: ['#A0522D', '#D2691E', '#e18b4dff', '#DEB887'],
            stripeThicknesses: [22, 20, 15, 8],
            stagger: 500,
            sortByAngle: true,
            animationDuration: 1200,
            motionScaleFactor: 5,
            motionVelocityFactor: 0.05,
            animation: false,
            step: 1,
            shadowOutlineColor: 'white',
            shadowOutlineThickness: 3,
        };

        const config = { ...defaults, ...options };

        element.classList.add('striped-shadow-container');

        const animation = {
            isAnimating: false,
            lastFrameTime: 0,
            rafId: null,
            finishedAnimations: 0,
            spanStates: new Map(),
        };

        // Wrap words
        const text = element.textContent;
        const words = text.trim().split(' ');
        element.innerHTML = words.map(word => `<span class="striped-shadow-anim-word">${word}</span>`).join(' ');
        const allShadowSpans = element.querySelectorAll('.striped-shadow-anim-word');

        element.style.webkitTextStroke = `${config.textOutlineThickness}px ${config.stripeColors[0]}`;
        element.style.textStroke = `${config.textOutlineThickness}px ${config.stripeColors[0]}`;

        // Apply configurable outline filter
        const t = config.shadowOutlineThickness;
        const c = config.shadowOutlineColor;
        element.style.filter = `
            drop-shadow(${t}px 0 0 ${c}) 
            drop-shadow(-${t}px 0 0 ${c}) 
            drop-shadow(0 ${t}px 0 ${c}) 
            drop-shadow(0 -${t}px 0 ${c})
            drop-shadow(${t}px ${t}px 0 ${c})
            drop-shadow(-${t}px -${t}px 0 ${c})
            drop-shadow(${t}px -${t}px 0 ${c})
            drop-shadow(-${t}px ${t}px 0 ${c})
        `.trim();

        function sortSpansByAngle(spansArray) {
            const isShadowUp = config.angle > 180 && config.angle < 360;
            const isShadowLeft = config.angle > 90 && config.angle < 270;

            return spansArray.sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                if (isShadowUp) {
                    if (rectA.top !== rectB.top) return rectB.top - rectA.top;
                } else {
                    if (rectA.top !== rectB.top) return rectA.top - rectB.top;
                }
                if (isShadowLeft) {
                    return rectB.left - rectA.left;
                } else {
                    return rectA.left - rectB.left;
                }
            });
        }

        function updateShadow() {
            const rad = config.angle * (Math.PI / 180);
            element.style.color = config.textColor;

            const shadowCache = new Map();

            allShadowSpans.forEach(span => {
                const state = animation.spanStates.get(span);
                const scale = state ? state.shadowScale : 1;
                const cacheKey = Math.round(scale * 100);

                if (shadowCache.has(cacheKey)) {
                    span.style.textShadow = shadowCache.get(cacheKey);
                    return;
                }

                let shadows = [];
                let cumulativeThickness = 0;

                for (let i = 0; i < config.stripeThicknesses.length; i++) {
                    const thickness = config.stripeThicknesses[i] * scale;
                    const color = config.stripeColors[i % config.stripeColors.length];
                    
                    for (let j = 0; j < thickness; j += config.step) {
                        const distance = cumulativeThickness + j;
                        const x = Math.round(Math.cos(rad) * distance);
                        const y = Math.round(Math.sin(rad) * distance);
                        shadows.push(`${x}px ${y}px 0 ${color}`);
                    }
                    cumulativeThickness += thickness;
                }
                
                const combinedShadow = shadows.join(',\n');
                span.style.textShadow = combinedShadow;
                shadowCache.set(cacheKey, combinedShadow);
            });

            let spansArray = Array.from(allShadowSpans);
            if (config.sortByAngle) {
                spansArray = sortSpansByAngle(spansArray);
            }
            spansArray.forEach((span, index) => {
                span.style.zIndex = index + 1;
            });
        }

        function playAnimation() {
            const rad = config.angle * (Math.PI / 180);
            const animationDistance = Math.hypot(window.innerWidth, window.innerHeight) + 100;
            const startX = Math.round(Math.cos(rad) * animationDistance);
            const startY = Math.round(Math.sin(rad) * animationDistance);

            // Set the starting position for the animation via a CSS custom property.
            document.documentElement.style.setProperty('--start-transform', `translate(${startX}px, ${startY}px)`);

            let spansArray = Array.from(allShadowSpans);
            
            // Immediately move spans to their starting position before any shadow is rendered
            spansArray.forEach(span => {
                span.classList.remove('animate');
                span.style.transform = `translate(${startX}px, ${startY}px)`; // Move off-screen NOW
            });

            // Use a timeout to ensure the browser processes the transform before starting the animation.
            setTimeout(() => {
                if (config.sortByAngle) {
                    spansArray = sortSpansByAngle(spansArray);
                }

                // Initialize state for each span
                animation.spanStates.clear();
                spansArray.forEach(span => {
                    animation.spanStates.set(span, {
                        lastTransformY: startY,
                        shadowScale: 1,
                    });
                });

                animation.finishedAnimations = 0;

                spansArray.forEach((span, index) => {
                    // Set only the dynamic properties in JS, leave the rest to CSS
                    span.style.animationDuration = `${config.animationDuration}ms`;
                    span.style.animationDelay = `${index * config.stagger}ms`;
                    
                    span.addEventListener('animationend', () => {
                        span.style.transform = ''; // Clear inline transform to allow 'forwards' to work
                        animation.finishedAnimations++;
                        // The motion blur loop will stop itself when all animations are settled.
                    }, { once: true });

                    span.classList.add('animate');
                });

                // Start the motion blur loop
                animation.isAnimating = true;
                if (animation.rafId) {
                    cancelAnimationFrame(animation.rafId);
                }
                animation.rafId = requestAnimationFrame(motionBlurLoop);

            }, 10);
        }

        function motionBlurLoop() {
            if (!animation.isAnimating) return;

            const now = performance.now();
            const elapsedSinceLastFrame = now - animation.lastFrameTime;
            if (elapsedSinceLastFrame < 16) { // Target ~60fps
                animation.rafId = requestAnimationFrame(motionBlurLoop);
                return;
            }
            animation.lastFrameTime = now;

            let allSettled = true;

            allShadowSpans.forEach(span => {
                const state = animation.spanStates.get(span);
                if (!state) return;

                const style = getComputedStyle(span);
                const matrix = new DOMMatrix(style.transform);
                const currentY = matrix.m42;
                
                const velocity = Math.abs(currentY - state.lastTransformY);
                state.lastTransformY = currentY;

                const targetScale = 1 + velocity * config.motionScaleFactor * config.motionVelocityFactor;
                const smoothingFactor = 0.05; // Slower for smoother deceleration
                
                state.shadowScale += (targetScale - state.shadowScale) * smoothingFactor;

                // A span is not settled if its shadow is still visibly scaled.
                if (Math.abs(state.shadowScale - 1) > 0.001) {
                    allSettled = false;
                }
            });

            updateShadow();

            // If all fly-in animations are done AND all shadows have settled, stop the loop.
            if (animation.finishedAnimations === allShadowSpans.length && allSettled) {
                animation.isAnimating = false;
                // Final clean render to ensure everything is perfect
                updateShadow(); 
            } else {
                animation.rafId = requestAnimationFrame(motionBlurLoop);
            }
        }

        updateShadow();
        if (config.animation) {
            playAnimation();
        }
    });
}
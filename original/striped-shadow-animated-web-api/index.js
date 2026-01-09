export function applyStripedShadow(selector, options = {}) {
    const STYLE_ID = 'striped-shadow-styles';

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const css = `
            @import url('https://fonts.googleapis.com/css2?family=Titan+One&display=swap');

            @property --shadow-scale {
                syntax: '<number>';
                inherits: false;
                initial-value: 1;
            }

            .striped-shadow-container {
                font-family: 'Titan One', sans-serif;
                font-size: 11rem;
                line-height: 1.2em;
                -webkit-font-smoothing: antialiased;
                text-rendering: geometricPrecision;

                /* Stacking context for z-index */
                position: relative;
                isolation: isolate;

                /* White outline effect */
                filter: 
                    drop-shadow(3px 0 0 white) 
                    drop-shadow(-3px 0 0 white) 
                    drop-shadow(0 3px 0 white) 
                    drop-shadow(0 -3px 0 white)
                    drop-shadow(3px 3px 0 white)
                    drop-shadow(-2px -2px 0 white)
                    drop-shadow(3px -2px 0 white)
                    drop-shadow(-2px 3px 0 white);
            }

            .striped-shadow-anim-word {
                position: relative;
                display: inline-block;
            }
        `;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    injectStyles();
    
    document.querySelectorAll(selector).forEach(element => {
        // Add a class to the container element for styling
        element.classList.add('striped-shadow-container');
        
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
            animation: false
        };

        const config = { ...defaults, ...options };


        if (config.animation) {
            element.style.opacity = 0;
        }

        const animation = {
            activeAnimations: [],
        };

        // Wrap words
        const text = element.textContent;
        const words = text.trim().split(' ');
        element.innerHTML = words.map(word => `<span class="striped-shadow-anim-word">${word}</span>`).join(' ');
        const allShadowSpans = element.querySelectorAll('.striped-shadow-anim-word');

        element.style.webkitTextStroke = `${config.textOutlineThickness}px ${config.stripeColors[0]}`;
        element.style.textStroke = `${config.textOutlineThickness}px ${config.stripeColors[0]}`;

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
                const scale = parseFloat(getComputedStyle(span).getPropertyValue('--shadow-scale'));
                const cacheKey = Math.round(scale * 100);

                if (shadowCache.has(cacheKey)) {
                    span.style.textShadow = shadowCache.get(cacheKey);
                    return;
                }

                const scaledThicknesses = config.stripeThicknesses.map(t => t * scale);
                let shadows = [];
                let cumulativeThickness = 0;

                for (let i = 0; i < config.stripeColors.length; i++) {
                    const color = config.stripeColors[i];
                    const thickness = scaledThicknesses[i % scaledThicknesses.length] || 0;
                    
                    for (let j = 1; j <= thickness; j++) {
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
            const elementRect = element.getBoundingClientRect();
            const animationDistance = Math.hypot(window.innerWidth, window.innerHeight) + Math.hypot(elementRect.width, elementRect.height) + 100;
            const startX = Math.round(Math.cos(rad) * animationDistance);
            const startY = Math.round(Math.sin(rad) * animationDistance);

            let spansArray = Array.from(allShadowSpans);
            if (config.sortByAngle) {
                spansArray = sortSpansByAngle(spansArray);
            }

            animation.activeAnimations.forEach(anim => anim.cancel());
            animation.activeAnimations = [];

            // Frame 1: Apply the initial off-screen transform
            requestAnimationFrame(() => {
                spansArray.forEach(span => {
                    span.style.transform = `translate(${startX}px, ${startY}px)`;
                });

                // Frame 2: Make visible and start the animation
                requestAnimationFrame(() => {
                    element.style.opacity = 1;

                    spansArray.forEach((span, index) => {
                        const keyframes = [
                            { transform: `translate(${startX}px, ${startY}px)`, offset: 0 },
                            { transform: 'translate(0, 0)', offset: 1 }
                        ];
                        const options = {
                            duration: config.animationDuration,
                            delay: index * config.stagger,
                            easing: 'cubic-bezier(0.1, 0.7, 0.3, 1)',
                            fill: 'forwards'
                        };
                        const waapiAnimation = span.animate(keyframes, options);
                        animation.activeAnimations.push(waapiAnimation);

                        const shadowScaleAnimation = span.animate(
                            [
                                { '--shadow-scale': 1 },
                                { '--shadow-scale': config.motionScaleFactor },
                                { '--shadow-scale': 1 }
                            ],
                            { 
                                duration: config.animationDuration, 
                                delay: index * config.stagger,
                                easing: 'ease-out',
                                fill: 'forwards'
                            }
                        );
                        animation.activeAnimations.push(shadowScaleAnimation);
                    });

                    function shadowRenderLoop() {
                        updateShadow();
                        if (animation.activeAnimations.some(anim => anim.playState === 'running')) {
                            requestAnimationFrame(shadowRenderLoop);
                        } else {
                            allShadowSpans.forEach(span => {
                                span.style.setProperty('--shadow-scale', '1');
                                span.style.transform = ''; // Clear the transform after animation
                            });
                            updateShadow();
                        }
                    }
                    requestAnimationFrame(shadowRenderLoop);
                });
            });
        }

        allShadowSpans.forEach(span => span.style.setProperty('--shadow-scale', '1'));
        updateShadow();

        if (config.animation) {
            playAnimation();
        }
    });
}
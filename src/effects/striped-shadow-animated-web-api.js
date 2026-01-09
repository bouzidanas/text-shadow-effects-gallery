export function applyStripedShadow(selector, options = {}) {
    const STYLE_ID = 'striped-shadow-animated-styles';

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

            .striped-shadow-animated-container {
                -webkit-font-smoothing: antialiased;
                text-rendering: geometricPrecision;

                /* Stacking context for z-index */
                position: relative;
                isolation: isolate;
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
    
    document.querySelectorAll(selector).forEach((element, elementIndex) => {
        // Add a class to the container element for styling
        element.classList.add('striped-shadow-animated-container');
        
        // Add a unique identifier to this instance
        const instanceId = `instance-${Date.now()}-${elementIndex}`;
        element.dataset.instanceId = instanceId;
        
        const defaults = {
            angles: 30, // single angle or array [30, 45, 60] for multi-directional shadows
            textOutlineThickness: 2,
            textColor: '#fef2d6ff',
            stripeColors: ['#A0522D', '#D2691E', '#e18b4dff', '#DEB887'],
            stripeThicknesses: [22, 20, 15, 8],
            stagger: 500,
            sortByAngle: true,
            animationDuration: 1200,
            motionScaleFactor: 5,
            animation: false,
            step: 1,
            shadowOutlineColor: 'white',
            shadowOutlineThickness: 3,
            boundaryElement: 'viewport', // 'self', 'parent', 'viewport', or a selector string
        };

        const config = { ...defaults, ...options };
        
        // Normalize stripeThicknesses: if single number, repeat for each color
        if (typeof config.stripeThicknesses === 'number') {
            config.stripeThicknesses = Array(config.stripeColors.length).fill(config.stripeThicknesses);
        }


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

        const outlineColor = config.textOutlineColor || config.stripeColors[0];
        element.style.webkitTextStroke = `${config.textOutlineThickness}px ${outlineColor}`;
        element.style.textStroke = `${config.textOutlineThickness}px ${outlineColor}`;

        // Apply configurable outline filter
        const t = config.shadowOutlineThickness;
        const c = config.shadowOutlineColor;
        const adjustedT = c === outlineColor
            ? (t - config.textOutlineThickness >= 0
                ? t - config.textOutlineThickness
                : 0
            )
            : t-1? t-2:(t? t-1:t);
        element.style.filter = `
            drop-shadow(${t}px 0 0 ${c}) 
            drop-shadow(-${t-1? t-2:(t? t-1:t)}px 0 0 ${c}) 
            drop-shadow(0 ${t}px 0 ${c}) 
            drop-shadow(0 -${adjustedT}px 0 ${c})
            drop-shadow(${t}px ${t}px 0 ${c})
            drop-shadow(-${t}px -${t}px 0 ${c})
            drop-shadow(${t}px -${t}px 0 ${c})
            drop-shadow(-${t}px ${t}px 0 ${c})
        `.trim();

        function sortSpansByAngle(spansArray) {
            // Normalize angles to array, use first angle for sorting
            const angleArray = Array.isArray(config.angles) ? config.angles : [config.angles];
            const sortAngle = angleArray[0];
            const isShadowUp = sortAngle > 180 && sortAngle < 360;
            const isShadowLeft = sortAngle > 90 && sortAngle < 270;

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
            // Normalize angles to array
            const angleArray = Array.isArray(config.angles) ? config.angles : [config.angles];
            element.style.color = config.textColor;

            const shadowCache = new Map();

            allShadowSpans.forEach(span => {
                const scale = parseFloat(getComputedStyle(span).getPropertyValue('--shadow-scale')) || 1;
                const cacheKey = Math.round(scale * 100);

                if (shadowCache.has(cacheKey)) {
                    span.style.textShadow = shadowCache.get(cacheKey);
                    return;
                }

                const scaledThicknesses = config.stripeThicknesses.map(t => t * scale);
                let shadows = [];
                let cumulativeX = 0;
                let cumulativeY = 0;

                for (let i = 0; i < config.stripeColors.length; i++) {
                    const color = config.stripeColors[i];
                    const thickness = scaledThicknesses[i % scaledThicknesses.length] || 0;
                    const angleIndex = i % angleArray.length;
                    const rad = angleArray[angleIndex] * (Math.PI / 180);
                    
                    // If step is 'auto', use the current stripe thickness as the step
                    const step = config.step === 'layer' ? thickness : config.step;
                    
                    for (let j = step; j <= thickness; j += step) {
                        const x = Math.round(cumulativeX + Math.cos(rad) * j);
                        const y = Math.round(cumulativeY + Math.sin(rad) * j);
                        shadows.push(`${x}px ${y}px 0 ${color}`);
                    }
                    
                    // Update cumulative position to continue from where this stripe ended
                    cumulativeX += Math.cos(rad) * thickness;
                    cumulativeY += Math.sin(rad) * thickness;
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
            // Use the first angle for animation direction
            const angleArray = Array.isArray(config.angles) ? config.angles : [config.angles];
            const primaryAngle = angleArray[0];
            const rad = primaryAngle * (Math.PI / 180);
            
            // Determine the boundary for animation distance calculation
            let boundaryWidth, boundaryHeight;
            
            if (config.boundaryElement === 'viewport') {
                boundaryWidth = window.innerWidth;
                boundaryHeight = window.innerHeight;
            } else if (config.boundaryElement === 'self') {
                const rect = element.getBoundingClientRect();
                boundaryWidth = rect.width;
                boundaryHeight = rect.height;
            } else if (config.boundaryElement === 'parent') {
                const parent = element.parentElement;
                const rect = parent ? parent.getBoundingClientRect() : element.getBoundingClientRect();
                boundaryWidth = rect.width;
                boundaryHeight = rect.height;
            } else if (typeof config.boundaryElement === 'string') {
                // Custom selector - search entire document
                const boundaryEl = document.querySelector(config.boundaryElement);
                
                if (boundaryEl && (boundaryEl.contains(element) || boundaryEl === element)) {
                    // Element found and either contains or is the text element
                    const rect = boundaryEl.getBoundingClientRect();
                    boundaryWidth = rect.width;
                    boundaryHeight = rect.height;
                } else {
                    // Fallback to viewport if element not found or doesn't contain text
                    console.warn(`Boundary element "${config.boundaryElement}" not found or doesn't contain text element`);
                    boundaryWidth = window.innerWidth;
                    boundaryHeight = window.innerHeight;
                }
            } else {
                // Default fallback
                boundaryWidth = window.innerWidth;
                boundaryHeight = window.innerHeight;
            }
            
            const elementRect = element.getBoundingClientRect();
            const animationDistance = 0.6*(Math.hypot(boundaryWidth, boundaryHeight) + Math.hypot(elementRect.width, elementRect.height)) + 100;
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
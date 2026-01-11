export function applyLongShadow(selector, options = {}) {
    const STYLE_ID = 'long-shadow-styles';

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const css = `
            @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');

            .long-shadow-container {
                -webkit-text-stroke: var(--text-stroke-thickness) var(--text-outline-color);
                text-stroke: var(--text-stroke-thickness) var(--text-outline-color);
                position: relative;
                isolation: isolate;
                visibility: hidden; /* Initially hide to prevent FOUC */
            }

            .long-shadow-word {
                position: relative;
                display: inline-block;
                opacity: 0; /* Initially invisible */
                transform: var(--start-transform); /* Start off-screen, value set by JS */
                /* Apply a filter to each word for the outline effect */
                filter: 
                    drop-shadow(calc(var(--shadow-outline-thickness) + 1px) 0 0 var(--shadow-outline-color)) 
                    drop-shadow(calc(var(--shadow-outline-thickness) * -1) 0 0 var(--shadow-outline-color)) 
                    drop-shadow(0 var(--shadow-outline-thickness) 0 var(--shadow-outline-color)) 
                    drop-shadow(0 calc(var(--shadow-outline-thickness)*-1) 0 var(--shadow-outline-color))
                    drop-shadow(var(--shadow-outline-thickness) var(--shadow-outline-thickness) 0 var(--shadow-outline-color))
                    drop-shadow(calc(var(--shadow-outline-thickness) * -1) calc(var(--shadow-outline-thickness) * -1) 0 var(--shadow-outline-color))
                    drop-shadow(var(--shadow-outline-thickness) calc(var(--shadow-outline-thickness) * -1) 0 var(--shadow-outline-color))
                    drop-shadow(calc(var(--shadow-outline-thickness) * -1) var(--shadow-outline-thickness) 0 var(--shadow-outline-color));
            }
            @keyframes fly-in {
                from {
                    transform: var(--start-transform);
                    opacity: 1;
                }
                to {
                    transform: translate(0, 0);
                    opacity: 1;
                }
            }
            .long-shadow-word.animate {
                animation: fly-in 1s ease-out forwards;
            }
        `;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    injectStyles();

    // ==========================================================================
    // 1. CONFIGURATION
    // All parameters are controlled from this single object.
    // ==========================================================================
    const defaults = {
        angle: 45,
        textColor: '#ed40fdff',
        shadowColor: '#c52f2fff',
        shadowOutlineColor: 'black',
        shadowOutlineThickness: 2, // in pixels
        textOutlineColor: 'black',
        textStrokeThickness: 2, // in pixels
        shadowLength: 150,
        stagger: 300, // milliseconds
        sortByAngle: false, // 'true' for angle-based sort, 'false' for DOM order
        infiniteShadow: true, // 'true' for shadow to extend off-screen
        maxShadowLayers: 1000, // Maximum number of shadow layers to prevent performance issues
        boundaryElement: 'viewport', // 'self', 'parent', 'viewport', or a selector string
    };

    const config = { ...defaults, ...options };

    // ==========================================================================
    // 2. INITIALIZATION
    // Sets up the page by wrapping words and preparing elements.
    // ==========================================================================
    
    // Dynamically set the initial off-screen position before doing anything else.
    // This prevents a race condition and removes the need for a CSS fallback.
    const rad = config.angle * (Math.PI / 180);
    const animationDistance = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 100;
    const startX = Math.round(Math.cos(rad) * animationDistance);
    const startY = Math.round(Math.sin(rad) * animationDistance);
    document.documentElement.style.setProperty('--start-transform', `translate(${startX}px, ${startY}px)`);

    document.querySelectorAll(selector).forEach(el => {
        el.classList.add('long-shadow-container');
        const text = el.textContent;
        const words = text.trim().split(' ');
        el.innerHTML = words.map(word => `<span class="long-shadow-word">${word}</span>`).join(' ');
        
        // Select the elements scoped to THIS specific container
        const allShadowSpans = el.querySelectorAll('.long-shadow-word');
        const longShadowContainer = el;

        // Make the container visible now that setup is complete and words are positioned off-screen.
        if (longShadowContainer) {
            longShadowContainer.style.visibility = 'visible';
        }

        // ==========================================================================
        // 3. CORE LOGIC
        // The main functions that create the shadow and animation effects.
        // ==========================================================================

        /**
         * Sorts an array of word spans based on their position on the screen
         * relative to the shadow angle. This is used for both z-index stacking
         * and for the animation stagger order.
         * @param {Array} spansArray - The array of span elements to sort.
         * @returns {Array} The sorted array of span elements.
         */
        function sortSpansByAngle(spansArray) {
            const isShadowUp = config.angle > 180 && config.angle < 360;
            const isShadowLeft = config.angle > 90 && config.angle < 270;

            return spansArray.sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                
                // Vertical sort
                if (isShadowUp) {
                    if (rectA.top !== rectB.top) return rectB.top - rectA.top;
                } else {
                    if (rectA.top !== rectB.top) return rectA.top - rectB.top;
                }
                
                // Horizontal sort (as a tie-breaker)
                if (isShadowLeft) {
                    return rectB.left - rectA.left;
                } else {
                    return rectA.left - rectB.left;
                }
            });
        }

        /**
         * Calculates and applies the long shadow effect to the text.
         */
        function updateShadow() {
            const rad = config.angle * (Math.PI / 180);

            // Set the text color and outline color of the main element.
            if (longShadowContainer) {
                longShadowContainer.style.color = config.textColor;
                longShadowContainer.style.setProperty('--shadow-outline-color', config.shadowOutlineColor);
                longShadowContainer.style.setProperty('--shadow-outline-thickness', `${config.shadowOutlineThickness}px`);
                longShadowContainer.style.setProperty('--text-outline-color', config.textOutlineColor);
                longShadowContainer.style.setProperty('--text-stroke-thickness', `${config.textStrokeThickness}px`);
            }

            // Determine the shadow's length and step based on the configuration.
            let length = config.shadowLength;
            let step = 1;

            if (config.infiniteShadow) {
                // Determine the boundary for shadow calculation
                let boundaryWidth, boundaryHeight;
                
                if (config.boundaryElement === 'viewport') {
                    boundaryWidth = window.innerWidth;
                    boundaryHeight = window.innerHeight;
                } else if (config.boundaryElement === 'self') {
                    const rect = longShadowContainer.getBoundingClientRect();
                    boundaryWidth = rect.width;
                    boundaryHeight = rect.height;
                } else if (config.boundaryElement === 'parent') {
                    const parent = longShadowContainer.parentElement;
                    const rect = parent ? parent.getBoundingClientRect() : longShadowContainer.getBoundingClientRect();
                    boundaryWidth = rect.width;
                    boundaryHeight = rect.height;
                } else if (typeof config.boundaryElement === 'string') {
                    // Custom selector - search entire document
                    const boundaryEl = document.querySelector(config.boundaryElement);
                    
                    if (boundaryEl && (boundaryEl.contains(longShadowContainer) || boundaryEl === longShadowContainer)) {
                        // Element found and either contains or is the text element
                        const rect = boundaryEl.getBoundingClientRect();
                        boundaryWidth = rect.width;
                        boundaryHeight = rect.height;
                    } else {
                        // Fallback to viewport if element not found or doesn't contain text
                        boundaryWidth = window.innerWidth;
                        boundaryHeight = window.innerHeight;
                    }
                } else {
                    // Default fallback
                    boundaryWidth = window.innerWidth;
                    boundaryHeight = window.innerHeight;
                }
                
                length = Math.hypot(boundaryWidth, boundaryHeight);
                step = length / config.maxShadowLayers;
            }

            // Generate the shadow layers in a single, efficient loop.
            let shadows = [];
            for (let i = 1; i < length; i += step) {
                const currentX = Math.round(Math.cos(rad) * i);
                const currentY = Math.round(Math.sin(rad) * i);
                
                // Main colored shadow
                shadows.push(`${currentX}px ${currentY}px 0 ${config.shadowColor}`);
            }
            
            // Apply the combined shadow string to each word.
            const combinedShadow = shadows.join(',\n');
            allShadowSpans.forEach(span => {
                span.style.textShadow = combinedShadow;
            });

            // 3. Z-index sorting for word overlap
            const spansArray = Array.from(allShadowSpans);
            const sortedSpans = sortSpansByAngle(spansArray);

            sortedSpans.forEach((span, index) => {
                span.style.zIndex = index + 1;
            });
        }

        /**
         * Plays the staggered entrance animation for the words.
         */
        function playAnimation() {
            // The starting position is now set during initialization, so we don't need to set it here.
            let spansArray = Array.from(allShadowSpans);

            // Reset the animation by removing the class.
            spansArray.forEach(span => span.classList.remove('animate'));

            // Use a timeout to ensure the browser processes the reset before starting the new animation.
            setTimeout(() => {
                // Conditionally sort the spans for the stagger effect.
                if (config.sortByAngle) {
                    spansArray = sortSpansByAngle(spansArray);
                }

                // Apply the animation class with a calculated delay for the stagger effect.
                spansArray.forEach((span, index) => {
                    span.style.animationDelay = `${index * config.stagger}ms`;
                    span.classList.add('animate');
                });
            }, 10); // A small delay is crucial for the reset to work reliably.
        }

        // ==========================================================================
        // 4. EXECUTION
        // Runs the functions to apply the effects.
        // ==========================================================================

        /**
         * A master function to run both the shadow update and the animation.
         */
        function run() {
            updateShadow();
            playAnimation();
        }

        // Run the effect when the page loads.
        run();

        // Debounce resize events to improve performance
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateShadow, 100); // Only update shadow on resize
        });
    });
}

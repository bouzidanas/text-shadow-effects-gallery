export function applyStripedShadow(selector, options = {}) {
    const STYLE_ID = 'striped-shadow-styles';

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const css = `
            @import url('https://fonts.googleapis.com/css2?family=Titan+One&display=swap');

            .striped-shadow-container {
                -webkit-font-smoothing: antialiased;
                text-rendering: geometricPrecision;

                /* Stacking context for z-index */
                position: relative;
                isolation: isolate;
            }

            .striped-shadow-word {
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
    
    const cleanups = [];
        
    document.querySelectorAll(selector).forEach(element => {
        // Add a class to the container element for styling
        element.classList.add('striped-shadow-container');

        // ==========================================================================
        // 1. CONFIGURATION
        // ==========================================================================
        const defaults = {
            angles: 30, // single angle or array [30, 45, 60] for multi-directional shadows
            textOutlineThickness: 2,
            textColor: '#fef2d6ff',
            stripeColors: ['#A0522D', '#D2691E', '#e18b4dff', '#DEB887'],
            stripeThicknesses: [22, 20, 15, 8],
            sortByAngle: true,
            step: 0.1,
            shadowOutlineColor: 'white',
            shadowOutlineThickness: 3,
        };
        
        const config = { ...defaults, ...options };
        
        // Normalize stripeThicknesses: if single number, repeat for each color
        if (typeof config.stripeThicknesses === 'number') {
            config.stripeThicknesses = Array(config.stripeColors.length).fill(config.stripeThicknesses);
        }

        // ==========================================================================
        // 2. INITIALIZATION
        // ==========================================================================
        const text = element.textContent;
        const words = text.trim().split(' ');
        element.innerHTML = words.map(word => `<span class="striped-shadow-word">${word}</span>`).join(' ');
        
        const allShadowSpans = element.querySelectorAll('.striped-shadow-word');

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

        // Fixed internal reference font size - all shadow thicknesses are designed for this size
        const referenceFontSize = 80; // 5rem at default 16px base
        
        // Calculate base scale factor from actual rendered font size
        let baseScaleFactor = parseFloat(getComputedStyle(element).fontSize) / referenceFontSize;

        // ==========================================================================
        // 3. CORE LOGIC
        // ==========================================================================
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

            let shadows = [];
            let cumulativeX = 0;
            let cumulativeY = 0;

            // Use layer-based approach like animated version
            for (let i = 0; i < config.stripeColors.length; i++) {
                const color = config.stripeColors[i];
                const thickness = (config.stripeThicknesses[i % config.stripeThicknesses.length] || 0) * baseScaleFactor;
                const angleIndex = i % angleArray.length;
                const rad = angleArray[angleIndex] * (Math.PI / 180);
                
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
            allShadowSpans.forEach(span => {
                span.style.textShadow = combinedShadow;
            });

            let spansArray = Array.from(allShadowSpans);
            if (config.sortByAngle) {
                spansArray = sortSpansByAngle(spansArray);
            }
            spansArray.forEach((span, index) => {
                span.style.zIndex = index + 1;
            });
        }

        // ==========================================================================
        // 4. EXECUTION
        // ==========================================================================
        updateShadow();
        
        // Use ResizeObserver to detect when text size changes
        let resizeTimeout;
        const resizeObserver = new ResizeObserver(() => {
            const newComputedFontSize = parseFloat(getComputedStyle(element).fontSize);
            const newBaseScaleFactor = newComputedFontSize / referenceFontSize;
            
            if (Math.abs(newBaseScaleFactor - baseScaleFactor) > 0.01) {
                baseScaleFactor = newBaseScaleFactor;
                updateShadow();
            }
        });
        
        resizeObserver.observe(element);
        
        cleanups.push(() => {
            resizeObserver.disconnect();
        });
    });

    return () => {
        cleanups.forEach(cleanup => cleanup());
    };
}
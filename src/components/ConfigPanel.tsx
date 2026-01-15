import { useRef, useState, useEffect } from 'react';

interface ConfigPanelProps {
	config: any;
	onConfigChange: (newConfig: any) => void;
}

export default function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
	if (!config) return null;

    const panelRef = useRef<HTMLDivElement>(null);
    const [canScrollTop, setCanScrollTop] = useState(false);
    const [canScrollBottom, setCanScrollBottom] = useState(false);

    const checkScroll = () => {
        if (panelRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = panelRef.current;
            setCanScrollTop(scrollTop > 0);
            setCanScrollBottom(scrollTop + clientHeight < scrollHeight - 1); // -1 for rounding tolerance
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [config]); // Re-check when config changes as content height might change

	const handleChange = (key: string, value: any) => {
		onConfigChange({ ...config, [key]: value });
	};

	const renderInput = (key: string, value: any) => {
		const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

		if (typeof value === 'boolean') {
			return (
				<div key={key} className="config-item checkbox-item">
					<label>
						<input
							type="checkbox"
							checked={value}
							onChange={(e) => handleChange(key, e.target.checked)}
						/>
						{label}
					</label>
				</div>
			);
		}

		if (typeof value === 'number') {
			return (
				<div key={key} className="config-item">
					<label>{label}</label>
					<input
						type="number"
						value={value}
						onChange={(e) => handleChange(key, parseFloat(e.target.value))}
					/>
				</div>
			);
		}

		if (typeof value === 'string') {
			// Check if it's a color
			if (value.match(/^#[0-9A-F]{6,8}$/i) || value.match(/^rgba?\(.*\)$/) || value === 'transparent' || value === 'black' || value === 'white') {
                 // For now, only simple hex/color picker. Complex colors might need text input.
                 // If it's a hex with alpha, standard color input might strip it or behave weirdly, but let's try.
                 // Actually, let's provide both a color picker (if possible) and a text input.
                 // Fallback to text input for now for flexibility.
				return (
					<div key={key} className="config-item color-item">
						<label>{label}</label>
                        <div className="color-input-wrapper">
						    <input
							    type="color"
                                // Simple hex only for color picker
							    value={value.startsWith('#') && value.length >= 7 ? value.substring(0, 7) : '#000000'}
							    onChange={(e) => handleChange(key, e.target.value)}
						    />
                            <input 
                                type="text" 
                                value={value}
                                onChange={(e) => handleChange(key, e.target.value)}
                            />
                        </div>
					</div>
				);
			}

			return (
				<div key={key} className="config-item">
					<label>{label}</label>
					<input
						type="text"
						value={value}
						onChange={(e) => handleChange(key, e.target.value)}
					/>
				</div>
			);
		}

		if (Array.isArray(value)) {
			// Comma separated list for simplicity
			return (
				<div key={key} className="config-item">
					<label>{label} (Comma separated)</label>
					<input
						type="text"
						value={value.join(', ')}
						onChange={(e) => {
                            // Try to maintain types (numbers vs strings)
                            const firstItem = value[0];
                            const isNumber = typeof firstItem === 'number';
							const arr = e.target.value.split(',').map(s => s.trim());
                            if (isNumber) {
                                handleChange(key, arr.map(n => parseFloat(n) || 0));
                            } else {
                                handleChange(key, arr);
                            }
						}}
					/>
				</div>
			);
		}

		return null;
	};

    // Grouping logic (heuristic)
    const groups: {[key: string]: string[]} = {
        'Typography': ['fontFamily', 'fontSize', 'lineHeight', 'textStyle'],
        'Colors': ['textColor', 'backgroundColor', 'shadowColor', 'shadowOutlineColor', 'textOutlineColor', 'stripeColors'],
        'Dimensions': ['angle', 'angles', 'shadowLength', 'textOutlineThickness', 'shadowOutlineThickness', 'textStrokeThickness', 'stripeThicknesses', 'step'],
        'Animation': ['animation', 'stagger', 'animationDuration', 'motionScaleFactor', 'infiniteShadow', 'maxShadowLayers'],
        'Other': []
    };

    const keys = Object.keys(config);
    const groupedKeys: {[key: string]: string[]} = {};

    keys.forEach(key => {
        let placed = false;
        for (const group in groups) {
            if (groups[group].includes(key) || groups[group].some(gKey => key.toLowerCase().includes(gKey.toLowerCase()))) {
                 // Simple keyword matching
                 if (!groupedKeys[group]) groupedKeys[group] = [];
                 groupedKeys[group].push(key);
                 placed = true;
                 break;
            }
             // Heuristic based on name
             if (group === 'Colors' && (key.toLowerCase().includes('color') || key.toLowerCase().includes('background'))) {
                 if (!groupedKeys[group]) groupedKeys[group] = [];
                 groupedKeys[group].push(key);
                 placed = true;
                 break;
             }
             if (group === 'Dimensions' && (key.toLowerCase().includes('thickness') || key.toLowerCase().includes('width') || key.toLowerCase().includes('size') || key.toLowerCase().includes('angle'))) {
                 if (!groupedKeys[group]) groupedKeys[group] = [];
                 groupedKeys[group].push(key);
                 placed = true;
                 break;
             }
        }
        if (!placed) {
            if (!groupedKeys['Other']) groupedKeys['Other'] = [];
            groupedKeys['Other'].push(key);
        }
    });


	return (
        <>
            <div className={`scroll-indicator top ${canScrollTop ? 'visible' : ''}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </div>
            
            <div className="config-panel" ref={panelRef} onScroll={checkScroll}>
                <h3>Configuration</h3>
                {Object.keys(groupedKeys).map(group => {
                    if (groupedKeys[group].length === 0) return null;
                    return (
                        <div key={group} className="config-group">
                            <h4>{group}</h4>
                            {groupedKeys[group].map(key => renderInput(key, config[key]))}
                        </div>
                    );
                })}
            </div>
            
            <div className={`scroll-indicator bottom ${canScrollBottom ? 'visible' : ''}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
        </>
	);
}

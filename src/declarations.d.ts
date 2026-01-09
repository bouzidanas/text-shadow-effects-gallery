interface CommonShadowOptions {
    textColor?: string;
    shadowOutlineColor?: string;
    shadowOutlineThickness?: number;
    textOutlineColor?: string;
    stagger?: number;
    sortByAngle?: boolean;
}

interface LongShadowOptions extends CommonShadowOptions {
    angle?: number;
    shadowColor?: string;
    textStrokeThickness?: number;
    shadowLength?: number;
    infiniteShadow?: boolean;
    maxShadowLayers?: number;
    boundaryElement?: 'viewport' | 'self' | 'parent' | string;
}

interface StripedShadowOptions extends CommonShadowOptions {
    angles?: number | readonly number[] | number[];
    textOutlineThickness?: number;
    stripeColors?: readonly string[] | string[];
    stripeThicknesses?: readonly number[] | number[] | number;
    step?: number | 'layer';
    animationDuration?: number;
    motionScaleFactor?: number;
    animation?: boolean;
    boundaryElement?: 'viewport' | 'self' | 'parent' | string;
}

declare module "*.js" {
    export function applyLongShadow(
        selector: string,
        options?: LongShadowOptions
    ): void;
    export function applyStripedShadow(
        selector: string,
        options?: StripedShadowOptions
    ): void;
}

declare module "./effects/striped-shadow-animated-web-api.js" {
    export function applyStripedShadow(
        selector: string,
        options?: StripedShadowOptions
    ): void;
}

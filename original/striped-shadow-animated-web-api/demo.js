import { applyStripedShadow } from './index.js';

document.addEventListener('DOMContentLoaded', () => {
    applyStripedShadow('.striped-shadow-anim', {
        angle: 30,
        textOutlineThickness: 2,
        textColor: '#fef2d6ff',
        stripeColors: ['#A0522D', '#D2691E', '#e18b4dff', '#DEB887'],
        stripeThicknesses: [22, 20, 15, 8],
        stagger: 500,
        sortByAngle: true,
        animationDuration: 1200,
        motionScaleFactor: 5,
        animation: true
    });
});

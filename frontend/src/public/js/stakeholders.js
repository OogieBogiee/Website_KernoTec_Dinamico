import { mapStakeholdersData } from './api/stakeholders-mapper.js';

const CACHE_KEY = 'kernotec_stakeholders_cache';
const CACHE_DURATION = 30000;

function detectCacheBypass() {
    if (window.location.search.includes('refresh=true')) return true;

    try {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
            return navEntries[0].type === 'reload';
        }
    } catch {
        return false;
    }

    return false;
}

function getCachedData() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        if (!parsed || typeof parsed !== 'object') return null;

        const data = parsed.data;
        const timestamp = Number(parsed.timestamp);
        if (!Number.isFinite(timestamp)) return null;

        return (Date.now() - timestamp > CACHE_DURATION) ? null : data;
    } catch {
        return null;
    }
}

function setCachedData(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

function sanitize(text) {
    if (typeof DOMPurify === 'undefined') {
        const temp = document.createElement('div');
        temp.textContent = String(text || '');
        return temp.innerHTML;
    }
    return DOMPurify.sanitize(String(text || ''));
}

function sanitizeUrl(url) {
    if (!url) return null;
    const cleaned = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(url) : url;
    return /^https?:\/\//i.test(cleaned) ? cleaned : null;
}

async function fetchStakeholders() {
    const skipCache = detectCacheBypass();

    const cachedData = skipCache ? null : getCachedData();
    if (cachedData) return cachedData;

    const refreshParam = skipCache ? '?refresh=true' : '';
    const response = await fetch(`/api/stakeholders${refreshParam}`);

    if (response.status === 429) {
        if (window.showApiRateLimitWarning) window.showApiRateLimitWarning();
        throw new Error('RATE_LIMIT');
    }

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const apiData = await response.json();

    if (!apiData.success) {
        throw new Error(apiData.error || 'Respuesta inválida');
    }

    const mapped = mapStakeholdersData(apiData);
    setCachedData(mapped);
    return mapped;
}

function createElementWithClasses(tag, classesArray = []) {
    const el = document.createElement(tag);
    if (classesArray.length > 0) {
        el.classList.add(...classesArray.filter(Boolean));
    }
    return el;
}

function createSlideElement(item) {
    if (!item.iconUrl) return null;

    const safeUrl = sanitizeUrl(item.url);
    const li = createElementWithClasses('li', ['glide__slide']);
    
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = sanitize(item.iconUrl);
    img.alt = sanitize(item.iconAlt || '');

    if (safeUrl) {
        const a = document.createElement('a');
        a.href = safeUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.style.cursor = 'pointer';
        a.style.display = 'flex';
        a.style.justifyContent = 'center';
        a.style.alignItems = 'center';
        a.style.width = '100%';
        a.style.height = '100%';
        a.appendChild(img);
        li.appendChild(a);
    } else {
        li.appendChild(img);
    }
    return li;
}

function createBulletElement(index) {
    const btn = createElementWithClasses('button', ['glide__bullet']);
    btn.dataset.glideDir = '=' + index;
    return btn;
}

function renderCarousel(glideId, items) {
    if (!items || items.length === 0) return false;

    const slidesList = document.querySelector(`#${glideId} .glide__slides`);    
    const bulletsContainer = document.querySelector(`#${glideId} .glide__bullets`);

    if (!slidesList || !bulletsContainer) return false;

    slidesList.innerHTML = '';
    bulletsContainer.innerHTML = '';

    let hasValidSlide = false;
    items.forEach((item, index) => {
        const slideNode = createSlideElement(item);
        if (slideNode) {
            slidesList.appendChild(slideNode);
            const bulletNode = createBulletElement(index);
            bulletsContainer.appendChild(bulletNode);
            hasValidSlide = true;
        }
    });

    return hasValidSlide;
}

function mountGlide(id) {
    if (typeof Glide === 'undefined') return;
    const glide = new Glide(`#${id}`, {
        type: 'carousel',
        perView: 5,
        gap: 50,
        autoplay: 3000,
        hoverpause: true,
        breakpoints: {
            1200: { perView: 3 },
            800: { perView: 1 }
        }
    });
    
    glide.mount();

    const bullets = document.querySelectorAll(`#${id} .glide__bullet`);
    bullets.forEach((bullet, index) => {
        bullet.addEventListener('click', (e) => {
            glide.go(`=${index}`);
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    let clientes = [];
    let partners = [];

    try {
        const data = await fetchStakeholders();
        clientes = Array.isArray(data?.clientes) ? data.clientes : [];
        partners = Array.isArray(data?.partners) ? data.partners : [];
    } catch {
        clientes = [];
        partners = [];
    }

    if (renderCarousel('glide', clientes)) {
        mountGlide('glide');
    }

    if (renderCarousel('glide2', partners)) {
        mountGlide('glide2');
    }
});

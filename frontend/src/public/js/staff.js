import { mapStaffData, generateStaffCSS } from './api/staff-mapper.js';

const CACHE_KEY = 'kernotec_staff_cache';
const CACHE_DURATION = 30000; 
const API_ENDPOINT = '/api/staff';

function detectCacheBypass() {
    if (window.location.search.includes('refresh=true')) {
        return true;
    }

    try {
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
            return navigationEntries[0].type === 'reload';
        }
    } catch {
        return false;
    }

    return false;
}

function getCachedStaffData() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
        return null;
    }

    try {
        const parsed = JSON.parse(cached);
        if (!parsed || !parsed.data || !parsed.timestamp) {
            return null;
        }

        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            return parsed.data;
        }
    } catch {
        return null;
    }

    return null;
}

function setCachedStaffData(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch {
        return;
    }
}

async function fetchStaffData() {
    const skipCache = detectCacheBypass();

    if (!skipCache) {
        const cached = getCachedStaffData();
        if (cached) {
            return cached;
        }
    }

    const url = skipCache ? `${API_ENDPOINT}?refresh=true` : API_ENDPOINT;
    const response = await fetch(url);
    
    if (response.status === 429) {
        if (window.showApiRateLimitWarning) window.showApiRateLimitWarning();
        throw new Error('RATE_LIMIT');
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    setCachedStaffData(data);

    return data;
}

function sanitize(text) {
    if (!text) return '';
    
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(text);
    }
    
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
}

const defaultGridConfig = {
    mobileFallback: { imgUrl: 'img/fotos/kernotec-small.jpg', alt: 'Kernotec S.A.' },
    specialBlocks: {
        8: [
            { class: 'grid-special1', imgUrl: 'img/fotos/cuadro_logo.png', alt: 'KernoTec Logo' },
            { class: 'grid-special2', imgUrl: 'img/fotos/message-kernotec.jpg', alt: 'Mensaje KernoTec' }
        ],
        11: [
            { class: 'grid-special3', imgUrl: 'img/fotos/keywords.jpg', alt: 'Keywords' },
            { class: 'grid-filler', isFiller: true }
        ]
    }
};

function renderStaffGrid(members, container) {
    if (!container) return;
    const isResponsive = window.innerWidth <= 1610;
    container.innerHTML = '';

    members.forEach((member, index) => {
        if (defaultGridConfig.specialBlocks[index]) {
            defaultGridConfig.specialBlocks[index].forEach(block => {
                const specialDiv = document.createElement('div');
                specialDiv.className = 'grid-picture ' + sanitize(block.class);
                
                if (!block.isFiller) {
                    const img = document.createElement('img');
                    img.loading = 'lazy';
                    img.className = 'grid-image';
                    img.src = sanitize(block.imgUrl);
                    img.alt = sanitize(block.alt);
                    specialDiv.appendChild(img);
                }
                container.appendChild(specialDiv);
            });
        }

        const { cssClasses, detailClass, responsiveDetailClass, position, saying } = member;
        const initialDetailClass = isResponsive ? responsiveDetailClass : detailClass;

        const memberDiv = document.createElement('div');
        memberDiv.className = 'grid-picture';
        memberDiv.setAttribute('data-detail-desktop', sanitize(detailClass));
        memberDiv.setAttribute('data-detail-responsive', sanitize(responsiveDetailClass));

        const cleanFront = sanitize(cssClasses.front);
        const cleanRight = sanitize(cssClasses.right);
        const cleanBottom = sanitize(cssClasses.bottom);
        const cleanDetalle = sanitize(cssClasses.detalle);
        const cleanInitialClass = sanitize(initialDetailClass);
        const cleanPosition = sanitize(position);
        const cleanSaying = sanitize(saying);

        memberDiv.innerHTML = `
            <div class="cubo">
                <div class="cara ${cleanFront} front"></div>
                <div class="cara ${cleanRight} right"></div>
                <div class="cara ${cleanBottom} bottom"></div>
            </div>
            <div class="${cleanInitialClass} ${cleanDetalle}">
                <span class="screen2a-parrafo">${cleanPosition}</span>
                <span class="screen2a-parrafo2">${cleanSaying}</span>
            </div>
        `;
        container.appendChild(memberDiv);
    });
}

function injectDynamicCSS(css) {
    const existingStyle = document.getElementById('staff-dynamic-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    const styleTag = document.createElement('style');
    styleTag.id = 'staff-dynamic-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
}

const DETAIL_BREAKPOINT = 1610;

function debounce(fn, delay) {
    let timer;
    return function() {
        clearTimeout(timer);
        timer = setTimeout(fn, delay);
    };
}

function applyResponsiveDetails() {
    const isResponsive = window.innerWidth <= DETAIL_BREAKPOINT;
    if (!isResponsive) {
        document.querySelectorAll('.grid-pictures .grid-picture.is-open').forEach(p => p.classList.remove('is-open'));
    }
    document.querySelectorAll('.grid-pictures .grid-picture[data-detail-desktop]').forEach(pic => {
        const desktopClass = pic.dataset.detailDesktop;
        const responsiveClass = pic.dataset.detailResponsive;
        const target = isResponsive ? responsiveClass : desktopClass;
        const current = isResponsive ? desktopClass : responsiveClass;
        if (target !== current) {
            const detailDiv = pic.querySelector('.cubo + div');
            if (detailDiv) {
                detailDiv.classList.remove(current);
                detailDiv.classList.add(target);
            }
        }
    });
}

function setupGridClickToggle() {
    const grid = document.querySelector('.grid-pictures');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
        if (window.innerWidth > DETAIL_BREAKPOINT) return;
        const pic = e.target.closest('.grid-picture:not(.grid-special1):not(.grid-special2):not(.grid-special3)');
        if (!pic) return;
        const isOpen = pic.classList.contains('is-open');
        document.querySelectorAll('.grid-pictures .grid-picture.is-open').forEach(p => p.classList.remove('is-open'));
        if (!isOpen) pic.classList.add('is-open');
    });
}

async function renderStaff() {
    try {
        const container = document.querySelector('.grid-pictures');

        if (!container) {
            return;
        }

        const apiResponse = await fetchStaffData();

        if (!apiResponse.success) {
            throw new Error(apiResponse.error || 'Error al cargar staff');
        }

        const mappedMembers = mapStaffData(apiResponse);

        if (mappedMembers.length === 0) {
            container.innerHTML = '';
            return;
        }

        const dynamicCSS = generateStaffCSS(mappedMembers);
        injectDynamicCSS(dynamicCSS);

        renderStaffGrid(mappedMembers, container);

        void container.offsetHeight;

        const picParent = document.querySelector('.container2a .pictures');
        if (picParent && !picParent.querySelector('.grid-pictures-smallDevice')) {
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'grid-pictures-smallDevice';
            const imgEl = document.createElement('img');
            imgEl.loading = 'lazy';
            imgEl.src = sanitize(defaultGridConfig.mobileFallback.imgUrl);
            imgEl.alt = sanitize(defaultGridConfig.mobileFallback.alt);
            fallbackDiv.appendChild(imgEl);
            picParent.appendChild(fallbackDiv);
        }

        applyResponsiveDetails();
        setupGridClickToggle();
        window.addEventListener('resize', debounce(applyResponsiveDetails, 200));

    } catch (error) {
        const container = document.querySelector('.grid-pictures');
        if (container) {
            container.innerHTML = '';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderStaff);
} else {
    renderStaff();
}

import { mapServicesData } from './api/services-mapper.js';

const CACHE_KEY = 'kernotec_services_cache';
const CACHE_DURATION = 30000;

function detectCacheBypass() {
    if (window.location.search.includes('refresh=true')) {
        return true;
    }

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

        const isExpired = Date.now() - timestamp > CACHE_DURATION;
        return isExpired ? null : data;
    } catch {
        return null;
    }
}

function setCachedData(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
    }));
}

async function fetchServicesData() {
    const skipCache = detectCacheBypass();
    
    const cachedData = skipCache ? null : getCachedData();
    if (cachedData) {
        return cachedData;
    }

    const refreshParam = skipCache ? '?refresh=true' : '';
    const response = await fetch(`/api/services-areas${refreshParam}`);
    
    if (response.status === 429) {
        if (window.showApiRateLimitWarning) window.showApiRateLimitWarning();
        throw new Error('RATE_LIMIT');
    }

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const apiData = await response.json();
    if (!apiData?.success) {
        throw new Error(apiData?.error || 'Respuesta invalida');
    }

    const mappedData = mapServicesData(apiData);
    
    setCachedData(mappedData);
    return mappedData;
}

function sanitize(text) {
    if (typeof DOMPurify === 'undefined') {
        const temp = document.createElement('div');
        temp.textContent = String(text || '');
        return temp.innerHTML;
    }
    return DOMPurify.sanitize(String(text || ''));
}

function createElementWithClasses(tag, classesArray = []) {
    const el = document.createElement(tag);
    if (classesArray.length > 0) {
        el.classList.add(...classesArray.filter(Boolean));
    }
    return el;
}

function createSkillCardHTML(skill, sectionClass, skillIndex) {
    const card = createElementWithClasses('div', ['software-skill']);
    card.dataset.skillId = sanitize(skill.id);
    card.dataset.skillIndex = skillIndex;

    const front = createElementWithClasses('div', ['software-front']);
    const frontContent = createElementWithClasses('div', ['front-content']);
    
    const iconFront = document.createElement('img');
    iconFront.loading = 'lazy';
    iconFront.width = 16;
    iconFront.className = 'front-icon';
    iconFront.src = 'img/icons/icon-play.png';
    frontContent.appendChild(iconFront);

    const titleFront = createElementWithClasses('h3', ['front-title']);
    titleFront.textContent = sanitize(skill.title);
    frontContent.appendChild(titleFront);

    const svgClasses = [
        ['svg-single', skill.svgFront.singleItem],
        ['svg-2col-left', skill.svgFront.twoColLeft],
        ['svg-2col-right', skill.svgFront.twoColRight],
        ['svg-3col-left', skill.svgFront.threeColLeft],
        ['svg-3col-center', skill.svgFront.threeColCenter],
        ['svg-3col-right', skill.svgFront.threeColRight]
    ];

    svgClasses.forEach(([cls, srcUrl]) => {
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.className = 'card-bottom-1 ' + cls;
        img.src = sanitize(srcUrl);
        img.alt = '';
        frontContent.appendChild(img);
    });
    front.appendChild(frontContent);
    card.appendChild(front);

    const back = createElementWithClasses('div', ['software-back']);
    back.dataset.clickable = 'true';
    back.tabIndex = 0; 
    back.style.cursor = 'pointer';

    const iconBack = document.createElement('img');
    iconBack.loading = 'lazy';
    iconBack.className = 'back-icon';
    iconBack.src = sanitize(skill.iconUrl);
    back.appendChild(iconBack);

    const titleBack = createElementWithClasses('h3', ['back-title']);
    titleBack.textContent = sanitize(skill.title);
    back.appendChild(titleBack);

    const descBack = createElementWithClasses('p', ['back-description']);
    descBack.textContent = sanitize(skill.description);
    back.appendChild(descBack);

    const svgBackClasses = [
        ['svg-single', skill.svgBack.singleItem],
        ['svg-2col-left', skill.svgBack.twoColLeft],
        ['svg-2col-right', skill.svgBack.twoColRight],
        ['svg-3col-left', skill.svgBack.threeColLeft],
        ['svg-3col-center', skill.svgBack.threeColCenter],
        ['svg-3col-right', skill.svgBack.threeColRight]
    ];

    svgBackClasses.forEach(([cls, srcUrl]) => {
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.className = 'card-bottom-1 ' + cls;
        img.src = sanitize(srcUrl);
        img.alt = '';
        back.appendChild(img);
    });
    card.appendChild(back);

    back.addEventListener('click', (e) => {
        e.stopPropagation();
        openTechnologyModal(skill);
    });

    back.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            openTechnologyModal(skill);
        }
    });

    return card;
}

function createServiceSection(service) {
    const { isotipo } = service;
    const section = createElementWithClasses('div', [service.sectionClass]);
    section.id = sanitize(service.anchorId);
    section.dataset.odd = service.isOdd.toString();

    const backgroundUrl = service.backgroundUrl || '';
    const gradient = service.isOdd
        ? 'linear-gradient(to left, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.97))'
        : 'linear-gradient(to left, rgba(41, 40, 40, 0.95), rgba(41, 40, 40, 0.95))';

    if (backgroundUrl) {
        section.style.setProperty('background-image', `${gradient}, url('${sanitize(backgroundUrl)}')`, 'important');
        section.style.setProperty('background-attachment', 'fixed', 'important');
        section.style.setProperty('background-size', 'cover', 'important');
        section.style.setProperty('background-position', 'center', 'important');
    } else {
        section.style.setProperty('background-image', gradient, 'important');
    }

    if (isotipo && isotipo.url) {
        const isoImg = document.createElement('img');
        isoImg.loading = 'lazy';
        isoImg.src = sanitize(isotipo.url);
        isoImg.alt = 'Isotipo KernoTec';
        if (isotipo.class) {
            isoImg.classList.add(isotipo.class);
        }
        Object.entries(isotipo.position).forEach(([key, value]) => {
            isoImg.style[key] = value;
        });
        section.appendChild(isoImg);
    }

    const container = createElementWithClasses('div', ['container']);
    const swContainer = createElementWithClasses('div', ['software-container']);
    
    const swLeft = createElementWithClasses('div', ['software-left']);
    const titleH2 = createElementWithClasses('h2', ['software-title']);
    titleH2.textContent = sanitize(service.title) + ' ';
    const spanDot = createElementWithClasses('span', ['text-color-1']);
    spanDot.textContent = '°';
    titleH2.appendChild(spanDot);
    
    const descP = createElementWithClasses('p', ['software-description']);
    descP.textContent = sanitize(service.descriptionLong);
    
    swLeft.appendChild(titleH2);
    swLeft.appendChild(descP);
    swContainer.appendChild(swLeft);

    const swRight = createElementWithClasses('div', ['software-right']);
    const skillCount = service.skills.length;
    const skillCountClass = skillCount === 1 ? 'skills-count-1' : (skillCount === 2 ? 'skills-count-2' : 'skills-count-3plus');
    const skillsWrapper = createElementWithClasses('div', ['software-skills', skillCountClass]);

    service.skills.forEach((skill, index) => {
        const cardNode = createSkillCardHTML(skill, service.sectionClass, index);
        skillsWrapper.appendChild(cardNode);
    });

    swRight.appendChild(skillsWrapper);
    swContainer.appendChild(swRight);
    container.appendChild(swContainer);
    section.appendChild(container);

    return section;
}

function createTechnologiesTableHTML(technologies) {
    if (!technologies || technologies.length === 0) {
        return '';
    }

    const LOGO_WIDTH_VERTICAL = 30;
    const LOGO_WIDTH_HORIZONTAL = 70;
    const GAP_SIZE = 10;

    const techCount = technologies.length;
    const justifyContent = techCount <= 2 ? 'center' : 'flex-start';
    const itemFlex = techCount <= 2 ? '0 1 auto' : '0 0 calc(33.333% - 20px)';  
    let containerStyle = `display: flex; flex-wrap: wrap; justify-content: ${justifyContent}; align-items: center; gap: 20px 30px; color: #79aaae; padding: 15px 20px;`;

    let itemsHTML = '';

    technologies.forEach((tech) => {
        const logoWidth = tech.logo_width === 'horizontal' ? LOGO_WIDTH_HORIZONTAL : LOGO_WIDTH_VERTICAL;
        const logoUrl = tech.logo ? tech.logo.url : '';
        const techName = tech.name || 'Sin nombre';

        itemsHTML += `
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: ${GAP_SIZE}px; flex: ${itemFlex}; min-width: 0;">
                <img loading="lazy" width="${logoWidth}" src="${sanitize(logoUrl)}" alt="${sanitize(techName)}" style="display: block; flex-shrink: 0;">        
                <span style="text-align: left; font-size: 15px; line-height: 1.3; font-weight: 400; white-space: nowrap;">${sanitize(techName)}</span>
            </div>
        `;
    });

    return `<div style="${containerStyle}">${itemsHTML}</div>`;
}

function openTechnologyModal(skill) {
    if (typeof Swal === 'undefined') {
        alert(`${skill.title}\n\n${skill.descriptionLong}`);
        return;
    }

    const technologiesHTML = createTechnologiesTableHTML(skill.technologies);
    const hasTechnologies = skill.technologies && skill.technologies.length > 0;
    
    let backgroundStyle = '';
    if (skill.backgroundImages && skill.backgroundImages.length > 0) {
        const firstBackground = skill.backgroundImages[0];
        backgroundStyle = `
            background: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.85)), 
                        url('${sanitize(firstBackground.url)}') !important;
            background-size: cover !important;
            background-position: center !important;
        `;
    }
    
    Swal.fire({
        scrollbarPadding: false,
        showCloseButton: true,
        showConfirmButton: false,
        title: `<h3 class='modal-title'><img loading='lazy' width='40' src='${sanitize(skill.iconUrl)}'>${sanitize(skill.title)}</h3>`,
        html: `
            <p style="text-align: justify; line-height: 1.6;">${sanitize(skill.descriptionLong)}</p>
            ${hasTechnologies ? `
                <br>
                <h3 class="modal-title2">Tecnologías que utilizamos</h3>
                ${technologiesHTML}
            ` : ''}
        `,
        customClass: {
            popup: backgroundStyle ? '' : 'modal-frontend',
            title: 'modal-title',
            htmlContainer: 'modal-text-light',
            closeButton: 'modal-close-button'
        },
        didOpen: (popup) => {
            if (backgroundStyle) {
                popup.style.cssText += backgroundStyle;
            }
        }
    });
}

function updateGridPositions() {
    const skillsContainers = document.querySelectorAll('.software-skills');
    
    skillsContainers.forEach(container => {
        const skills = Array.from(container.querySelectorAll('.software-skill'));
        if (skills.length === 0) return;
        
        const rows = [];
        let currentRow = [];
        let currentTop = null;
        
        skills.forEach((skill, index) => {
            const rect = skill.getBoundingClientRect();
            const top = Math.round(rect.top);
            
            if (currentTop === null) {
                currentTop = top;
                currentRow.push({ skill, index });
            } else if (Math.abs(top - currentTop) < 10) {
                currentRow.push({ skill, index });
            } else {
                rows.push(currentRow);
                currentRow = [{ skill, index }];
                currentTop = top;
            }
        });
        if (currentRow.length > 0) {
            rows.push(currentRow);
        }
        
        const allPosClasses = [
            'grid-cols-1', 'grid-cols-2', 'grid-cols-3plus',
            'grid-pos-left', 'grid-pos-center', 'grid-pos-right', 'grid-pos-alone'
        ];
        
        rows.forEach(row => {
            const colsInRow = row.length;
            
            row.forEach((item, posInRow) => {
                const skill = item.skill;
                allPosClasses.forEach(cls => skill.classList.remove(cls));
                
                if (colsInRow === 1) {
                    skill.classList.add('grid-cols-1', 'grid-pos-alone');
                } else if (colsInRow === 2) {
                    skill.classList.add('grid-cols-2');
                    skill.classList.add(posInRow === 0 ? 'grid-pos-left' : 'grid-pos-right');
                } else {
                    skill.classList.add('grid-cols-3plus');
                    if (posInRow === 0) {
                        skill.classList.add('grid-pos-left');
                    } else if (posInRow === colsInRow - 1) {
                        skill.classList.add('grid-pos-right');
                    } else {
                        skill.classList.add('grid-pos-center');
                    }
                }
            });
        });
    });
}

function initGridObserver() {
    updateGridPositions();
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateGridPositions, 100);
    });
    
    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateGridPositions, 100);
        });
        
        document.querySelectorAll('.software-skills').forEach(container => {
            observer.observe(container);
        });
    }
}

async function renderServices() {
    const container = document.getElementById('services-dynamic-container');
    if (!container) {
        return;
    }

    try {
        const services = await fetchServicesData();
        
        if (!services || services.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = '';
        services.forEach(service => {
            const sectionNode = createServiceSection(service);
            container.appendChild(sectionNode);
        });
        
        requestAnimationFrame(() => {
            initGridObserver();
        });
        
    } catch {
        container.innerHTML = '';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderServices);
} else {
    renderServices();
}

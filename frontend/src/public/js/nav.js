import { mapNavbarData } from './api/navbar-mapper.js';

let sanitizer;
let scrollspyAnchors = [];

const defaultNavConfig = {
    home: { label: 'Inicio', target: '#tinicio' },
    us: { label: 'Nosotros', target: '#tnosotros' },
    contact: { label: 'Contactos', target: '#tcon' },
    servicesFallback: { label: 'Servicios', target: '#tservicios' }
};

function getSanitizer() {
    if (typeof window.DOMPurify !== 'undefined') {
        return window.DOMPurify;
    }
    return {
        sanitize: function (value) {
            const temp = document.createElement('div');
            temp.textContent = String(value || '');
            return temp.textContent;
        }
    };
}

function normalizeNavbarPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        return { areas: [], servicios: [] };
    }
    return {
        areas: Array.isArray(payload.areas) ? payload.areas : [],
        servicios: Array.isArray(payload.servicios) ? payload.servicios : []
    };
}

function createNavItemHTML(label, target, isMobile = false) {
    const safeLabel = sanitizer.sanitize(label);
    const safeTarget = sanitizer.sanitize(target);
    if (isMobile) {
        return `<li role="none"><a href="${safeTarget}" role="menuitem">${safeLabel}</a></li>`;
    }
    return `<a href="${safeTarget}" role="menuitem">${safeLabel}</a>`;
}

function renderDesktopNavbar(areas, servicios, titleNosotros) {
    const navLinks = document.querySelector('.topnav .navLinks');
    if (!navLinks || !sanitizer) return;

    let html = '';

    const configUsLabel = titleNosotros || defaultNavConfig.us.label;
    html += createNavItemHTML(defaultNavConfig.home.label, defaultNavConfig.home.target, false);
    html += createNavItemHTML(configUsLabel, defaultNavConfig.us.target, false);

    areas.forEach((area) => {
        html += createNavItemHTML(area.title, area.anchor, false);
    });

    if (servicios.length > 0) {
        const servicesLabel = sanitizer.sanitize(defaultNavConfig.servicesFallback.label);
        html += `<div class="dropdown-nav" role="none">
                    <button class="dropdown-trigger" aria-haspopup="true" aria-expanded="false">${servicesLabel} &#9660;</button>
                    <div class="dropdown-content" role="menu" aria-label="${servicesLabel}">`;
        servicios.forEach((servicio) => {
            html += createNavItemHTML(servicio.title, servicio.anchor, false);
        });
        html += `   </div>
                 </div>`;
    }

    html += createNavItemHTML(defaultNavConfig.contact.label, defaultNavConfig.contact.target, false);

    navLinks.innerHTML = html;
}

function renderMobileNavbar(areas, servicios, titleNosotros) {
    const hamMenuUl = document.querySelector('.ham-menu > ul');
    if (!hamMenuUl || !sanitizer) return;

    let html = '';

    const configUsLabel = titleNosotros || defaultNavConfig.us.label;
    html += createNavItemHTML(defaultNavConfig.home.label, defaultNavConfig.home.target, true);
    html += createNavItemHTML(configUsLabel, defaultNavConfig.us.target, true);

    areas.forEach((area) => {
        html += createNavItemHTML(area.title, area.anchor, true);
    });

    if (servicios.length > 0) {
        const servicesLabel = sanitizer.sanitize(defaultNavConfig.servicesFallback.label);
        html += `<li class="menu-with-submenu" role="none">
                    <button class="submenu-trigger" aria-haspopup="true" aria-expanded="false">${servicesLabel} &#9660;</button>
                    <ul class="submenu" role="menu" aria-label="${servicesLabel}">`;
        servicios.forEach((servicio) => {
            html += createNavItemHTML(servicio.title, servicio.anchor, true);
        });
        html += `   </ul>
                 </li>`;
    }

    html += createNavItemHTML(defaultNavConfig.contact.label, defaultNavConfig.contact.target, true);

    hamMenuUl.innerHTML = html;

    bindMobileSubmenuEvents(hamMenuUl);
}

function bindMobileSubmenuEvents(container) {
    const submenuTrigger = container.querySelector('.submenu-trigger');
    if (submenuTrigger) {
        submenuTrigger.addEventListener('click', function () {
            const submenu = this.nextElementSibling;
            if (submenu) {
                const isOpen = submenu.classList.toggle('submenu-open');
                this.classList.toggle('submenu-trigger-active');
                this.setAttribute('aria-expanded', isOpen);
            }
        });
    }
}

function rebuildScrollspyMap() {
    const navLinks = document.querySelector('.topnav .navLinks');
    if (!navLinks) return;

    scrollspyAnchors = Array.from(navLinks.querySelectorAll('a[href^="#"]'));
    const dropdownAnchors = Array.from(navLinks.querySelectorAll('.dropdown-content a[href^="#"]'));

    dropdownAnchors.forEach((anchor) => {
        if (!scrollspyAnchors.includes(anchor)) {
            scrollspyAnchors.push(anchor);
        }
    });
}

function updateScrollspy() {
    if (window.innerWidth <= 1200) return;

    const navLinks = document.querySelector('.topnav .navLinks');
    if (!navLinks || scrollspyAnchors.length === 0) return;

    const offset = 80;
    const dropdownTrigger = navLinks.querySelector('.dropdown-trigger');
    let currentEl = null;

    scrollspyAnchors.forEach((anchor) => {
        const hrefValue = anchor.getAttribute('href');
        if (!hrefValue || hrefValue.length < 2) return;

        const id = hrefValue.substring(1);
        const section = document.getElementById(id);
        if (!section) return;

        const rect = section.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom > offset) {
            currentEl = anchor;
        }
    });

    scrollspyAnchors.forEach((anchor) => {
        anchor.classList.remove('nav-active');
        anchor.removeAttribute('aria-current');
    });

    if (dropdownTrigger) {
        dropdownTrigger.classList.remove('nav-active');
    }

    if (!currentEl) return;

    if (currentEl.closest('.dropdown-content') && dropdownTrigger) {
        dropdownTrigger.classList.add('nav-active');
        currentEl.classList.add('nav-active');
        currentEl.setAttribute('aria-current', 'page');
        return;
    }

    currentEl.classList.add('nav-active');
    currentEl.setAttribute('aria-current', 'page');
}

function initDynamicNavbar() {
    try {
        sanitizer = getSanitizer();

        const checkData = () => {
            if (window.AppData && window.AppData.isLoaded) {
                renderNav(window.AppData.navItems, window.AppData.identity);
            } else {
                document.addEventListener('coreDataReady', (e) => {
                    renderNav(e.detail.navItems, e.detail.identity);
                }, { once: true });
            }
        };

        const renderNav = (navItemsResult, identityRes) => {
            const data = navItemsResult && navItemsResult.success ? navItemsResult.data : { areas: [], servicios: [] };
            
            const mappedData = typeof mapNavbarData === 'function' ? mapNavbarData({ success: true, data }) : data;
            const normalized = normalizeNavbarPayload(mappedData);
            
            const titleNosotros = (identityRes && identityRes.data && identityRes.data.titleUs) 
                ? identityRes.data.titleUs 
                : defaultNavConfig.us.label;

            renderDesktopNavbar(normalized.areas, normalized.servicios, titleNosotros);
            renderMobileNavbar(normalized.areas, normalized.servicios, titleNosotros);
            
            rebuildScrollspyMap();
            updateScrollspy();

            const dynamicContainer = document.getElementById('services-dynamic-container');
            if (dynamicContainer) {
                const observer = new MutationObserver(() => {
                    rebuildScrollspyMap();
                    updateScrollspy();
                    observer.disconnect();
                });
                observer.observe(dynamicContainer, { childList: true });
            }
        };

        checkData();
    } catch (err) {
        console.error("Error inicializando navbar", err);
    }
}

function setupHamMenu() {
    const hamInput = document.getElementById('ham-menu');
    if (!hamInput) return;

    const toggleMenuState = () => {
        const nav = document.getElementById('myTopnav');
        const label = document.querySelector('.ham-menu-label');
        const isChecked = hamInput.checked;

        document.body.style.overflow = isChecked ? 'hidden' : '';
        document.documentElement.style.overflow = isChecked ? 'hidden' : '';

        if (isChecked) {
            if (nav) nav.style.top = '0';
            if (label) label.style.top = '0';
        } else {
            document.querySelectorAll('.submenu-open, .submenu-trigger-active').forEach(el => {
                el.classList.remove('submenu-open', 'submenu-trigger-active');
                if (el.hasAttribute('aria-expanded')) el.setAttribute('aria-expanded', 'false');
            });
        }
    };

    hamInput.addEventListener('change', toggleMenuState);

    const overlay = document.querySelector('.full-page-overlay'); 
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (hamInput.checked) {
                hamInput.checked = false;
                toggleMenuState();
            }
        });
    }

    const hamMenuContainer = document.querySelector('.ham-menu');
    if (hamMenuContainer) {
        hamMenuContainer.addEventListener('click', (event) => {
            const target = event.target.closest('a');
            if (target && !event.target.closest('.submenu-trigger') && hamInput.checked) {
                hamInput.checked = false;
                toggleMenuState();
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initDynamicNavbar();
        setupHamMenu();
    });
} else {
    initDynamicNavbar();
    setupHamMenu();
}

let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        window.requestAnimationFrame(() => {
            updateScrollspy();
            scrollTicking = false;
        });
        scrollTicking = true;
    }
}, { passive: true });




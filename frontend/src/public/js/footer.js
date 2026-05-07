import { mapFooterData } from './api/footer-mapper.js';

let copyrightCache = {
	year: new Date().getFullYear(),
	timestamp: Date.now()
};

const CACHE_DURATION = 30000;
const CACHE_KEY = 'kernotec_footer_cache';

function getCachedFooterData() {
	const cached = localStorage.getItem(CACHE_KEY);
	if (!cached) return null;
	
	try {
		const { data, timestamp } = JSON.parse(cached);
		if (Date.now() - timestamp < CACHE_DURATION) {
			return data;
		}
	} catch {
		return null;
	}
	return null;
}

function setCachedFooterData(data) {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify({
			data,
			timestamp: Date.now()
		}));
	} catch {
	}
}

function getSanitizer() {
	if (typeof window.DOMPurify !== 'undefined') {
		return window.DOMPurify;
	}
	return {
		sanitize: function(value) {
			const temp = document.createElement('div');
			temp.textContent = String(value || '');
			return temp.textContent;
		}
	};
}

function detectSocialType(item) {
	const rawName = String(item.name || '').trim().toLowerCase();
	const rawUrl = String(item.url || '').trim().toLowerCase();

	const typeMap = {
		'facebook': 'facebook',
		'linkedin': 'linkedin',
		'instagram': 'instagram',
		'tiktok': 'tiktok',
		'twitter': 'twitter',
		'x.com': 'twitter',
		'github': 'github',
		'correo': 'mail',
		'mail': 'mail',
		'mailto': 'mail'
	};

	for (const [keyword, type] of Object.entries(typeMap)) {
		if (rawName.includes(keyword) || rawUrl.includes(keyword)) {
			return type;
		}
	}

	return 'mail';
}

function getSocialMeta(type) {
	const map = {
		facebook: { className: 'social-button--facebook', icon: 'fab fa-facebook-f', label: 'Facebook' },
		linkedin: { className: 'social-button--linkedin', icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
		instagram: { className: 'social-button--instagram', icon: 'fab fa-instagram', label: 'Instagram' },
		tiktok: { className: 'social-button--tiktok', icon: 'fab fa-tiktok', label: 'TikTok' },
		twitter: { className: 'social-button--twitter', icon: 'fab fa-twitter', label: 'Twitter' },
		github: { className: 'social-button--github', icon: 'fab fa-github', label: 'GitHub' },
		mail: { className: 'social-button--mail', icon: 'fa-solid fa-envelope', label: 'Correo' }
	};

	return map[type] || map.mail;
}

function renderCopyright(year) {
	const copyright = document.querySelector('#footer-copyright');
	if (copyright) {
		copyright.textContent = `${year} KernoTec. Todos los derechos reservados ©`;
	}
}

function renderSocialButtons(footerData) {
	const container = document.getElementById('identity-social-buttons');
	if (!container) return;

	container.innerHTML = '';

	const sanitizer = getSanitizer();
	const socialItems = Array.isArray(footerData.social) ? footerData.social : [];

	socialItems.forEach(function(item) {
		const type = detectSocialType(item);
		const meta = getSocialMeta(type);
		const safeUrl = sanitizer.sanitize(item.url);
		const safeLabel = sanitizer.sanitize(item.name || meta.label);

		const link = document.createElement('a');
		link.href = safeUrl;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		link.className = `social-button ${meta.className}`;
		link.setAttribute('aria-label', safeLabel);

		const icon = document.createElement('i');
		icon.className = meta.icon;

		link.appendChild(icon);
		container.appendChild(link);
	});
}

function renderContactInfo(footerData) {
	const sanitizer = getSanitizer();

	const correoEl = document.getElementById('identity-correo');
	if (correoEl && footerData.correo) {
		correoEl.textContent = sanitizer.sanitize(footerData.correo);
	}

	const locationTextEl = document.getElementById('identity-location-text');
	if (locationTextEl && footerData.locationText) {
		locationTextEl.textContent = sanitizer.sanitize(footerData.locationText);
	}

	const locationLinkEl = document.getElementById('identity-location-link');
	if (locationLinkEl && footerData.locationUrl) {
		locationLinkEl.href = sanitizer.sanitize(footerData.locationUrl);
	}

	const locationIframeEl = document.getElementById('identity-location-iframe');
	if (locationIframeEl && footerData.locationUrl) {
		locationIframeEl.src = sanitizer.sanitize(footerData.locationUrl);
	}
}

function detectCacheBypass() {
	if (window.location.search.includes('refresh=true')) {
		return true;
	}
	
	try {
		const navigationList = performance.getEntriesByType('navigation');
		if (navigationList.length > 0) {
			const navEntry = navigationList[0];
			return navEntry.type === 'reload';
		}
	} catch {
		return false;
	}
	
	return false;
}

function processFooterData(apiResponse) {
    try {
        const mappedData = typeof mapFooterData === 'function'
            ? mapFooterData(apiResponse)
            : null;

        if (!mappedData) {
            renderCopyright(new Date().getFullYear());
            return;
        }

        renderCopyright(mappedData.year);
        renderContactInfo(mappedData);
        renderSocialButtons(mappedData);
    } catch (e) {
        renderCopyright(new Date().getFullYear());
    }
}

function loadFooterData() {
    if (window.AppData && window.AppData.isLoaded) {
        processFooterData(window.AppData.identity);
    } else {
        document.addEventListener('coreDataReady', function(e) {
            processFooterData(e.detail.identity);
        }, { once: true });
    }
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', loadFooterData);
} else {
	loadFooterData();
}
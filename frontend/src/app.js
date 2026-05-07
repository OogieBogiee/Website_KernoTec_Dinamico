const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;
const publicPath = path.join(__dirname, 'public');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || '';
const RECAPTCHA_ENABLED = process.env.RECAPTCHA_ENABLED !== 'false';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });



app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiadas solicitudes, intente más tarde' }
});

const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiados intentos de envío, intente más tarde' }
});

app.get('/api/navbar-items', apiLimiter, async (req, res) => {
    try {
        const cacheKey = 'navbar-items';
        const skipCache = req.query.refresh === 'true';
        
        if (!skipCache) {
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                console.log('[CACHE HIT] navbar-items');
                return res.json({
                    success: true,
                    data: cachedData,
                    source: 'cache'
                });
            }
        } else {
            console.log('[CACHE BYPASS] Solicitado refresh explícito');
        }

        // Llamar a Strapi
        const response = await axios.get(`${STRAPI_URL}/api/items`, {
            params: {
                'filters[visibility][$eq]': true,
                'fields': ['title_item', 'position_area', 'position_servicio', 'type', 'visibility'],
                'pagination[limit]': 100
            },
            headers: STRAPI_TOKEN ? {
                'Authorization': `Bearer ${STRAPI_TOKEN}`
            } : {}
        });

        if (!response.data || !response.data.data) {
            throw new Error('Respuesta inválida de Strapi');
        }

        const areas = [];
        const servicios = [];

        response.data.data.forEach(item => {
            const itemData = {
                id: item.id,
                title: item.title_item,
                type: item.type
            };

            if (item.type === 'Área') {
                itemData.position = item.position_area || 999;
                areas.push(itemData);
            } else if (item.type === 'Servicio') {
                itemData.position = item.position_servicio || 999;
                servicios.push(itemData);
            }
        });

        const result = {
            areas: areas.sort((a, b) => a.position - b.position),
            servicios: servicios.sort((a, b) => a.position - b.position),
            total: areas.length + servicios.length
        };

        cache.set(cacheKey, result);
        console.log(`[SUCCESS] ${result.total} items cargados (${areas.length} áreas, ${servicios.length} servicios)`);

        res.json({
            success: true,
            data: result,
            source: 'strapi'
        });

    } catch (error) {
        console.error('[ERROR] /api/navbar-items:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Error al cargar items del navbar',
            data: {
                areas: [],
                servicios: [],
                total: 0
            }
        });
    }
});


app.post('/api/navbar-items/refresh', apiLimiter, (req, res) => {
    cache.del('navbar-items');
    console.log('[CACHE] navbar-items cache cleared');
    res.json({ success: true, message: 'Cache limpiado exitosamente' });
});

app.get('/api/carousel-slides', apiLimiter, async (req, res) => {
    try {
        const cacheKey = 'carousel-slides';
        const skipCache = req.query.refresh === 'true';
        
        if (!skipCache) {
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                console.log('[CACHE HIT] carousel-slides');
                return res.json({
                    success: true,
                    data: cachedData,
                    source: 'cache'
                });
            }
        } else {
            console.log('[CACHE BYPASS] Solicitado refresh explícito para carousel');
        }

        const response = await axios.get(`${STRAPI_URL}/api/items`, {
            params: {
                'filters[visibility][$eq]': true,
                'filters[visibility_slider][$eq]': true,
                'filters[$or][0][type][$eq]': 'Área',
                'filters[$or][1][type][$eq]': 'Servicio',
                'fields': ['title_item', 'description_short', 'position_area', 'position_servicio', 'type', 'visibility', 'visibility_slider'],
                'populate': '*',
                'pagination[limit]': 100
            },
            headers: STRAPI_TOKEN ? {
                'Authorization': `Bearer ${STRAPI_TOKEN}`
            } : {}
        });

        if (!response.data || !response.data.data) {
            throw new Error('Respuesta inválida de Strapi');
        }

        const areas = response.data.data
            .filter(item => item.type === 'Área')
            .map(item => {
                const imageUrl = item.image_background?.[0]?.url;
                const videoUrl = item.video_slider?.[0]?.url;
                
                return {
                    id: item.id,
                    title: item.title_item || 'Sin título',
                    description: item.description_short || '',
                    position: item.position_area,
                    type: 'Área',
                    imageUrl: imageUrl ? `/media${imageUrl}` : null,
                    videoUrl: videoUrl ? `/media${videoUrl}` : null
                };
            })
            .sort((a, b) => a.position - b.position);

        const servicios = response.data.data
            .filter(item => item.type === 'Servicio')
            .map(item => {
                const imageUrl = item.image_background?.[0]?.url;
                const videoUrl = item.video_slider?.[0]?.url;
                
                return {
                    id: item.id,
                    title: item.title_item || 'Sin título',
                    description: item.description_short || '',
                    position: item.position_servicio,
                    type: 'Servicio',
                    imageUrl: imageUrl ? `/media${imageUrl}` : null,
                    videoUrl: videoUrl ? `/media${videoUrl}` : null
                };
            })
            .sort((a, b) => a.position - b.position);

        const slides = [...areas, ...servicios];

        const result = {
            slides,
            total: slides.length,
            areas: areas.length,
            servicios: servicios.length
        };

        cache.set(cacheKey, result);
        console.log(`[SUCCESS] ${result.total} slides cargados (${areas.length} áreas, ${servicios.length} servicios)`);

        res.json({
            success: true,
            data: result,
            source: 'strapi'
        });

    } catch (error) {
        console.error('[ERROR] /api/carousel-slides:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Error al cargar slides del carrusel',
            data: {
                slides: [],
                total: 0
            }
        });
    }
});

app.post('/api/carousel-slides/refresh', apiLimiter, (req, res) => {
    cache.del('carousel-slides');
    console.log('[CACHE] carousel-slides cache cleared');
    res.json({ success: true, message: 'Cache de carrusel limpiado exitosamente' });
});

app.get('/api/services-areas', apiLimiter, async (req, res) => {
    try {
        const cacheKey = 'services-areas';
        const skipCache = req.query.refresh === 'true';
        
        if (!skipCache) {
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                console.log('[CACHE HIT] services-areas');
                return res.json({
                    success: true,
                    data: cachedData,
                    source: 'cache'
                });
            }
        } else {
            console.log('[CACHE BYPASS] Solicitado refresh explícito para services');
        }

        const response = await axios.get(`${STRAPI_URL}/api/items`, {
            params: {
                'filters[visibility][$eq]': true,
                'filters[$or][0][type][$eq]': 'Área',
                'filters[$or][1][type][$eq]': 'Servicio',
                'populate[skill][populate][technology][populate]': 'icon_technology',
                'populate[skill][populate][skill_icon]': true,
                'populate[skill][populate][skill_background]': true,
                'populate[image_background]': true,
                'pagination[limit]': 100
            },
            headers: STRAPI_TOKEN ? {
                'Authorization': `Bearer ${STRAPI_TOKEN}`
            } : {}
        });

        if (!response.data || !response.data.data) {
            throw new Error('Respuesta inválida de Strapi');
        }

        const rawData = response.data.data;
        
        
        for (const item of rawData) {
            if (item.skill && item.skill.length > 0) {
                for (const skill of item.skill) {
                    if (skill.technology && skill.technology.length > 0) {
                        for (let i = 0; i < skill.technology.length; i++) {
                            const tech = skill.technology[i];
                            if (tech.icon_technology) {
                                if (typeof tech.icon_technology === 'number') {
                                    try {
                                        const mediaResponse = await axios.get(`${STRAPI_URL}/api/upload/files/${tech.icon_technology}`, {
                                            headers: STRAPI_TOKEN ? { 'Authorization': `Bearer ${STRAPI_TOKEN}` } : {}
                                        });
                                        skill.technology[i].icon_technology = [mediaResponse.data];
                                    } catch (err) {
                                        console.error(`[ERROR] Failed to fetch media ${tech.icon_technology}:`, err.message);
                                    }
                                } else if (Array.isArray(tech.icon_technology) && tech.icon_technology.length > 0 && typeof tech.icon_technology[0] === 'number') {
                                    try {
                                        const mediaResponse = await axios.get(`${STRAPI_URL}/api/upload/files/${tech.icon_technology[0]}`, {
                                            headers: STRAPI_TOKEN ? { 'Authorization': `Bearer ${STRAPI_TOKEN}` } : {}
                                        });
                                        skill.technology[i].icon_technology = [mediaResponse.data];
                                    } catch (err) {
                                        console.error(`[ERROR] Failed to fetch media ${tech.icon_technology[0]}:`, err.message);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        const areas = rawData
            .filter(item => item.type === 'Área')
            .map(item => ({
                id: item.id,
                title_item: item.title_item || 'Sin título',
                description_short: item.description_short || '',
                description_long: item.description_long || item.description_short || '',
                type: item.type,
                position: item.position_area || 999,
                image_background: (item.image_background && item.image_background[0] && item.image_background[0].url) ? {
                    url: `/media${item.image_background[0].url}`,
                    alt: item.image_background[0].alternativeText || item.title_item
                } : null,
                skills: (item.skill || []).map(skill => ({
                    id: skill.id,
                    title: skill.skill_title || 'Sin título',
                    description: skill.skill_description || '',
                    descriptionLong: skill.skill_card_description || skill.skill_description || '',
                    skill_background: (skill.skill_background && Array.isArray(skill.skill_background)) ? 
                        skill.skill_background.map(bg => ({
                            url: bg.url ? `/media${bg.url}` : null,
                            alt: bg.alternativeText || skill.skill_title || 'Background'
                        })).filter(bg => bg.url) : [],
                    skill_icon: (skill.skill_icon && skill.skill_icon[0] && skill.skill_icon[0].url) ? {
                        url: `/media${skill.skill_icon[0].url}`,
                        alt: skill.skill_icon[0].alternativeText || skill.skill_title
                    } : null,
                    technologies: (skill.technology || []).map(tech => {
                        if (!tech || typeof tech !== 'object') return null;
                        
                        const iconTech = Array.isArray(tech.icon_technology) ? tech.icon_technology[0] : tech.icon_technology;
                        const logoUrl = (iconTech && iconTech.url) 
                            ? `/media${iconTech.url}` 
                            : null;
                        
                        return {
                            id: tech.id,
                            name: tech.title_technology || 'Tecnología',
                            logo: logoUrl ? {
                                url: logoUrl,
                                alt: iconTech?.alternativeText || tech.title_technology
                            } : null,
                            logo_width: tech.logo_width || 'vertical'
                        };
                    }).filter(t => t !== null)
                }))
            }))
            .sort((a, b) => a.position - b.position);

        const servicios = rawData
            .filter(item => item.type === 'Servicio')
            .map(item => ({
                id: item.id,
                title_item: item.title_item || 'Sin título',
                description_short: item.description_short || '',
                description_long: item.description_long || item.description_short || '',
                type: item.type,
                position: item.position_servicio || 999,
                image_background: (item.image_background && item.image_background[0] && item.image_background[0].url) ? {
                    url: `/media${item.image_background[0].url}`,
                    alt: item.image_background[0].alternativeText || item.title_item
                } : null,
                skills: (item.skill || []).map(skill => ({
                    id: skill.id,
                    title: skill.skill_title || 'Sin título',
                    description: skill.skill_description || '',
                    descriptionLong: skill.skill_card_description || skill.skill_description || '',
                    skill_background: (skill.skill_background && skill.skill_background.length > 0) ? 
                        skill.skill_background.map(bg => ({
                            url: bg.url ? `/media${bg.url}` : null,
                            alt: bg.alternativeText || skill.skill_title || 'Background'
                        })).filter(bg => bg.url) : [],
                    skill_icon: (skill.skill_icon && skill.skill_icon[0] && skill.skill_icon[0].url) ? {
                        url: `/media${skill.skill_icon[0].url}`,
                        alt: skill.skill_icon[0].alternativeText || skill.skill_title
                    } : null,
                    technologies: (skill.technology || []).map(tech => {
                        if (!tech || typeof tech !== 'object') return null;
                        
                        const iconTech = Array.isArray(tech.icon_technology) ? tech.icon_technology[0] : tech.icon_technology;
                        const logoUrl = (iconTech && iconTech.url) 
                            ? `/media${iconTech.url}` 
                            : null;
                        
                        return {
                            id: tech.id,
                            name: tech.title_technology || 'Tecnología',
                            logo: logoUrl ? {
                                url: logoUrl,
                                alt: iconTech?.alternativeText || tech.title_technology
                            } : null,
                            logo_width: tech.logo_width || 'vertical'
                        };
                    }).filter(t => t !== null)
                }))
            }))
            .sort((a, b) => a.position - b.position);

        const allItems = [...areas, ...servicios];

        const result = {
            items: allItems,
            total: allItems.length,
            areas: areas.length,
            servicios: servicios.length
        };

        cache.set(cacheKey, result);
        console.log(`[SUCCESS] ${result.total} service items cargados (${areas.length} áreas, ${servicios.length} servicios)`);

        res.json({
            success: true,
            data: result,
            source: 'strapi'
        });

    } catch (error) {
        console.error('[ERROR] /api/services-areas:', error.message);
        console.error(error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Error al cargar servicios',
            data: {
                items: [],
                total: 0
            }
        });
    }
});

app.post('/api/services-areas/refresh', apiLimiter, (req, res) => {
    cache.del('services-areas');
    console.log('[CACHE] services-areas cache cleared');
    res.json({ success: true, message: 'Cache de servicios limpiado exitosamente' });
});


app.get('/api/staff', apiLimiter, async (req, res) => {
    try {
        const cacheKey = 'staff';
        const skipCache = req.query.refresh === 'true';
        
        if (!skipCache) {
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                console.log('[CACHE HIT] staff');
                return res.json({
                    success: true,
                    data: cachedData,
                    source: 'cache'
                });
            }
        } else {
            console.log('[CACHE BYPASS] Staff refresh solicitado');
        }

        const response = await axios.get(`${STRAPI_URL}/api/names`, {
            params: {
                'populate': '*',
                'pagination[limit]': 100
            },
            headers: STRAPI_TOKEN ? {
                'Authorization': `Bearer ${STRAPI_TOKEN}`
            } : {}
        });

        if (!response.data || !response.data.data) {
            throw new Error('Respuesta inválida de Strapi');
        }

        const rawData = response.data.data;

        const staffMembers = rawData
            .map(item => ({
                id: item.id,
                full_name: item.full_name || 'Sin nombre',
                position_staff: item.position_staff || '',
                saying: item.saying || '',
                image_color_front: item.image_color_front ? {
                    url: `/media${item.image_color_front.url}`,
                    alt: item.image_color_front.alternativeText || item.full_name
                } : null,
                image_color_top: item.image_color_top ? {
                    url: `/media${item.image_color_top.url}`,
                    alt: item.image_color_top.alternativeText || item.full_name
                } : null,
                image_working: item.image_working ? {
                    url: `/media${item.image_working.url}`,
                    alt: item.image_working.alternativeText || item.full_name
                } : null
            }))
            .filter(item => item.full_name !== 'Sin nombre');

        const result = {
            members: staffMembers,
            total: staffMembers.length
        };

        cache.set(cacheKey, result);
        console.log(`[SUCCESS] ${result.total} staff members cargados`);

        res.json({
            success: true,
            data: result,
            source: 'strapi'
        });

    } catch (error) {
        console.error('[ERROR] /api/staff:', error.message);
        console.error(error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Error al cargar staff',
            data: {
                members: [],
                total: 0
            }
        });
    }
});

app.post('/api/staff/refresh', apiLimiter, (req, res) => {
    cache.del('staff');
    console.log('[CACHE] staff cache cleared');
    res.json({ success: true, message: 'Cache de staff limpiado exitosamente' });
});

app.get('/api/stakeholders', apiLimiter, async (req, res) => {
    try {
        const cacheKey = 'stakeholders';
        const skipCache = req.query.refresh === 'true';

        if (!skipCache) {
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                return res.json({ success: true, data: cachedData, source: 'cache' });
            }
        }

        const response = await axios.get(`${STRAPI_URL}/api/stakeholders`, {
            params: {
                'populate': '*',
                'pagination[limit]': 200
            },
            headers: STRAPI_TOKEN ? { 'Authorization': `Bearer ${STRAPI_TOKEN}` } : {}
        });

        if (!response.data || !response.data.data) {
            throw new Error('Respuesta inválida de Strapi');
        }

        const rawData = response.data.data;

        const mapItem = (item) => {
            const icon = Array.isArray(item.icon_stakeholder)
                ? item.icon_stakeholder[0]
                : item.icon_stakeholder;

            return {
                id: item.id,
                title: item.title_stakeholder || '',
                iconUrl: (icon && icon.url) ? `/media${icon.url}` : null,
                iconAlt: (icon && icon.alternativeText) ? icon.alternativeText : (item.title_stakeholder || ''),
                url: item.url_stakeholder || null,
                type: item.type_stakeholder
            };
        };

        const clientes = rawData
            .filter(item => item.type_stakeholder?.toLowerCase() === 'cliente')
            .map(mapItem);

        const partners = rawData
            .filter(item => item.type_stakeholder?.toLowerCase() === 'partner')
            .map(mapItem);

        const result = {
            clientes,
            partners,
            total: clientes.length + partners.length
        };

        cache.set(cacheKey, result);
        console.log(`[SUCCESS] ${result.total} stakeholders cargados (${clientes.length} clientes, ${partners.length} partners)`);

        res.json({ success: true, data: result, source: 'strapi' });

    } catch (error) {
        console.error('[ERROR] /api/stakeholders:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al cargar stakeholders',
            data: { clientes: [], partners: [], total: 0 }
        });
    }
});

app.post('/api/stakeholders/refresh', apiLimiter, (req, res) => {
    cache.del('stakeholders');
    console.log('[CACHE] stakeholders cache cleared');
    res.json({ success: true, message: 'Cache de stakeholders limpiado exitosamente' });
});

app.get('/api/identity', apiLimiter, async (req, res) => {
    try {
        const cacheKey = 'identity';
        const skipCache = req.query.refresh === 'true';

        if (!skipCache) {
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                return res.json({ success: true, data: cachedData, source: 'cache' });
            }
        }

        const response = await axios.get(`${STRAPI_URL}/api/identity`, {
            params: {
                'populate[image_background_identity]': true,
                'populate[video_identity]': true,
                'populate[accordion][populate]': 'media_accordion',
                'populate[image_background_accordion]': true,
                'populate[social]': true
            },
            headers: STRAPI_TOKEN ? { 'Authorization': `Bearer ${STRAPI_TOKEN}` } : {}
        });

        if (!response.data || !response.data.data) {
            return res.json({ success: true, data: null, source: 'strapi' });
        }

        const identityData = response.data.data;
        const item = Array.isArray(identityData) ? identityData[0] : identityData;

        if (!item) {
            return res.json({ success: true, data: null, source: 'strapi' });
        }

        const base = item.attributes ? { ...item.attributes, id: item.id } : item;
        const imgField = base.image_background_identity;
        const vidField = base.video_identity;
        const bgAccField = base.image_background_accordion;

        const result = {
            id: base.id,
            title: base.title_identity || '',
            description: base.description_identity || '',
            imageUrl: (imgField && imgField.url) ? `/media${imgField.url}` : null,
            imageAlt: (imgField && imgField.alternativeText) ? imgField.alternativeText : (base.title_identity || 'KernoTec'),
            videoUrl: (vidField && vidField.url) ? `/media${vidField.url}` : null,
            bgAccordionUrl: (bgAccField && bgAccField.url) ? `/media${bgAccField.url}` : null,
            titleUs: base.title_us || '',
            descriptionUs: base.descriptions_us || '',
            correo: base.correo || '',
            locationText: base.location_text || '',
            locationUrl: base.location_url || '',
            accordion: (base.accordion || []).map(acc => {
                const media = acc.media_accordion;
                const isVideo = media && media.mime && media.mime.startsWith('video/');
                return {
                    title: acc.title_accordion || '',
                    description: acc.description_accordion || '',
                    mediaUrl: (media && media.url) ? `/media${media.url}` : null,
                    mediaAlt: (media && media.alternativeText) ? media.alternativeText : (acc.title_accordion || ''),
                    isVideo: isVideo || false
                };
            }),
            social: (base.social || []).map(social => ({
                name: social.social_network_name || '',
                url: social.social_network_url || ''
            }))
        };

        cache.set(cacheKey, result);

        res.json({ success: true, data: result, source: 'strapi' });

    } catch (error) {
        console.error('[ERROR] /api/identity:', error.message);
        res.status(500).json({ success: false, error: 'Error al cargar identity', data: null });
    }
});

app.post('/api/identity/refresh', apiLimiter, (req, res) => {
    cache.del('identity');
    res.json({ success: true, message: 'Cache de identity limpiado exitosamente' });
});

function buildEmbedUrlFromMapUrl(inputUrl) {
    try {
        const parsed = new URL(inputUrl);
        const lowerHost = parsed.hostname.toLowerCase();
        const lowerPath = parsed.pathname.toLowerCase();

        if (lowerHost.includes('google.com') && lowerPath.includes('/maps/embed')) {
            return inputUrl;
        }

        const queryParam = parsed.searchParams.get('q') || parsed.searchParams.get('query') || parsed.searchParams.get('ll');
        if (queryParam) {
            return `https://www.google.com/maps?q=${encodeURIComponent(queryParam)}&output=embed`;
        }

        const placeMatch = parsed.pathname.match(/\/place\/([^/]+)/i);
        if (placeMatch && placeMatch[1]) {
            const placeName = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
            return `https://www.google.com/maps?q=${encodeURIComponent(placeName)}&output=embed`;
        }

        const coordinatesMatch = parsed.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordinatesMatch && coordinatesMatch[1] && coordinatesMatch[2]) {
            const coordinateQuery = `${coordinatesMatch[1]},${coordinatesMatch[2]}`;
            return `https://www.google.com/maps?q=${encodeURIComponent(coordinateQuery)}&output=embed`;
        }

        return `https://www.google.com/maps?q=${encodeURIComponent(inputUrl)}&output=embed`;
    } catch (error) {
        return null;
    }
}

app.get('/api/maps-embed-url', apiLimiter, async (req, res) => {
    try {
        const rawUrl = String(req.query.url || '').trim();
        if (!rawUrl) {
            return res.status(400).json({ success: false, error: 'URL requerida' });
        }

        let parsedInput;
        try {
            parsedInput = new URL(rawUrl);
        } catch (error) {
            return res.status(400).json({ success: false, error: 'URL inválida' });
        }

        if (!/^https?:$/i.test(parsedInput.protocol)) {
            return res.status(400).json({ success: false, error: 'Protocolo no permitido' });
        }

        const lowerHost = parsedInput.hostname.toLowerCase();
        if (!lowerHost.includes('maps.app.goo.gl') && !lowerHost.includes('google.com')) {
            return res.status(403).json({ success: false, error: 'Dominio no permitido' });
        }

        const cacheKey = `map-embed:${rawUrl}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json({ success: true, data: cached, source: 'cache' });
        }

        const embedUrl = buildEmbedUrlFromMapUrl(rawUrl);
        if (!embedUrl) {
            return res.status(422).json({ success: false, error: 'No se pudo generar URL embebible' });
        }

        const data = { embedUrl, rawUrl };
        cache.set(cacheKey, data);

        res.json({ success: true, data, source: 'strapi' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al resolver URL de mapa' });
    }
});

const clean = (str, max = 500) => String(str || '').replace(/[<>"']/g, '').trim().substring(0, max);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let mailTransporter = null;

function getMailTransporter() {
    if (!mailTransporter) {
        mailTransporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
            tls: { rejectUnauthorized: false },
            pool: true,
            maxConnections: 3
        });
    }
    return mailTransporter;
}

async function verifyRecaptcha(token) {
    try {
        const body = new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token });
        const { data } = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            body.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 5000 }
        );
        return data;
    } catch (err) {
        console.error('[reCAPTCHA] Error de red:', err.message);
        return { success: false, 'error-codes': ['network-error'] };
    }
}

app.post('/api/send-email', emailLimiter, async (req, res) => {
    try {
        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
            console.error('[ERROR] /api/send-email: Faltan variables SMTP en .env');
            return res.status(500).json({ success: false, error: 'El servidor de correo no está configurado.' });
        }

        const { nombre, correo, tel, interes, mensaje, recaptchaToken } = req.body;

        if (!nombre || !correo || !mensaje || !recaptchaToken) {
            return res.status(400).json({ success: false, error: 'Campos requeridos faltantes' });
        }

        if (!EMAIL_REGEX.test(correo)) {
            return res.status(400).json({ success: false, error: 'Correo electrónico inválido' });
        }

        if (RECAPTCHA_ENABLED) {
            const captchaResult = await verifyRecaptcha(recaptchaToken);
            if (!captchaResult.success) {
                return res.status(400).json({ success: false, error: 'Verificación reCAPTCHA fallida' });
            }
        } else {
            console.warn('[reCAPTCHA] Verificación deshabilitada (RECAPTCHA_ENABLED=false). Solo para desarrollo.');
        }

        const now = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' });

        await getMailTransporter().sendMail({
            from: `"KernoTec Web" <${SMTP_USER}>`,
            to: SMTP_USER,
            replyTo: clean(correo, 200),
            subject: 'KernoTec - Contáctenos',
            html: `<div style="font-size:15pt;font-family:Arial">
                Nombre: <strong>${clean(nombre)}</strong><br>
                Número: <strong>${clean(tel)}</strong><br>
                Correo: <strong>${clean(correo, 200)}</strong><br>
                Interés: <strong>${clean(interes)}</strong><br>
                Mensaje: ${clean(mensaje)}<br>
                Enviado a las ${now}
            </div>`
        });

        res.json({ success: true, message: 'Mensaje enviado correctamente' });

    } catch (error) {
        console.error('[ERROR] /api/send-email:', error.code || error.message, error.response || '');
        mailTransporter = null;

        const errorMap = {
            EAUTH: 'Error de autenticación del servidor de correo.',
            ECONNREFUSED: 'No se pudo conectar al servidor de correo.',
            ESOCKET: 'No se pudo conectar al servidor de correo.',
            ETIMEDOUT: 'Tiempo de espera agotado al conectar con el servidor de correo.'
        };

        res.status(500).json({
            success: false,
            error: errorMap[error.code] || 'Error al enviar el mensaje. Intenta nuevamente.'
        });
    }
});

app.get('/vendor/purify.min.js', (req, res) => {
    res.set('Cache-Control', 'public, max-age=86400');
    res.sendFile(path.join(__dirname, 'node_modules/dompurify/dist/purify.min.js'));
});

app.get('/media/*', async (req, res) => {
    try {
        const mediaPath = req.path.replace('/media', '');

        if (!mediaPath.startsWith('/uploads/')) {
            console.warn(`[SEGURIDAD] Intento de acceso no autorizado bloqueado en proxy media: ${mediaPath}`);
            return res.status(403).json({ success: false, error: 'Forbidden: Invalid media path' });
        }

        if (mediaPath.includes('..')) {
            console.warn(`[SEGURIDAD] Intento de directory traversal bloqueado: ${mediaPath}`);
            return res.status(403).json({ success: false, error: 'Forbidden: Invalid directory traversal' });
        }

        const response = await axios.get(`${STRAPI_URL}${mediaPath}`, {
            responseType: 'stream',
            headers: STRAPI_TOKEN ? { 'Authorization': `Bearer ${STRAPI_TOKEN}` } : {}
        });

        if (response.headers['content-type']) {
            res.set('Content-Type', response.headers['content-type']);
        }
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('X-Content-Type-Options', 'nosniff');
        
        response.data.pipe(res);
    } catch (error) {
        console.error(`[ERROR] No se pudo cargar el media: ${req.path}`);
        res.status(404).send('Not found');
    }
});

app.use('/', express.static(publicPath));

app.listen(port, () => {

});
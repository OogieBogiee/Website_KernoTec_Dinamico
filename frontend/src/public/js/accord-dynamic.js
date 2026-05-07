import { mapAccordionData } from './api/accordion-mapper.js';

function processAccordionData(apiResponse) {
    if (!apiResponse) return;
    const mappedData = mapAccordionData(apiResponse);
    if (!mappedData || !mappedData.hasData) return;
    renderAccordion(mappedData);
}

function loadIdentityAccordion() {
    if (window.AppData && window.AppData.isLoaded) {
        processAccordionData(window.AppData.identity);
    } else {
        document.addEventListener('coreDataReady', function(e) {
            processAccordionData(e.detail.identity);
        }, { once: true });
    }
}

function createAccordionButton(titleText, isActive) {
    const btn = document.createElement('button');
    btn.className = 'accordion' + (isActive ? ' active-accord' : '');
    const span = document.createElement('span');
    span.className = 'screen-titulo-accordion';
    span.textContent = titleText; 
    btn.appendChild(span);
    return btn;
}

function createAccordionPanel(descText, isActive) {
    const div = document.createElement('div');
    div.className = 'panel-accord';
    if (isActive) {
        div.style.maxHeight = '710px';
    }
    const span = document.createElement('span');
    span.className = 'screen-parrafo';
    span.textContent = descText; 
    div.appendChild(span);
    return div;
}

function renderAccordion(accordionData) {
    const container2a = document.querySelector('.container2a');
    const contenido = document.querySelector('.container2a .contenido');
    if (!contenido) return;

    const parte2 = document.querySelector('.container2a .parte2');
    if (!parte2) return;

    if (accordionData.bgAccordionUrl && container2a) {
        const bgUrl = DOMPurify.sanitize(accordionData.bgAccordionUrl);
        container2a.style.backgroundImage = `linear-gradient(to left, rgba(41, 40, 40, 0.95), rgba(41, 40, 40, 0.95)), url('${bgUrl}')`;
        container2a.style.backgroundSize = 'cover';
        container2a.style.backgroundPosition = 'center';
        container2a.style.backgroundAttachment = 'fixed';
    }
    contenido.innerHTML = '';

    const sanitizer = typeof DOMPurify !== 'undefined' ? window.DOMPurify : { sanitize: val => String(val || '') };
    
    // const nosotrosTitle = sanitizer.sanitize(accordionData.titleUs || 'Nosotros');
    // const nosotrosDesc = sanitizer.sanitize(accordionData.descriptionUs || '');   

    // contenido.appendChild(createAccordionButton(nosotrosTitle, true));
    // contenido.appendChild(createAccordionPanel(nosotrosDesc, true));

    if (Array.isArray(accordionData.accordion)) {
        accordionData.accordion.forEach(function(acc, index) {
            const title = sanitizer.sanitize(acc.title);
            const description = sanitizer.sanitize(acc.description);
            const isFirst = (index === 0);

            contenido.appendChild(createAccordionButton(title, isFirst));
            contenido.appendChild(createAccordionPanel(description, isFirst));
        });
    }

    buildMediaPanels(parte2, accordionData.accordion);
    initAccordionBehavior(parte2, accordionData.accordion);
}

function buildMediaPanels(parte2, accordionItems) {
    var existingPanels = parte2.querySelectorAll('.dynamic-media');
    for (var i = 0; i < existingPanels.length; i++) {
        existingPanels[i].remove();
    }

    accordionItems.forEach(function(acc, index) {
        if (!acc.mediaUrl) return;

        var wrapper = document.createElement('div');
        wrapper.className = 'fotoMision cuadroFotosHide dynamic-media dynamic-media-' + index;

        var panelCompleto = document.createElement('div');
        panelCompleto.className = 'panelCompleto';

        var fot = document.createElement('div');
        fot.className = 'fot';

        if (acc.isVideo) {
            var video = document.createElement('video');
            video.autoplay = false;
            video.preload = 'none'; 
            video.muted = true;
            video.loop = true;
            video.setAttribute('playsinline', '');
            var source = document.createElement('source');
            source.src = DOMPurify.sanitize(acc.mediaUrl);
            source.type = 'video/mp4';
            video.appendChild(source);
            fot.appendChild(video);
        } else {
            var img = document.createElement('img');
            img.loading = 'lazy';
            img.src = DOMPurify.sanitize(acc.mediaUrl);
            img.alt = DOMPurify.sanitize(acc.mediaAlt);
            fot.appendChild(img);
        }

        panelCompleto.appendChild(fot);
        wrapper.appendChild(panelCompleto);
        parte2.appendChild(wrapper);
    });
}

function initAccordionBehavior(parte2, accordionItems) {
    var contenido = document.querySelector('.container2a .contenido');
    var buttons = contenido.querySelectorAll('.accordion');
    var panels = contenido.querySelectorAll('.panel-accord');
    var cuadroFotos = parte2.querySelector('.pictures');

    var mediaPanels = [];
    accordionItems.forEach(function(item, index) {
        mediaPanels.push(parte2.querySelector('.dynamic-media-' + index));
    });

    function hideAllMedia() {
        if (cuadroFotos) cuadroFotos.classList.add('cuadroFotosHide');
        mediaPanels.forEach(function(panel) {
            if (panel) {
                panel.classList.add('cuadroFotosHide');
                var video = panel.querySelector('video');
                if (video) video.pause();
            }
        });
    }

    for (var i = 0; i < buttons.length; i++) {
        (function(idx) {
            buttons[idx].addEventListener('click', function() {
                hideAllMedia();

                var mediaPanel = mediaPanels[idx];
                if (mediaPanel) {
                    mediaPanel.classList.remove('cuadroFotosHide');
                    var video = mediaPanel.querySelector('video');
                    if (video) video.play().catch(function(e) { console.log("Autoplay context: ", e); });
                }

                for (var j = 0; j < buttons.length; j++) {
                    buttons[j].classList.remove('active-accord');
                }

                for (var j = 0; j < panels.length; j++) {
                    panels[j].style.maxHeight = null;
                }

                this.classList.add('active-accord');
                var panel = this.nextElementSibling;
                if (panel) {
                    panel.style.maxHeight = '650px';
                }
            });
        })(i);
    }
    
    // Activar visualmente el primer ítem al cargar
    if (cuadroFotos) cuadroFotos.classList.add('cuadroFotosHide'); // Ocultar el grid
    if (mediaPanels.length > 0 && mediaPanels[0]) {
        mediaPanels[0].classList.remove('cuadroFotosHide');
    }
}

loadIdentityAccordion();

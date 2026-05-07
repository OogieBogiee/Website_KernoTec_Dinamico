import { mapIdentityData, sanitizeMediaUrl } from './api/banner-mapper.js';

var containerBanner = document.querySelector(".containerBanner");
var containerImages = document.querySelector(".containerImages");
var image = document.querySelectorAll(".image");
var image2 = document.querySelectorAll(".image2");
var containerCircle = document.querySelector(".containerCircle");

var textA = document.querySelector(".textA");

var swText = 1;
var swRot = false;
var timeoutId = null;

var arrayImgs = [];
var allTextContainers = [textA];

function getSanitizer() {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify;
    }
    return {
        sanitize: function(value) {
            var temp = document.createElement('div');
            temp.textContent = String(value || '');
            return temp.textContent;
        }
    };
}

function processIdentityData(apiResponse) {
    const sanitizer = getSanitizer();
    if (!apiResponse) return;
    const identity = mapIdentityData(apiResponse);
    if (!identity) return;
    applyIdentityData(identity, sanitizer);
}

function loadIdentityData() {
    return new Promise((resolve) => {
        if (window.AppData && window.AppData.isLoaded) {
            processIdentityData(window.AppData.identity);
            resolve();
        } else {
            document.addEventListener('coreDataReady', function(e) {
                processIdentityData(e.detail.identity);
                resolve();
            }, { once: true });
        }
    });
}

function applyIdentityData(identity, sanitizer) {
    if (!identity) return;

        if (identity.title && textA) {
            const titleEl = textA.querySelector('.screen1-titulo');
            if (titleEl) {
                titleEl.innerHTML = sanitizer.sanitize(identity.title) + ' <span class="text-color-1">°</span>';
            }
        }

        if (identity.description && textA) {
            const descEl = textA.querySelector('.screen1-parrafo');
            if (descEl) {
                descEl.textContent = identity.description;
            }
        }

        if (identity.imageUrl) {
            const mainImg = document.querySelector('.container1 .carousel-images.active');
            const safeImageUrl = sanitizeMediaUrl(identity.imageUrl, sanitizer);
            if (mainImg) {
                if (safeImageUrl) {
                    mainImg.src = safeImageUrl;
                }
                mainImg.alt = sanitizer.sanitize(identity.imageAlt);
            }
        }

        if (identity.videoUrl) {
            const safeVideoUrl = sanitizeMediaUrl(identity.videoUrl, sanitizer);
            if (safeVideoUrl) {
                arrayImgs[0] = safeVideoUrl;
                const videoEls = document.querySelectorAll('.containerImages .image.i1, .containerImages .image2.i1');
                videoEls.forEach(vid => {
                    const src = vid.querySelector('source');
                    if (src) {
                        src.src = safeVideoUrl;
                        vid.load();
                    }
                });
            }
        }
}

async function loadCarouselSlides() {
    try {
        const sanitizer = getSanitizer();
        const response = await fetch('/api/carousel-slides');
        
        if (response.status === 429) {
            if (window.showApiRateLimitWarning) window.showApiRateLimitWarning();
            return;
        }

        if (!response.ok) {
            return;
        }
        const result = await response.json();

        if (result.success && result.data.slides && result.data.slides.length > 0) {
            
            const carouselContainer = document.querySelector('.container1');
            const containerImages = document.querySelector('.containerImages');
            const bannerDiv = document.querySelector('.banner');
            
            result.data.slides.forEach((slide, index) => {
                const textClass = String.fromCharCode(66 + index);
                
                const textContainer = document.createElement('div');
                textContainer.className = `screen1-text-container text${textClass} tHide`;
                
                const title = sanitizer.sanitize(slide.title);
                const description = sanitizer.sanitize(slide.description);
                
                textContainer.innerHTML = `
                    <span class="screen1-titulo">${title} <span class="text-color-1">°</span></span>
                    <span class="screen1-parrafo">${description}</span>
                `;
                
                carouselContainer.appendChild(textContainer);
                allTextContainers.push(textContainer);
                
                if (slide.imageUrl) {
                    const safeImageUrl = sanitizeMediaUrl(slide.imageUrl, sanitizer);
                    if (safeImageUrl) {
                        const img = document.createElement('img');
                        img.loading = 'lazy';
                        img.src = safeImageUrl;
                        img.className = 'carousel-images';
                        img.alt = sanitizer.sanitize(slide.title);
                        carouselContainer.insertBefore(img, bannerDiv);
                    }
                }
                
                if (slide.videoUrl) {
                    const safeVideoUrl = sanitizeMediaUrl(slide.videoUrl, sanitizer);
                    if (safeVideoUrl) {
                        arrayImgs.push(safeVideoUrl);
                        
                        const videoClass = `i${index + 2}`;
                        
                        const video1 = document.createElement('video');
                        video1.className = `image ${videoClass} iHideA`;
                        video1.width = 512;
                        video1.height = 512;
                        video1.preload = 'auto';
                        video1.autoplay = true;
                        video1.muted = true;
                        video1.loop = true;
                        const source1 = document.createElement('source');
                        source1.src = safeVideoUrl;
                        source1.type = 'video/mp4';
                        video1.appendChild(source1);
                        
                        const video2 = document.createElement('video');
                        video2.className = `image2 ${videoClass} iHideB`;
                        video2.width = 512;
                        video2.height = 512;
                        video2.preload = 'auto';
                        video2.autoplay = true;
                        video2.muted = true;
                        video2.loop = true;
                        const source2 = document.createElement('source');
                        source2.src = safeVideoUrl;
                        source2.type = 'video/mp4';
                        video2.appendChild(source2);
                        
                        const lastVideoA = containerImages.querySelector('.image2.i1');
                        containerImages.insertBefore(video1, lastVideoA.nextSibling);
                        containerImages.insertBefore(video2, video1.nextSibling);
                    }
                }
            });
            
            image = document.querySelectorAll('.image');
            image2 = document.querySelectorAll('.image2');
            
            initCarouselImages();
        }
    } catch {
        return;
    }
}

function mostrar_class(obj) {
    if (!obj) return;
    obj.classList.remove('tHide');
    void obj.offsetWidth;
    obj.classList.add('tShow');
}
function ocultar_class(obj) {
    if (!obj) return;
    obj.classList.remove('tShow');
    void obj.offsetWidth;
    obj.classList.add('tHide');
}
var girar = () => {
    if (timeoutId != null) {
        clearTimeout(timeoutId);
    }
    if (arrayImgs.length === 0 || !image[0] || !image2[0]) return;
    if (allTextContainers.length <= 1) return;

    containerBanner.classList.remove('rotA');
    void containerBanner.offsetWidth;
    containerBanner.classList.add('rotA');

    image[0].classList.remove('rotB');
    void image[0].offsetWidth;
    image[0].classList.add('rotB');

    image2[0].classList.remove('rotB');
    image2[0].classList.add('rotB');

    if (image[1]) image[1].classList.add('iHideA');
    if (image2[1]) image2[1].classList.add('iHideB');

    image[0].classList.remove('iHideA');
    image2[0].classList.remove('iHideB');
    image[0].classList.add('iShowA');
    image2[0].classList.add('iShowB');


    if (swRot) {

        image2[0].classList.add('makeLittle');
        if (image2[1]) image2[1].classList.remove('makeLittle');

        image[0].setAttribute("src", arrayImgs[swText]);
        image2[0].setAttribute("src", arrayImgs[swText]);

        setTimeout(() => {
            image2[0].classList.remove('makeLittle');
            if (image2[1]) image2[1].classList.add('makeLittle');
        }, 3000);

    } else {
        if (!image[1] || !image2[1]) {
            swRot = true;
            swText++;
            swText = swText % allTextContainers.length;
            timeoutId = setTimeout(() => { girar(); }, 15000);
            return;
        }

        image[0].classList.add('iHideA');
        image2[0].classList.add('iHideB');

        image[1].classList.remove('iHideA');
        image2[1].classList.remove('iHideB');
        image[1].classList.add('iShowA');
        image2[1].classList.add('iShowB');

        image2[1].classList.add('makeLittle');
        image2[0].classList.remove('makeLittle');

        image[1].setAttribute("src", arrayImgs[swText]);
        image2[1].setAttribute("src", arrayImgs[swText]);

        setTimeout(() => {
            image2[1].classList.remove('makeLittle');
            image2[0].classList.add('makeLittle');
        }, 3000);
    }

    if (swText == 0) {
        allTextContainers.forEach((container, idx) => {
            if (idx === 0) {
                mostrar_class(container);
            } else {
                ocultar_class(container);
            }
        });
    } else if (swText > 0 && swText < allTextContainers.length) {
        allTextContainers.forEach((container, idx) => {
            if (idx === swText) {
                mostrar_class(container);
            } else {
                ocultar_class(container);
            }
        });
    }
    
    swRot = swRot ? false : true;

    swText++;
    swText = swText % allTextContainers.length;

    timeoutId = setTimeout(() => {
        girar();
    }, 15000);
}

async function initCarousel() {
    await loadIdentityData();
    await loadCarouselSlides();
    
    timeoutId = setTimeout(() => {
        girar();
    }, 15000);
}

let currentIndex = 0;
let images;
let totalImages;
let autoSlideInterval;

function initCarouselImages() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
    }
    
    images = document.querySelectorAll('.carousel-images');
    totalImages = images.length;
    currentIndex = 0;
    
    if (totalImages > 0) {
        images[0].classList.add('active');
    }
    
    startAutoSlide();
}

function showImage(index) {
    if (!images || images.length === 0) return;
    
    if (index < 0) index = totalImages - 1;
    if (index >= totalImages) index = 0;

    images.forEach(image => {
        image.classList.remove('active');
    });

    images[index].classList.add('active');
    currentIndex = index;
}

function startAutoSlide() {
    if (totalImages <= 1) return;
    
    autoSlideInterval = setInterval(() => {
        showImage(currentIndex + 1);
    }, 15000); 
}

initCarousel();

containerCircle.addEventListener("click", (e) => {
    if (timeoutId!= null)
        clearTimeout(timeoutId);

    girar();
});

let btnNext2 = document.querySelector (".btnNext2");
btnNext2.addEventListener('click', (e) => {
    if (timeoutId!= null)
        clearTimeout(timeoutId);
    girar();
    clearInterval(autoSlideInterval); 
    showImage(currentIndex + 1);
    startAutoSlide(); 
});


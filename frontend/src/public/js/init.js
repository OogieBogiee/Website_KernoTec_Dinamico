window.AppData = {
    identity: null,
    navItems: null,
    isLoaded: false
};

window.hasShownApiWarning = false;
window.showApiRateLimitWarning = function() {
    if (window.hasShownApiWarning) return;
    window.hasShownApiWarning = true;
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'warning',
            title: 'Tráfico alto detectado',
            text: 'Has realizado demasiadas solicitudes. Cierta información puede tardar en verse o actualizarse.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true
        });
    } else {
        console.warn('Límite de solicitudes de API (429) alcanzado.');
    }
};

async function preloadCoreData() {
    try {
        const urlParams = window.location.search;
        const refresh = urlParams.includes('refresh=true') ? '?refresh=true' : '';
        
        const [identityRes, navRes] = await Promise.all([
            fetch('/api/identity' + refresh).catch(e => { console.error('Error fetch identity:', e); return null; }),
            fetch('/api/navbar-items' + refresh).catch(e => { console.error('Error fetch navbar:', e); return null; })
        ]);
        
        if ((identityRes && identityRes.status === 429) || (navRes && navRes.status === 429)) {
            window.showApiRateLimitWarning();
        }

        const identity = (identityRes && identityRes.ok) ? await identityRes.json().catch(() => null) : null;
        const navItems = (navRes && navRes.ok) ? await navRes.json().catch(() => null) : null;
        
        window.AppData.identity = identity;
        window.AppData.navItems = navItems;
    } catch (e) {
        console.error('Error general al precargar datos base:', e);
    } finally {
        window.AppData.isLoaded = true;
        
        document.dispatchEvent(new CustomEvent('coreDataReady', {
            detail: {
                identity: window.AppData.identity,
                navItems: window.AppData.navItems
            }
        }));
    }
}

preloadCoreData();
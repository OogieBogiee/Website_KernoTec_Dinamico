$(document).ready(function() {
    var form = document.getElementById('contact_form');
    var submitBtn = document.getElementById('success');
    var originalBtnText = submitBtn.textContent;
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var interesInput = document.getElementById('interes');
    var interesSelect = document.getElementById('interes-select');
    var interesTrigger = interesSelect ? interesSelect.querySelector('.custom-select-trigger') : null;
    var interesValueNode = interesSelect ? interesSelect.querySelector('.custom-select-value') : null;
    var interesMenu = document.getElementById('interes-menu');
    var interesGroup = interesInput ? interesInput.closest('.group') : null;

    function closeInteresMenu() {
        if (!interesSelect || !interesTrigger || !interesGroup) {
            return;
        }
        interesSelect.classList.remove('is-open');
        interesTrigger.setAttribute('aria-expanded', 'false');
        interesGroup.classList.remove('select-focused');
    }

    function openInteresMenu() {
        if (!interesSelect || !interesTrigger || !interesGroup) {
            return;
        }
        interesSelect.classList.add('is-open');
        interesTrigger.setAttribute('aria-expanded', 'true');
        interesGroup.classList.add('select-focused');
    }

    function syncSelectedOption() {
        if (!interesMenu) {
            return;
        }
        var options = interesMenu.querySelectorAll('.custom-select-option[data-value]');
        options.forEach(function(option) {
            var optionValue = option.getAttribute('data-value') || '';
            if (optionValue === (interesInput.value || '')) {
                option.classList.add('is-selected');
                option.setAttribute('aria-selected', 'true');
            } else {
                option.classList.remove('is-selected');
                option.setAttribute('aria-selected', 'false');
            }
        });
    }

    function setInteresValue(value) {
        if (!interesInput || !interesValueNode || !interesGroup) {
            return;
        }
        var finalValue = value ? String(value).trim() : '';
        interesInput.value = finalValue;
        interesValueNode.textContent = finalValue;
        if (finalValue) {
            interesGroup.classList.add('has-value');
        } else {
            interesGroup.classList.remove('has-value');
        }
        syncSelectedOption();
    }

    function createOptionButton(value, isDisabled) {
        var option = document.createElement('button');
        option.type = 'button';
        option.className = 'custom-select-option';
        option.textContent = value;
        if (isDisabled) {
            option.disabled = true;
            option.classList.add('is-disabled');
            return option;
        }
        option.setAttribute('data-value', value);
        option.setAttribute('aria-selected', 'false');
        option.addEventListener('click', function() {
            setInteresValue(value);
            closeInteresMenu();
        });
        return option;
    }

    function appendGroupToMenu(label, items) {
        if (!interesMenu || !Array.isArray(items) || items.length === 0) {
            return;
        }
        var title = document.createElement('div');
        title.className = 'custom-select-group-title';
        title.textContent = label;
        interesMenu.appendChild(title);

        items.forEach(function(item) {
            if (!item || !item.title) {
                return;
            }
            var value = String(item.title).trim();
            if (!value) {
                return;
            }
            interesMenu.appendChild(createOptionButton(value, false));
        });
    }

    function bindInteresSelectEvents() {
        if (!interesSelect || !interesTrigger || !interesMenu || interesSelect.dataset.bound === '1') {
            return;
        }

        interesSelect.dataset.bound = '1';

        interesTrigger.addEventListener('click', function() {
            if (interesSelect.classList.contains('is-open')) {
                closeInteresMenu();
            } else {
                openInteresMenu();
            }
        });

        interesTrigger.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openInteresMenu();
                var firstOption = interesMenu.querySelector('.custom-select-option[data-value]');
                if (firstOption) {
                    firstOption.focus();
                }
            }
        });

        interesMenu.addEventListener('keydown', function(e) {
            var options = Array.from(interesMenu.querySelectorAll('.custom-select-option[data-value]'));
            if (options.length === 0) {
                return;
            }

            var activeIndex = options.indexOf(document.activeElement);

            if (e.key === 'Escape') {
                e.preventDefault();
                closeInteresMenu();
                interesTrigger.focus();
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                var nextIndex = activeIndex < options.length - 1 ? activeIndex + 1 : 0;
                options[nextIndex].focus();
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                var prevIndex = activeIndex > 0 ? activeIndex - 1 : options.length - 1;
                options[prevIndex].focus();
                return;
            }

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (activeIndex >= 0) {
                    options[activeIndex].click();
                    interesTrigger.focus();
                }
            }
        });

        document.addEventListener('click', function(e) {
            if (!interesSelect.contains(e.target)) {
                closeInteresMenu();
            }
        });
    }

    function populateInteresOptions(result) {
        if (!interesMenu) {
            return;
        }

        interesMenu.innerHTML = '';
        setInteresValue('');
        bindInteresSelectEvents();

        try {
            if (!result || !result.success || !result.data) {
                throw new Error('Sin datos de items precargados');
            }

            var mappedData = (typeof mapNavbarData === 'function')
                ? mapNavbarData({ success: true, data: result.data })
                : result.data;

            var areas = Array.isArray(mappedData.areas) ? mappedData.areas : [];
            var servicios = Array.isArray(mappedData.servicios) ? mappedData.servicios : [];

            appendGroupToMenu('Áreas', areas);
            appendGroupToMenu('Servicios', servicios);

            if (areas.length === 0 && servicios.length === 0) {
                interesMenu.appendChild(createOptionButton('Sin opciones disponibles', true));
            }
        } catch (error) {
            interesMenu.appendChild(createOptionButton('Sin opciones disponibles', true));
        }
    }

    if (window.AppData && window.AppData.isLoaded) {
        populateInteresOptions(window.AppData.navItems);
    } else {
        document.addEventListener('coreDataReady', function(e) {
            populateInteresOptions(e.detail.navItems);
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        var recaptchaToken = grecaptcha.getResponse();
        if (!recaptchaToken) {
            Swal.fire({
                icon: 'question',
                iconColor: '#ffa500',
                title: '¿Eres un robot?',
                text: 'Por favor verifica que no eres un robot.',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        var correo = document.getElementById('correo').value.trim();
        if (!emailRegex.test(correo)) {
            Swal.fire({
                icon: 'warning',
                title: 'Correo inválido',
                text: 'Por favor ingresa un correo electrónico válido.',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        var interesValue = (interesInput.value || '').trim();
        if (!interesValue) {
            Swal.fire({
                icon: 'warning',
                title: 'Área de interés requerida',
                text: 'Por favor selecciona un área o servicio.',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        var payload = {
            nombre: document.getElementById('nombre').value,
            correo: correo,
            tel: document.getElementById('phone').value,
            interes: interesValue,
            mensaje: document.getElementById('mensaje').value,
            recaptchaToken: recaptchaToken
        };

        var isRateLimited = false;

        try {
            var response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                isRateLimited = true;
                var resetTime = response.headers.get('RateLimit-Reset') || response.headers.get('Retry-After');
                var waitSeconds = 15 * 60; // 15 mins default
                if (resetTime) {
                    var now = Math.floor(Date.now() / 1000);
                    if (resetTime > now) {
                        waitSeconds = parseInt(resetTime) - now;
                    } else {
                        waitSeconds = parseInt(resetTime);
                    }
                }
                
                Swal.fire({
                    icon: 'warning',
                    title: 'Límite alcanzado',
                    text: 'Has superado el límite de intentos de envío. Por favor espera a que finalice el contador para volver a intentar.',
                    confirmButtonColor: '#3085d6'
                });
                
                var timerInterval = setInterval(function() {
                    if (waitSeconds <= 0) {
                        clearInterval(timerInterval);
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    } else {
                        var m = Math.floor(waitSeconds / 60);
                        var s = waitSeconds % 60;
                        submitBtn.textContent = `Reintenta en ${m}:${s.toString().padStart(2, '0')}`;
                        waitSeconds--;
                    }
                }, 1000);
                return;
            }

            var result = await response.json();

            if (result.success) {
                Swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: '¡Su correo fue correctamente enviado!',
                    showConfirmButton: false,
                    timer: 3000
                });
                form.reset();
                setInteresValue('');
                closeInteresMenu();
                grecaptcha.reset();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar',
                    text: result.error || 'Ocurrió un error. Por favor intenta nuevamente.',
                    confirmButtonColor: '#3085d6'
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo enviar el mensaje. Por favor intenta nuevamente.',
                confirmButtonColor: '#3085d6'
            });
        } finally {
            if (!isRateLimited) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });

    $('.ham-menu a').click(function() {
        $('#ham-menu').trigger('click');
    });
});

import type { StrapiApp } from '@strapi/strapi/admin';
import { darkTheme, lightTheme } from '@strapi/design-system';

const sharedBrandColors = {
  primary100: '#fff4eb',
  primary200: '#ffd7b8',
  primary500: '#ff8f33',
  primary600: '#ff7400',
  primary700: '#d55f00',
  secondary100: '#eef6f6',
  secondary200: '#cfe2e3',
  secondary500: '#71a6aa',
  secondary600: '#5c8b8f',
  secondary700: '#4a7275',
  alternative100: '#f8f8f8',
  alternative200: '#e9e9e9',
  alternative500: '#727272',
  alternative600: '#ff7400',
  alternative700: '#d55f00',
  buttonPrimary500: '#ff7400',
  buttonPrimary600: '#d55f00',
  buttonNeutral0: '#ffffff',
};

const lightBrandColors = {
  ...sharedBrandColors,
  neutral0: '#ffffff',
  neutral100: '#f8f8f8',
  neutral150: '#f2f2f2',
  neutral200: '#e9e9e9',
  neutral300: '#d8d8d8',
  neutral400: '#a7a7a7',
  neutral500: '#727272',
  neutral600: '#525252',
  neutral700: '#3b3b3b',
  neutral800: '#282828',
  neutral900: '#202020',
  neutral1000: '#151515',
  success100: '#ffffff',
  success200: '#71a6aa',
  success500: '#71a6aa',
  success600: '#71a6aa',
  success700: '#282828',
  warning100: '#ffffff',
  warning200: '#ff7400',
  warning500: '#ff7400',
  warning600: '#ff7400',
  warning700: '#282828',
  danger100: '#ffffff',
  danger200: '#282828',
  danger500: '#282828',
  danger600: '#282828',
  danger700: '#ff7400',
};

const darkBrandColors = {
  ...sharedBrandColors,
  primary100: '#282828',
  primary200: '#71a6aa',
  neutral0: '#1f1f1f',
  neutral100: '#252525',
  neutral150: '#2d2d2d',
  neutral200: '#353535',
  neutral300: '#454545',
  neutral400: '#707070',
  neutral500: '#9b9b9b',
  neutral600: '#b7b7b7',
  neutral700: '#d0d0d0',
  neutral800: '#e4e4e4',
  neutral900: '#f0f0f0',
  neutral1000: '#ffffff',
  success100: '#282828',
  success200: '#71a6aa',
  success500: '#71a6aa',
  success600: '#71a6aa',
  success700: '#ffffff',
  warning100: '#282828',
  warning200: '#ff7400',
  warning500: '#ff7400',
  warning600: '#ff7400',
  warning700: '#ffffff',
  danger100: '#282828',
  danger200: '#ff7400',
  danger500: '#ff7400',
  danger600: '#ff7400',
  danger700: '#ffffff',
};

export default {
  config: {
    translations: {
      es: {
        'Auth.form.welcome.title': 'Bienvenido',
        'Auth.form.welcome.subtitle': 'Inicia sesión para continuar',
      },
    },
    theme: {
      light: {
        ...lightTheme,
        colors: {
          ...lightTheme.colors,
          ...lightBrandColors,
        },
      },
      dark: {
        ...darkTheme,
        colors: {
          ...darkTheme.colors,
          ...darkBrandColors,
        },
      },
    },
    locales: [
      // 'ar',
      // 'fr',
      // 'cs',
      // 'de',
      // 'dk',
       'es',
      // 'he',
      // 'id',
      // 'it',
      // 'ja',
      // 'ko',
      // 'ms',
      // 'nl',
      // 'no',
      // 'pl',
      // 'pt-BR',
      // 'pt',
      // 'ru',
      // 'sk',
      // 'sv',
      // 'th',
      // 'tr',
      // 'uk',
      // 'vi',
      // 'zh-Hans',
      // 'zh',
    ],
  },
  bootstrap(_app: StrapiApp) {
    const replacePurpleLoader = () => {
      const images = document.querySelectorAll<HTMLImageElement>("img[src*='%234945FF'], img[src*='%234945ff']");

      images.forEach((image) => {
        const source = image.getAttribute('src');
        if (!source) {
          return;
        }

        const updatedSource = source
          .replace(/%234945FF/g, '%23ff7400')
          .replace(/%234945ff/g, '%23ff7400');

        if (updatedSource !== source) {
          image.setAttribute('src', updatedSource);
        }
      });
    };

    const formatBooleanCells = () => {
      const cells = document.querySelectorAll('td');
      cells.forEach((cell) => {
        const targetElement = cell.querySelector('span') || cell;
        
        let text = targetElement.textContent?.trim();
        if (text === 'true' || text === 'false') {
          const table = cell.closest('table');
          if (table) {
             const thead = table.querySelector('thead');
             const tr = cell.parentNode as HTMLTableRowElement;
             if (thead && tr) {
                const colIndex = Array.from(tr.children).indexOf(cell);
                const thCells = thead.querySelectorAll('th');
                const thText = thCells[colIndex]?.textContent?.toUpperCase() || '';
                
                if (thText.includes('VISIBILIDAD') || thText.includes('VISIBILITY') || thText.includes('VISIB') || thText.includes('MOSTRAR')) {
                   targetElement.textContent = text === 'true' ? 'Visible' : 'Oculto';
                }
             }
          }
        }
      });
    };

    replacePurpleLoader();
    formatBooleanCells();

    const observer = new MutationObserver(() => {
      replacePurpleLoader();
      formatBooleanCells();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  },
  register(app: StrapiApp) {
    app.customFields.register({
      name: 'unique-position',
      pluginId: undefined, // no plugin
      type: 'integer',
      intlLabel: {
        id: 'unique-position.label',
        defaultMessage: 'Posición (con validación)',
      },
      intlDescription: {
        id: 'unique-position.description',
        defaultMessage: 'Al salir del campo, se comprobará¡ si la posición está¡ ocupada',
      },
      icon: null,
      components: {
        Input: async () => import('./components/CustomPositionInput'),
      },
    });
  },
};

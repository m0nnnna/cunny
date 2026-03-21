import { createTheme } from '@vanilla-extract/css';
import { color } from 'folds';

export const silverTheme = createTheme(color, {
  Background: {
    Container: '#DEDEDE',
    ContainerHover: '#D3D3D3',
    ContainerActive: '#C7C7C7',
    ContainerLine: '#BBBBBB',
    OnContainer: '#000000',
  },

  Surface: {
    Container: '#EAEAEA',
    ContainerHover: '#DEDEDE',
    ContainerActive: '#D3D3D3',
    ContainerLine: '#C7C7C7',
    OnContainer: '#000000',
  },

  SurfaceVariant: {
    Container: '#DEDEDE',
    ContainerHover: '#D3D3D3',
    ContainerActive: '#C7C7C7',
    ContainerLine: '#BBBBBB',
    OnContainer: '#000000',
  },

  Primary: {
    Main: '#1245A8',
    MainHover: '#103E97',
    MainActive: '#0F3B8F',
    MainLine: '#0E3786',
    OnMain: '#FFFFFF',
    Container: '#C4D0E9',
    ContainerHover: '#B8C7E5',
    ContainerActive: '#ACBEE1',
    ContainerLine: '#A0B5DC',
    OnContainer: '#0D3076',
  },

  Secondary: {
    Main: '#000000',
    MainHover: '#171717',
    MainActive: '#232323',
    MainLine: '#2F2F2F',
    OnMain: '#EAEAEA',
    Container: '#C7C7C7',
    ContainerHover: '#BBBBBB',
    ContainerActive: '#AFAFAF',
    ContainerLine: '#A4A4A4',
    OnContainer: '#0C0C0C',
  },

  Success: {
    Main: '#017343',
    MainHover: '#01683C',
    MainActive: '#016239',
    MainLine: '#015C36',
    OnMain: '#FFFFFF',
    Container: '#BFDCD0',
    ContainerHover: '#B3D5C7',
    ContainerActive: '#A6CEBD',
    ContainerLine: '#99C7B4',
    OnContainer: '#01512F',
  },

  Warning: {
    Main: '#864300',
    MainHover: '#793C00',
    MainActive: '#723900',
    MainLine: '#6B3600',
    OnMain: '#FFFFFF',
    Container: '#E1D0BF',
    ContainerHover: '#DBC7B2',
    ContainerActive: '#D5BDA6',
    ContainerLine: '#CFB499',
    OnContainer: '#5E2F00',
  },

  Critical: {
    Main: '#9D0F0F',
    MainHover: '#8D0E0E',
    MainActive: '#850D0D',
    MainLine: '#7E0C0C',
    OnMain: '#FFFFFF',
    Container: '#E7C3C3',
    ContainerHover: '#E2B7B7',
    ContainerActive: '#DDABAB',
    ContainerLine: '#D89F9F',
    OnContainer: '#6E0B0B',
  },

  Other: {
    FocusRing: 'rgba(0 0 0 / 50%)',
    Shadow: 'rgba(0 0 0 / 20%)',
    Overlay: 'rgba(0 0 0 / 50%)',
  },
});

const darkThemeData = {
  Background: {
    Container: '#1A1A1A',
    ContainerHover: '#262626',
    ContainerActive: '#333333',
    ContainerLine: '#404040',
    OnContainer: '#F2F2F2',
  },

  Surface: {
    Container: '#262626',
    ContainerHover: '#333333',
    ContainerActive: '#404040',
    ContainerLine: '#4D4D4D',
    OnContainer: '#F2F2F2',
  },

  SurfaceVariant: {
    Container: '#333333',
    ContainerHover: '#404040',
    ContainerActive: '#4D4D4D',
    ContainerLine: '#595959',
    OnContainer: '#F2F2F2',
  },

  Primary: {
    Main: '#BDB6EC',
    MainHover: '#B2AAE9',
    MainActive: '#ADA3E8',
    MainLine: '#A79DE6',
    OnMain: '#2C2843',
    Container: '#413C65',
    ContainerHover: '#494370',
    ContainerActive: '#50497B',
    ContainerLine: '#575086',
    OnContainer: '#E3E1F7',
  },

  Secondary: {
    Main: '#FFFFFF',
    MainHover: '#E5E5E5',
    MainActive: '#D9D9D9',
    MainLine: '#CCCCCC',
    OnMain: '#1A1A1A',
    Container: '#404040',
    ContainerHover: '#4D4D4D',
    ContainerActive: '#595959',
    ContainerLine: '#666666',
    OnContainer: '#F2F2F2',
  },

  Success: {
    Main: '#85E0BA',
    MainHover: '#70DBAF',
    MainActive: '#66D9A9',
    MainLine: '#5CD6A3',
    OnMain: '#0F3D2A',
    Container: '#175C3F',
    ContainerHover: '#1A6646',
    ContainerActive: '#1C704D',
    ContainerLine: '#1F7A54',
    OnContainer: '#CCF2E2',
  },

  Warning: {
    Main: '#E3BA91',
    MainHover: '#DFAF7E',
    MainActive: '#DDA975',
    MainLine: '#DAA36C',
    OnMain: '#3F2A15',
    Container: '#5E3F20',
    ContainerHover: '#694624',
    ContainerActive: '#734D27',
    ContainerLine: '#7D542B',
    OnContainer: '#F3E2D1',
  },

  Critical: {
    Main: '#E69D9D',
    MainHover: '#E28D8D',
    MainActive: '#E08585',
    MainLine: '#DE7D7D',
    OnMain: '#401C1C',
    Container: '#602929',
    ContainerHover: '#6B2E2E',
    ContainerActive: '#763333',
    ContainerLine: '#803737',
    OnContainer: '#F5D6D6',
  },

  Other: {
    FocusRing: 'rgba(255, 255, 255, 0.5)',
    Shadow: 'rgba(0, 0, 0, 1)',
    Overlay: 'rgba(0, 0, 0, 0.8)',
  },
};

export const darkTheme = createTheme(color, darkThemeData);

export const butterTheme = createTheme(color, {
  ...darkThemeData,
  Background: {
    Container: '#1A1916',
    ContainerHover: '#262621',
    ContainerActive: '#33322C',
    ContainerLine: '#403F38',
    OnContainer: '#FFFBDE',
  },

  Surface: {
    Container: '#262621',
    ContainerHover: '#33322C',
    ContainerActive: '#403F38',
    ContainerLine: '#4D4B43',
    OnContainer: '#FFFBDE',
  },

  SurfaceVariant: {
    Container: '#33322C',
    ContainerHover: '#403F38',
    ContainerActive: '#4D4B43',
    ContainerLine: '#59584E',
    OnContainer: '#FFFBDE',
  },

  Secondary: {
    Main: '#FFFBDE',
    MainHover: '#E5E2C8',
    MainActive: '#D9D5BD',
    MainLine: '#CCC9B2',
    OnMain: '#1A1916',
    Container: '#403F38',
    ContainerHover: '#4D4B43',
    ContainerActive: '#59584E',
    ContainerLine: '#666459',
    OnContainer: '#F2EED3',
  },
});

// ---------- Neko Dark: liquid glass aero — soft purples, blush pinks, periwinkle blues ----------
export const nekoDarkTheme = createTheme(color, {
  Background: {
    Container: 'rgba(19, 18, 26, 0.52)',
    ContainerHover: 'rgba(109, 86, 180, 0.22)',
    ContainerActive: 'rgba(119, 94, 200, 0.36)',
    ContainerLine: 'rgba(167, 139, 250, 0.20)',
    OnContainer: '#efeef6',
  },

  Surface: {
    Container: 'rgba(26, 24, 38, 0.46)',
    ContainerHover: 'rgba(109, 86, 180, 0.18)',
    ContainerActive: 'rgba(119, 94, 200, 0.30)',
    ContainerLine: 'rgba(167, 139, 250, 0.16)',
    OnContainer: '#efeef6',
  },

  SurfaceVariant: {
    Container: 'rgba(34, 32, 46, 0.40)',
    ContainerHover: 'rgba(109, 86, 180, 0.15)',
    ContainerActive: 'rgba(119, 94, 200, 0.25)',
    ContainerLine: 'rgba(167, 139, 250, 0.13)',
    OnContainer: '#efeef6',
  },

  Primary: {
    Main: '#a78bfa',
    MainHover: '#b197fb',
    MainActive: '#b9a3fc',
    MainLine: '#c1affc',
    OnMain: '#1e1b2e',
    Container: 'rgba(61, 53, 98, 0.75)',
    ContainerHover: 'rgba(70, 61, 112, 0.82)',
    ContainerActive: 'rgba(79, 69, 126, 0.88)',
    ContainerLine: 'rgba(88, 77, 140, 0.7)',
    OnContainer: '#ddd6fe',
  },

  Secondary: {
    Main: 'rgba(245, 238, 249, 0.92)',
    MainHover: 'rgba(232, 220, 239, 0.95)',
    MainActive: 'rgba(219, 202, 229, 0.98)',
    MainLine: 'rgba(206, 184, 219, 0.9)',
    OnMain: '#13121a',
    Container: 'rgba(50, 47, 66, 0.6)',
    ContainerHover: 'rgba(58, 55, 76, 0.7)',
    ContainerActive: 'rgba(66, 63, 86, 0.78)',
    ContainerLine: 'rgba(74, 71, 96, 0.65)',
    OnContainer: '#e8dcef',
  },

  Success: {
    Main: '#86efac',
    MainHover: '#9af4ba',
    MainActive: '#a5f6c2',
    MainLine: '#b0f8ca',
    OnMain: '#0c2e1a',
    Container: '#1e4d36',
    ContainerHover: '#24573d',
    ContainerActive: '#2a6144',
    ContainerLine: '#306b4b',
    OnContainer: '#bbf7d0',
  },

  Warning: {
    Main: '#fcd34d',
    MainHover: '#fcd85f',
    MainActive: '#fddc6d',
    MainLine: '#fde07b',
    OnMain: '#3d3208',
    Container: '#5c4a14',
    ContainerHover: '#665219',
    ContainerActive: '#705a1e',
    ContainerLine: '#7a6223',
    OnContainer: '#fef3c7',
  },

  Critical: {
    Main: '#f9a8d4',
    MainHover: '#fab5db',
    MainActive: '#fbbee0',
    MainLine: '#fcc7e5',
    OnMain: '#3d1628',
    Container: '#5c2840',
    ContainerHover: '#662e48',
    ContainerActive: '#703450',
    ContainerLine: '#7a3a58',
    OnContainer: '#fce7f3',
  },

  Other: {
    FocusRing: 'rgba(167, 139, 250, 0.45)',
    Shadow: 'rgba(30, 24, 46, 0.5)',
    Overlay: 'rgba(19, 18, 26, 0.88)',
  },
});

// ---------- Neko Light: liquid glass aero — blush cream, pastel lavender, soft pink & blue ----------
export const nekoLightTheme = createTheme(color, {
  Background: {
    Container: 'rgba(250, 245, 252, 0.55)',
    ContainerHover: 'rgba(124, 58, 237, 0.10)',
    ContainerActive: 'rgba(124, 58, 237, 0.18)',
    ContainerLine: 'rgba(124, 58, 237, 0.18)',
    OnContainer: '#2d2a36',
  },

  Surface: {
    Container: 'rgba(255, 251, 254, 0.48)',
    ContainerHover: 'rgba(124, 58, 237, 0.08)',
    ContainerActive: 'rgba(124, 58, 237, 0.15)',
    ContainerLine: 'rgba(124, 58, 237, 0.14)',
    OnContainer: '#2d2a36',
  },

  SurfaceVariant: {
    Container: 'rgba(245, 238, 249, 0.52)',
    ContainerHover: 'rgba(124, 58, 237, 0.07)',
    ContainerActive: 'rgba(124, 58, 237, 0.13)',
    ContainerLine: 'rgba(124, 58, 237, 0.12)',
    OnContainer: '#2d2a36',
  },

  Primary: {
    Main: '#7c3aed',
    MainHover: '#6d28d9',
    MainActive: '#6335c4',
    MainLine: '#5a2fb3',
    OnMain: '#ffffff',
    Container: 'rgba(221, 214, 254, 0.82)',
    ContainerHover: 'rgba(196, 181, 253, 0.88)',
    ContainerActive: 'rgba(167, 139, 250, 0.92)',
    ContainerLine: 'rgba(139, 92, 246, 0.85)',
    OnContainer: '#3b2762',
  },

  Secondary: {
    Main: '#2d2a36',
    MainHover: '#3d3a48',
    MainActive: '#4a4756',
    MainLine: '#575464',
    OnMain: '#faf5fc',
    Container: 'rgba(227, 210, 237, 0.75)',
    ContainerHover: 'rgba(218, 196, 231, 0.82)',
    ContainerActive: 'rgba(209, 182, 225, 0.88)',
    ContainerLine: 'rgba(200, 168, 219, 0.78)',
    OnContainer: '#2d2a36',
  },

  Success: {
    Main: '#34d399',
    MainHover: '#2dd4a0',
    MainActive: '#28c494',
    MainLine: '#23b588',
    OnMain: '#ffffff',
    Container: '#a7f3d0',
    ContainerHover: '#6ee7b7',
    ContainerActive: '#5dd9a8',
    ContainerLine: '#4ccb99',
    OnContainer: '#14532d',
  },

  Warning: {
    Main: '#f59e0b',
    MainHover: '#e89309',
    MainActive: '#dc8808',
    MainLine: '#d07d07',
    OnMain: '#ffffff',
    Container: '#fde68a',
    ContainerHover: '#fcd34d',
    ContainerActive: '#facc15',
    ContainerLine: '#eab308',
    OnContainer: '#78350f',
  },

  Critical: {
    Main: '#ec4899',
    MainHover: '#db2777',
    MainActive: '#be185d',
    MainLine: '#9d174d',
    OnMain: '#ffffff',
    Container: '#fbcfe8',
    ContainerHover: '#f9a8d4',
    ContainerActive: '#f472b6',
    ContainerLine: '#ec4899',
    OnContainer: '#831843',
  },

  Other: {
    FocusRing: 'rgba(124, 58, 237, 0.35)',
    Shadow: 'rgba(45, 42, 54, 0.08)',
    Overlay: 'rgba(45, 42, 54, 0.35)',
  },
});

// ---------- Neko Sunset: liquid glass — warm amber, coral, dusk (refined) ----------
export const nekoSunsetTheme = createTheme(color, {
  Background: {
    Container: 'rgba(28, 22, 20, 0.54)',
    ContainerHover: 'rgba(160, 80, 20, 0.22)',
    ContainerActive: 'rgba(180, 100, 30, 0.36)',
    ContainerLine: 'rgba(251, 146, 60, 0.20)',
    OnContainer: '#fef7ee',
  },

  Surface: {
    Container: 'rgba(38, 30, 26, 0.50)',
    ContainerHover: 'rgba(155, 75, 18, 0.18)',
    ContainerActive: 'rgba(175, 95, 28, 0.30)',
    ContainerLine: 'rgba(251, 146, 60, 0.16)',
    OnContainer: '#fef7ee',
  },

  SurfaceVariant: {
    Container: 'rgba(48, 38, 32, 0.44)',
    ContainerHover: 'rgba(150, 70, 16, 0.15)',
    ContainerActive: 'rgba(170, 90, 25, 0.25)',
    ContainerLine: 'rgba(251, 146, 60, 0.13)',
    OnContainer: '#fef7ee',
  },

  Primary: {
    Main: '#f97316',
    MainHover: '#fb923c',
    MainActive: '#fdba74',
    MainLine: '#fed7aa',
    OnMain: '#1c0f08',
    Container: 'rgba(154, 52, 18, 0.78)',
    ContainerHover: 'rgba(194, 65, 12, 0.84)',
    ContainerActive: 'rgba(234, 88, 12, 0.9)',
    ContainerLine: 'rgba(251, 146, 60, 0.72)',
    OnContainer: '#ffedd5',
  },

  Secondary: {
    Main: 'rgba(254, 243, 232, 0.92)',
    MainHover: 'rgba(253, 230, 210, 0.95)',
    MainActive: 'rgba(252, 217, 188, 0.98)',
    MainLine: 'rgba(251, 204, 166, 0.9)',
    OnMain: '#1a1410',
    Container: 'rgba(64, 50, 40, 0.6)',
    ContainerHover: 'rgba(74, 58, 46, 0.7)',
    ContainerActive: 'rgba(84, 66, 52, 0.78)',
    ContainerLine: 'rgba(94, 74, 58, 0.65)',
    OnContainer: '#fde8d8',
  },

  Success: {
    Main: '#86efac',
    MainHover: '#9af4ba',
    MainActive: '#a5f6c2',
    MainLine: '#b0f8ca',
    OnMain: '#0c2e1a',
    Container: '#1e4d36',
    ContainerHover: '#24573d',
    ContainerActive: '#2a6144',
    ContainerLine: '#306b4b',
    OnContainer: '#bbf7d0',
  },

  Warning: {
    Main: '#fcd34d',
    MainHover: '#fcd85f',
    MainActive: '#fddc6d',
    MainLine: '#fde07b',
    OnMain: '#3d3208',
    Container: '#5c4a14',
    ContainerHover: '#665219',
    ContainerActive: '#705a1e',
    ContainerLine: '#7a6223',
    OnContainer: '#fef3c7',
  },

  Critical: {
    Main: '#f9a8d4',
    MainHover: '#fab5db',
    MainActive: '#fbbee0',
    MainLine: '#fcc7e5',
    OnMain: '#3d1628',
    Container: '#5c2840',
    ContainerHover: '#662e48',
    ContainerActive: '#703450',
    ContainerLine: '#7a3a58',
    OnContainer: '#fce7f3',
  },

  Other: {
    FocusRing: 'rgba(251, 146, 60, 0.45)',
    Shadow: 'rgba(28, 20, 16, 0.5)',
    Overlay: 'rgba(26, 20, 18, 0.88)',
  },
});

// ---------- Neko Mint: liquid glass — cool mint, teal (refined) ----------
export const nekoMintTheme = createTheme(color, {
  Background: {
    Container: 'rgba(236, 254, 252, 0.58)',
    ContainerHover: 'rgba(13, 148, 136, 0.10)',
    ContainerActive: 'rgba(13, 148, 136, 0.18)',
    ContainerLine: 'rgba(13, 148, 136, 0.18)',
    OnContainer: '#0f4c47',
  },

  Surface: {
    Container: 'rgba(255, 255, 255, 0.52)',
    ContainerHover: 'rgba(13, 148, 136, 0.08)',
    ContainerActive: 'rgba(13, 148, 136, 0.15)',
    ContainerLine: 'rgba(13, 148, 136, 0.14)',
    OnContainer: '#0f4c47',
  },

  SurfaceVariant: {
    Container: 'rgba(204, 251, 241, 0.56)',
    ContainerHover: 'rgba(13, 148, 136, 0.07)',
    ContainerActive: 'rgba(13, 148, 136, 0.14)',
    ContainerLine: 'rgba(45, 212, 191, 0.35)',
    OnContainer: '#0f4c47',
  },

  Primary: {
    Main: '#0f766e',
    MainHover: '#0d9488',
    MainActive: '#14b8a6',
    MainLine: '#2dd4bf',
    OnMain: '#ffffff',
    Container: 'rgba(204, 251, 241, 0.88)',
    ContainerHover: 'rgba(153, 246, 228, 0.92)',
    ContainerActive: 'rgba(94, 234, 212, 0.96)',
    ContainerLine: 'rgba(45, 212, 191, 0.9)',
    OnContainer: '#134e48',
  },

  Secondary: {
    Main: '#134e48',
    MainHover: '#0f766e',
    MainActive: '#0d9488',
    MainLine: '#14b8a6',
    OnMain: '#f0fdfa',
    Container: 'rgba(204, 251, 241, 0.8)',
    ContainerHover: 'rgba(153, 246, 228, 0.88)',
    ContainerActive: 'rgba(94, 234, 212, 0.92)',
    ContainerLine: 'rgba(45, 212, 191, 0.85)',
    OnContainer: '#134e48',
  },

  Success: {
    Main: '#10b981',
    MainHover: '#059669',
    MainActive: '#047857',
    MainLine: '#065f46',
    OnMain: '#ffffff',
    Container: '#a7f3d0',
    ContainerHover: '#6ee7b7',
    ContainerActive: '#34d399',
    ContainerLine: '#10b981',
    OnContainer: '#064e3b',
  },

  Warning: {
    Main: '#f59e0b',
    MainHover: '#d97706',
    MainActive: '#b45309',
    MainLine: '#92400e',
    OnMain: '#ffffff',
    Container: '#fde68a',
    ContainerHover: '#fcd34d',
    ContainerActive: '#fbbf24',
    ContainerLine: '#f59e0b',
    OnContainer: '#78350f',
  },

  Critical: {
    Main: '#ec4899',
    MainHover: '#db2777',
    MainActive: '#be185d',
    MainLine: '#9d174d',
    OnMain: '#ffffff',
    Container: '#fbcfe8',
    ContainerHover: '#f9a8d4',
    ContainerActive: '#f472b6',
    ContainerLine: '#ec4899',
    OnContainer: '#831843',
  },

  Other: {
    FocusRing: 'rgba(13, 148, 136, 0.4)',
    Shadow: 'rgba(19, 78, 72, 0.1)',
    Overlay: 'rgba(19, 78, 72, 0.3)',
  },
});

// ---------- Neko Cyberpunk: HEAVY neons, BRIGHT cyan/magenta/lime ----------
export const nekoCyberpunkTheme = createTheme(color, {
  Background: {
    Container: 'rgba(2, 2, 8, 0.72)',
    ContainerHover: 'rgba(0, 180, 180, 0.20)',
    ContainerActive: 'rgba(0, 220, 210, 0.33)',
    ContainerLine: 'rgba(0, 255, 255, 0.22)',
    OnContainer: '#e0f9ff',
  },

  Surface: {
    Container: 'rgba(4, 4, 14, 0.68)',
    ContainerHover: 'rgba(0, 160, 160, 0.16)',
    ContainerActive: 'rgba(0, 200, 190, 0.26)',
    ContainerLine: 'rgba(0, 255, 200, 0.18)',
    OnContainer: '#e0f9ff',
  },

  SurfaceVariant: {
    Container: 'rgba(8, 6, 20, 0.62)',
    ContainerHover: 'rgba(0, 140, 140, 0.13)',
    ContainerActive: 'rgba(0, 180, 170, 0.22)',
    ContainerLine: 'rgba(255, 0, 255, 0.15)',
    OnContainer: '#e0f9ff',
  },

  Primary: {
    Main: '#00fff5',
    MainHover: '#5dfff9',
    MainActive: '#99fffc',
    MainLine: '#ccfffe',
    OnMain: '#000814',
    Container: 'rgba(0, 200, 200, 0.4)',
    ContainerHover: 'rgba(0, 255, 245, 0.35)',
    ContainerActive: 'rgba(100, 255, 250, 0.3)',
    ContainerLine: 'rgba(0, 255, 245, 0.5)',
    OnContainer: '#ccfffe',
  },

  Secondary: {
    Main: '#ff00ff',
    MainHover: '#ff66ff',
    MainActive: '#ff99ff',
    MainLine: '#ffccff',
    OnMain: '#0a0014',
    Container: 'rgba(180, 0, 180, 0.45)',
    ContainerHover: 'rgba(255, 0, 255, 0.4)',
    ContainerActive: 'rgba(255, 80, 255, 0.35)',
    ContainerLine: 'rgba(255, 0, 255, 0.55)',
    OnContainer: '#ffccff',
  },

  Success: {
    Main: '#39ff14',
    MainHover: '#6dff4a',
    MainActive: '#9aff7a',
    MainLine: '#c8ffb0',
    OnMain: '#001a00',
    Container: '#0d3d00',
    ContainerHover: '#145200',
    ContainerActive: '#1a6600',
    ContainerLine: '#207a00',
    OnContainer: '#c8ffb0',
  },

  Warning: {
    Main: '#ffff00',
    MainHover: '#ffff50',
    MainActive: '#ffff88',
    MainLine: '#ffffbb',
    OnMain: '#1a1a00',
    Container: '#4d4d00',
    ContainerHover: '#666600',
    ContainerActive: '#808000',
    ContainerLine: '#999900',
    OnContainer: '#ffffbb',
  },

  Critical: {
    Main: '#ff006e',
    MainHover: '#ff4d94',
    MainActive: '#ff80b3',
    MainLine: '#ffb3d1',
    OnMain: '#fff0f6',
    Container: '#990042',
    ContainerHover: '#b3004d',
    ContainerActive: '#cc0058',
    ContainerLine: '#e60063',
    OnContainer: '#ffccdf',
  },

  Other: {
    FocusRing: 'rgba(0, 255, 245, 0.7)',
    Shadow: 'rgba(0, 0, 0, 0.7)',
    Overlay: 'rgba(0, 0, 0, 0.92)',
  },
});

// ---------- Neko Solarized: solarized dark palette, liquid glass ----------
export const nekoSolarizedTheme = createTheme(color, {
  Background: {
    Container: 'rgba(0, 43, 54, 0.60)',
    ContainerHover: 'rgba(42, 161, 152, 0.18)',
    ContainerActive: 'rgba(42, 161, 152, 0.32)',
    ContainerLine: 'rgba(42, 161, 152, 0.28)',
    OnContainer: '#fdf6e3',
  },

  Surface: {
    Container: 'rgba(7, 54, 66, 0.54)',
    ContainerHover: 'rgba(42, 161, 152, 0.14)',
    ContainerActive: 'rgba(42, 161, 152, 0.26)',
    ContainerLine: 'rgba(42, 161, 152, 0.24)',
    OnContainer: '#fdf6e3',
  },

  SurfaceVariant: {
    Container: 'rgba(88, 110, 117, 0.28)',
    ContainerHover: 'rgba(42, 161, 152, 0.12)',
    ContainerActive: 'rgba(42, 161, 152, 0.22)',
    ContainerLine: 'rgba(147, 161, 161, 0.35)',
    OnContainer: '#eee8d5',
  },

  Primary: {
    Main: '#2aa198',
    MainHover: '#3db4ab',
    MainActive: '#5fc9c0',
    MainLine: '#93e0dc',
    OnMain: '#002b36',
    Container: 'rgba(42, 161, 152, 0.35)',
    ContainerHover: 'rgba(42, 161, 152, 0.45)',
    ContainerActive: 'rgba(42, 161, 152, 0.55)',
    ContainerLine: 'rgba(42, 161, 152, 0.5)',
    OnContainer: '#93e0dc',
  },

  Secondary: {
    Main: 'rgba(253, 246, 227, 0.92)',
    MainHover: 'rgba(238, 232, 213, 0.95)',
    MainActive: 'rgba(255, 255, 255, 0.98)',
    MainLine: 'rgba(238, 232, 213, 0.9)',
    OnMain: '#002b36',
    Container: 'rgba(101, 123, 131, 0.4)',
    ContainerHover: 'rgba(131, 148, 150, 0.5)',
    ContainerActive: 'rgba(147, 161, 161, 0.6)',
    ContainerLine: 'rgba(88, 110, 117, 0.55)',
    OnContainer: '#eee8d5',
  },

  Success: {
    Main: '#859900',
    MainHover: '#9cad2a',
    MainActive: '#b4c34e',
    MainLine: '#d4e04e',
    OnMain: '#002b36',
    Container: '#546e00',
    ContainerHover: '#657a00',
    ContainerActive: '#768f00',
    ContainerLine: '#879f00',
    OnContainer: '#f4f6e8',
  },

  Warning: {
    Main: '#b58900',
    MainHover: '#d4a000',
    MainActive: '#ecc200',
    MainLine: '#f5d000',
    OnMain: '#002b36',
    Container: '#7c6000',
    ContainerHover: '#947000',
    ContainerActive: '#ac8000',
    ContainerLine: '#c49000',
    OnContainer: '#fdf6e3',
  },

  Critical: {
    Main: '#dc322f',
    MainHover: '#e85a58',
    MainActive: '#f48280',
    MainLine: '#f9aaa8',
    OnMain: '#fdf6e3',
    Container: '#a62a28',
    ContainerHover: '#b82e2c',
    ContainerActive: '#ca3230',
    ContainerLine: '#dc3634',
    OnContainer: '#fdf0ef',
  },

  Other: {
    FocusRing: 'rgba(42, 161, 152, 0.5)',
    Shadow: 'rgba(0, 43, 54, 0.55)',
    Overlay: 'rgba(0, 43, 54, 0.88)',
  },
});

// ---------- Neko Kawaii: pink, super cute — based on Neko Light, all pink/rose -----
export const nekoKawaiiTheme = createTheme(color, {
  Background: {
    Container: 'rgba(255, 235, 245, 0.58)',
    ContainerHover: 'rgba(233, 30, 140, 0.12)',
    ContainerActive: 'rgba(233, 30, 140, 0.22)',
    ContainerLine: 'rgba(233, 30, 140, 0.22)',
    OnContainer: '#4a2535',
  },

  Surface: {
    Container: 'rgba(255, 248, 252, 0.52)',
    ContainerHover: 'rgba(233, 30, 140, 0.09)',
    ContainerActive: 'rgba(233, 30, 140, 0.18)',
    ContainerLine: 'rgba(233, 30, 140, 0.18)',
    OnContainer: '#4a2535',
  },

  SurfaceVariant: {
    Container: 'rgba(255, 218, 236, 0.56)',
    ContainerHover: 'rgba(233, 30, 140, 0.08)',
    ContainerActive: 'rgba(233, 30, 140, 0.16)',
    ContainerLine: 'rgba(233, 30, 140, 0.16)',
    OnContainer: '#4a2535',
  },

  Primary: {
    Main: '#e91e8c',
    MainHover: '#ff1493',
    MainActive: '#ff69b4',
    MainLine: '#ffb6d9',
    OnMain: '#ffffff',
    Container: 'rgba(255, 20, 147, 0.22)',
    ContainerHover: 'rgba(255, 20, 147, 0.34)',
    ContainerActive: 'rgba(255, 20, 147, 0.46)',
    ContainerLine: 'rgba(233, 30, 140, 0.55)',
    OnContainer: '#5c0a38',
  },

  Secondary: {
    Main: '#c2185b',
    MainHover: '#d81b7a',
    MainActive: '#e91e8c',
    MainLine: '#f06292',
    OnMain: '#fff0f6',
    Container: 'rgba(255, 105, 180, 0.20)',
    ContainerHover: 'rgba(255, 105, 180, 0.30)',
    ContainerActive: 'rgba(255, 105, 180, 0.42)',
    ContainerLine: 'rgba(255, 105, 180, 0.50)',
    OnContainer: '#4a1535',
  },

  Success: {
    Main: '#ec4899',
    MainHover: '#f472b6',
    MainActive: '#f9a8d4',
    MainLine: '#fbcfe8',
    OnMain: '#ffffff',
    Container: '#fce7f3',
    ContainerHover: '#fbcfe8',
    ContainerActive: '#f9a8d4',
    ContainerLine: '#f472b6',
    OnContainer: '#831843',
  },

  Warning: {
    Main: '#f472b6',
    MainHover: '#f9a8d4',
    MainActive: '#fbcfe8',
    MainLine: '#fce7f3',
    OnMain: '#ffffff',
    Container: '#fdf2f8',
    ContainerHover: '#fce7f3',
    ContainerActive: '#fbcfe8',
    ContainerLine: '#f9a8d4',
    OnContainer: '#9d174d',
  },

  Critical: {
    Main: '#db2777',
    MainHover: '#e879a3',
    MainActive: '#f0a5c4',
    MainLine: '#f5c6dc',
    OnMain: '#ffffff',
    Container: '#fce7f3',
    ContainerHover: '#fbcfe8',
    ContainerActive: '#f9a8d4',
    ContainerLine: '#f472b6',
    OnContainer: '#831843',
  },

  Other: {
    FocusRing: 'rgba(233, 30, 140, 0.65)',
    Shadow: 'rgba(140, 50, 100, 0.15)',
    Overlay: 'rgba(80, 20, 50, 0.40)',
  },
});

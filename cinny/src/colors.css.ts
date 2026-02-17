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

// ---------- Neko Dark: cute neko/cat themed — soft purples, blush pinks, periwinkle blues ----------
export const nekoDarkTheme = createTheme(color, {
  Background: {
    Container: '#13121a',
    ContainerHover: '#1b1924',
    ContainerActive: '#22202e',
    ContainerLine: '#2a2738',
    OnContainer: '#efeef6',
  },

  Surface: {
    Container: '#1a1826',
    ContainerHover: '#22202e',
    ContainerActive: '#2a2738',
    ContainerLine: '#322f42',
    OnContainer: '#efeef6',
  },

  SurfaceVariant: {
    Container: '#22202e',
    ContainerHover: '#2a2738',
    ContainerActive: '#322f42',
    ContainerLine: '#3a374c',
    OnContainer: '#efeef6',
  },

  Primary: {
    Main: '#a78bfa',
    MainHover: '#b197fb',
    MainActive: '#b9a3fc',
    MainLine: '#c1affc',
    OnMain: '#1e1b2e',
    Container: '#3d3562',
    ContainerHover: '#463d70',
    ContainerActive: '#4f457e',
    ContainerLine: '#584d8c',
    OnContainer: '#ddd6fe',
  },

  Secondary: {
    Main: '#f5eef9',
    MainHover: '#e8dcef',
    MainActive: '#dbcae5',
    MainLine: '#ceb8db',
    OnMain: '#13121a',
    Container: '#322f42',
    ContainerHover: '#3a374c',
    ContainerActive: '#423f56',
    ContainerLine: '#4a4760',
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

// ---------- Neko Light: cute neko/cat themed — blush cream, pastel lavender, soft pink & blue ----------
export const nekoLightTheme = createTheme(color, {
  Background: {
    Container: '#faf5fc',
    ContainerHover: '#f3ebf8',
    ContainerActive: '#ece0f3',
    ContainerLine: '#e5d6ee',
    OnContainer: '#2d2a36',
  },

  Surface: {
    Container: '#fffbfe',
    ContainerHover: '#faf5fc',
    ContainerActive: '#f3ebf8',
    ContainerLine: '#ece0f3',
    OnContainer: '#2d2a36',
  },

  SurfaceVariant: {
    Container: '#f5eef9',
    ContainerHover: '#ece0f3',
    ContainerActive: '#e3d2ed',
    ContainerLine: '#dac4e7',
    OnContainer: '#2d2a36',
  },

  Primary: {
    Main: '#7c3aed',
    MainHover: '#6d28d9',
    MainActive: '#6335c4',
    MainLine: '#5a2fb3',
    OnMain: '#ffffff',
    Container: '#ddd6fe',
    ContainerHover: '#c4b5fd',
    ContainerActive: '#a78bfa',
    ContainerLine: '#8b5cf6',
    OnContainer: '#3b2762',
  },

  Secondary: {
    Main: '#2d2a36',
    MainHover: '#3d3a48',
    MainActive: '#4a4756',
    MainLine: '#575464',
    OnMain: '#faf5fc',
    Container: '#e3d2ed',
    ContainerHover: '#dac4e7',
    ContainerActive: '#d1b6e1',
    ContainerLine: '#c8a8db',
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

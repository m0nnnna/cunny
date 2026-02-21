import React from 'react';
import { Box, Text, config, toRem } from 'folds';
import { Page, PageHero, PageHeroSection } from '../../components/page';
import CinnySVG from '../../../../public/res/svg/cinny.svg';
import { useAppVersion, useBrandName } from '../../hooks/useClientConfig';
import { isNekoThemeId, useTheme } from '../../hooks/useTheme';

const NEKO_EMOJI = '🐱';

export function WelcomePage() {
  const brandName = useBrandName();
  const appVersion = useAppVersion();
  const theme = useTheme();
  const isNekoTheme = isNekoThemeId(theme.id);

  return (
    <Page>
      <Box
        grow="Yes"
        style={{ padding: config.space.S400, paddingBottom: config.space.S700 }}
        alignItems="Center"
        justifyContent="Center"
      >
        <PageHeroSection>
          <PageHero
            icon={
              isNekoTheme ? (
                <Text as="span" style={{ fontSize: toRem(72), lineHeight: 1 }}>
                  {NEKO_EMOJI}
                </Text>
              ) : (
                <img width="70" height="70" src={CinnySVG} alt={`${brandName} Logo`} />
              )
            }
            title={
              isNekoTheme ? (
                <>
                  Welcome to {brandName} {NEKO_EMOJI}
                </>
              ) : (
                `Welcome to ${brandName}`
              )
            }
            subTitle={
              <span>
                {isNekoTheme
                  ? 'Cute Matrix client, nya~ '
                  : 'The Cute and Funny Matrix Client '}
                v{appVersion}
              </span>
            }
          />
        </PageHeroSection>
      </Box>
    </Page>
  );
}

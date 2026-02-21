import React from 'react';
import { Box, Text } from 'folds';
import { useAppVersion } from '../../hooks/useClientConfig';
import * as css from './styles.css';

export function AuthFooter() {
  const appVersion = useAppVersion();

  return (
    <Box className={css.AuthFooter} justifyContent="Center" gap="400" wrap="Wrap">
      <Text size="T300">v{appVersion}</Text>
      <Text as="a" size="T300" href="https://matrix.org" target="_blank" rel="noreferrer">
        Powered by Matrix
      </Text>
    </Box>
  );
}

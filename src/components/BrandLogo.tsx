import { useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import logoAnimated from '../assets/logo-animated.gif';
import logoPlain from '../assets/logo-plain.png';

interface BrandLogoProps {
  /** Rendered height in px. Width follows the asset's aspect ratio. */
  size?: number;
  alt?: string;
}

/** Animated brand mark; swaps to the static PNG under prefers-reduced-motion. */
export default function BrandLogo({ size = 36, alt = 'PaySlip' }: BrandLogoProps) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const width = Math.round(size * (2400 / 750));
  return (
    <Box
      component="img"
      src={reducedMotion ? logoPlain : logoAnimated}
      alt={alt}
      sx={{
        height: size,
        width,
        maxWidth: '100%',
        objectFit: 'contain',
        objectPosition: 'left center',
        display: 'block',
        flexShrink: 0,
      }}
    />
  );
}

import { useState } from 'react';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { truncateHash } from '../utils/format';
import { mono } from '../theme/theme';

interface HashChipProps {
  value: string;
  chars?: number;
  size?: 'small' | 'medium';
}

/** Middle-truncated monospace hash with copy-on-click. */
export default function HashChip({ value, chars = 6, size = 'small' }: HashChipProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — non-fatal */
    }
  };

  return (
    <Tooltip title={copied ? 'Copied' : 'Copy full value'} placement="top">
      <Chip
        label={truncateHash(value, chars)}
        onClick={copy}
        size={size}
        variant="outlined"
        icon={copied ? <CheckIcon sx={{ fontSize: 14 }} color="success" /> : <ContentCopyIcon sx={{ fontSize: 13 }} />}
        sx={{ fontFamily: mono, fontSize: '0.72rem', cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}
      />
    </Tooltip>
  );
}

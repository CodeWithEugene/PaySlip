import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 7,
        px: 3,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 3.5,
      }}
    >
      {icon && <Box sx={{ mb: 1.5, color: 'text.disabled', '& svg': { fontSize: 40 } }}>{icon}</Box>}
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: action ? 2.5 : 0 }}>
        {body}
      </Typography>
      {action}
    </Box>
  );
}

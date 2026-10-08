import { createContext } from 'react';

// Shares the fixed area above the composer with the original H5 confirmation flow.
export const ConfirmationDockContext = createContext<HTMLDivElement | null>(null);

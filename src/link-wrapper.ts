// This file wraps our Link component and exports it as the default
// It will be used to replace next/link via webpack/turbopack alias

export { Link as default } from './components/Link';
export * from 'next/link';
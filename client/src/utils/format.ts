// client/src/utils/format.ts
/// <reference types="vite/client" />
export const getFullImageUrl = (path: string | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:image')) return path;

    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');
    return `${apiBase}${path}`;
};

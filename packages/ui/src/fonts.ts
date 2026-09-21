/**
 * Self-hosted type.
 *
 * The main site loads Spectral and IBM Plex Mono from Google Fonts. These
 * tools must not, because they make no third-party requests at runtime:
 * the font files are bundled from @fontsource and served from the same
 * origin. Latin subsets only — they cover both English and Portuguese.
 *
 * Import this once, from the app entry point.
 */
import '@fontsource/spectral/latin-400.css';
import '@fontsource/spectral/latin-400-italic.css';
import '@fontsource/spectral/latin-600.css';
import '@fontsource/spectral/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';

/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#007acc',    // Lighter blue for primary actions
        'secondary': '#e0e0e0',  // Light gray for secondary elements
        'background': '#f5f5f5', // Light background
        'surface': '#ffffff',    // White for surface elements like cards
        'error': '#ff4d4d',      // Softer red for error/delete actions
        'success': '#4caf50',    // Softer green for success states
        'text': '#333333',       // Dark text for readability
        'accent': '#ffc107',     // Yellow for highlights or accents
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#333333',
            a: {
              color: 'var(--primary-color)',
              '&:hover': {
                color: 'var(--primary-color-hover)',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    typography
  ],
}

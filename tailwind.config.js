/** Brand colors come from the project specification. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: { DEFAULT: '#9C2836', hover: '#89232F', strong: '#721D27', footer: '#5B171F' },
        gold: { DEFAULT: '#F9C242', hover: '#E5AE2E', soft: '#FEF3D8' },
        ink: '#1F2328',
        muted: '#5B6470',
        line: '#E3E5E8',
        surface: '#F6F6F7',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
};

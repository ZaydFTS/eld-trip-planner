/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Stitch DESIGN.md tokens
        navy: { DEFAULT: '#0B2545', light: '#1E3A8A', dark: '#061629' },
        amber: { DEFAULT: '#F59E0B', light: '#FCD34D', dark: '#B45309' },
        steel: { DEFAULT: '#1E3A8A', tint: '#DBEAFE' },
        success: { DEFAULT: '#10B981', light: '#ECFDF5' },
        warning: { DEFAULT: '#DC2626', light: '#FEF2F2' },
        canvas: '#F8FAFC',
        card: '#FFFFFF',
        border: { DEFAULT: '#E2E8F0', strong: '#CBD5E1' },
        muted: '#64748B',
        ink: '#0F172A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
        btn: '8px',
        chip: '4px',
      },
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(11,37,69,0.04), 0 1px 2px -1px rgba(11,37,69,0.03)',
        overlay: '0 4px 6px -1px rgba(11,37,69,0.08), 0 2px 4px -2px rgba(11,37,69,0.05)',
        modal: '0 20px 25px -5px rgba(11,37,69,0.12), 0 8px 10px -6px rgba(11,37,69,0.06)',
      },
    },
  },
  plugins: [],
}

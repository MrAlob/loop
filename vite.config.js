import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      input: [
        'index.html',
        'browse/index.html',
        'how-it-works/index.html',
        'login/index.html',
        'register/index.html',
        'profile/index.html',
        'create/index.html',
      ],
    },
  },
  plugins: [tailwindcss()],
});

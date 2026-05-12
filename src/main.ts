import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/index.css'
import 'highlight.js/styles/github-dark.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

import '@fontsource/archivo-black/400.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/600.css'
import './style.css'
import { mountApp } from './app'

const root = document.querySelector<HTMLElement>('#app')
if (!root) throw new Error('#app missing')
mountApp(root)

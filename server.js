import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = process.env.PORT || 4000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDirectory = path.join(__dirname, 'dist')

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'NovaTalk web server' })
})

app.use(express.static(distDirectory))
app.use((_req, res) => {
  res.sendFile(path.join(distDirectory, 'index.html'))
})

app.listen(port, () => {
  console.log(`NovaTalk web server listening on http://localhost:${port}`)
})

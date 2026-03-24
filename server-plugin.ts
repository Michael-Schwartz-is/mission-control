import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

const DATA_FILE = path.resolve(__dirname, 'data.json')

export function dataServerPlugin(): Plugin {
  return {
    name: 'data-server',
    configureServer(server) {
      server.middlewares.use('/api/data', (req, res) => {
        if (req.method === 'GET') {
          if (!fs.existsSync(DATA_FILE)) {
            res.writeHead(404)
            res.end('{}')
            return
          }
          const data = fs.readFileSync(DATA_FILE, 'utf-8')
          res.setHeader('Content-Type', 'application/json')
          res.end(data)
        } else if (req.method === 'PUT') {
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            fs.writeFileSync(DATA_FILE, body, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end('{"ok":true}')
          })
        } else {
          res.writeHead(405)
          res.end()
        }
      })
    },
  }
}

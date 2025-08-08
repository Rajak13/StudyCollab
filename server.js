const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// We'll initialize the realtime server after Next.js is ready
let realtimeServer = null

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io server dynamically
  try {
    const { initializeRealtimeServer } = await import('./src/lib/realtime/socket-server.js')
    realtimeServer = initializeRealtimeServer(server)
    console.log('Real-time server initialized')
  } catch (error) {
    console.error('Failed to initialize real-time server:', error)
    console.log('Server will run without real-time features')
  }

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully')
    if (realtimeServer) {
      realtimeServer.disconnect()
    }
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully')
    if (realtimeServer) {
      realtimeServer.disconnect()
    }
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
})
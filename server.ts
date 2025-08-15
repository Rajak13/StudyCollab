// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createServer } = require('http')
const next = require('next')
const { parse } = require('url')
const { initializeRealtimeServer } = require('./src/lib/realtime/socket-server')
const { initializeYjsServer } = require('./src/lib/collaboration/yjs-server')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Increase max listeners to prevent memory leak warnings
require('events').EventEmitter.defaultMaxListeners = 20

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true)
            await handle(req, res, parsedUrl)
        } catch (err) {
            console.error('Error occurred handling', req.url, err)
            res.statusCode = 500
            res.end('internal server error')
        }
    })

    // Initialize Socket.io server
    const realtimeServer = initializeRealtimeServer(server)
    console.log('Real-time server initialized')

    // Initialize Yjs collaboration server
    const yjsServer = initializeYjsServer(realtimeServer.io)
    console.log('Yjs collaboration server initialized')

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
        realtimeServer.disconnect()
        server.close(() => {
            console.log('Server closed')
            process.exit(0)
        })
    })

    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully')
        realtimeServer.disconnect()
        server.close(() => {
            console.log('Server closed')
            process.exit(0)
        })
    })
})
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initializeSocketServer } from "./socketServer.js";
import { initializeMatterServer } from "./matterServer.js";
import { initializeEnergyManager } from "./energyManager.js";

const port = parseInt(process.env.PORT || '3001', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  //initializeSocketServer(httpServer);

  //initializeMatterServer();

  //initializeEnergyManager();

  httpServer.listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV
    }`
  )
})
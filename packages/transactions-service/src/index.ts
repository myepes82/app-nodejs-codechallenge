import 'reflect-metadata'
import startApolloServer from './server/server'
import { databaseInstance, transactionMessageManagerInstance } from './globals'
import { eventHandler } from './handlers/event.handler'

async function main (): Promise<void> {
  const { PORT } = process.env
  const port: string | number = PORT ?? 4000
  await startApolloServer(port)
  await databaseInstance.start()
}
main().then(async () => {
  await transactionMessageManagerInstance.consume(eventHandler)
}).catch(e => { console.log(e) })

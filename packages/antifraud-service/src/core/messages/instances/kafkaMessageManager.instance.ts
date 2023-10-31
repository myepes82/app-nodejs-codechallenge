import { type Consumer, Kafka, type Producer } from 'kafkajs'
import { MessageManager } from '../messageManager'
import { type EventMessage } from '../../../shared/interfaces/eventMessage.interface'
import { logger } from '../../../shared/imports'
import { type EventMessageContent } from '../../../shared/interfaces/eventMessageContent.interface'

export class KafkaMessageManagerInstance extends MessageManager {
  private readonly _location: string = 'KafkaMessageManagerInstance.ts'
  private readonly _configuration: Kafka
  private readonly _producer: Producer
  private readonly _consumer: Consumer
  private readonly _allowedEventsToProcess: string[]

  constructor (groupId: string, topic: string, events: string[]) {
    const { KAFKA_BROKER, KAFKA_MAX_RETRIES } = process.env
    const broker: string = KAFKA_BROKER ?? 'localhost:9092'
    const maxRetries: number = parseInt(KAFKA_MAX_RETRIES ?? '3')

    super(groupId, topic)

    this._configuration = new Kafka({
      clientId: 'antifraud-service',
      brokers: [broker]
    })

    this._producer = this._configuration.producer()
    this._consumer = this._configuration.consumer({ groupId, maxInFlightRequests: maxRetries })
    this._allowedEventsToProcess = events
  }

  public async produce<T>(message: EventMessage<T>): Promise<void> {
    try {
      const value = JSON.stringify(message.value)
      logger.logDebug(`Sending message: ${value}`)

      await this._producer.connect()
      await this._producer.send({
        topic: super.topic,
        messages: [{ key: message.key, value }]
      })

      logger.logDebug('Message sent', this._location)
    } catch (error) {
      logger.logError(error, this._location)
    } finally {
      await this._producer.disconnect()
    }
  }

  public async consume (it: (message: any) => Promise<void>): Promise<void> {
    try {
      await this._consumer.connect()
      await this._consumer.subscribe({ topic: super.topic, fromBeginning: true })
      await this._consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const data: EventMessageContent<any> = JSON.parse(message.value?.toString() ?? '')
          try {
            if (!this._allowedEventsToProcess.includes(data.name)) {
              await this._consumer.commitOffsets([{ topic, partition, offset: message.offset }])
            }
            await it(data)
          } catch (error) {
            logger.logError(error, this._location)
          }
          await this._consumer.commitOffsets([{ topic, partition, offset: message.offset }])
        }
      })
    } catch (error) {
      logger.logError(error, this._location)
    }
  }
}
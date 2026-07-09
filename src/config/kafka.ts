import { Kafka, Consumer } from "kafkajs";
import { MessageBroker } from "../types/broker";
import { Console } from "console";

export class KafkaBroker implements MessageBroker {
    private consumer: Consumer;

    constructor(clientId: string, brokers: string[]) {
        const kafka = new Kafka({ clientId, brokers });
        this.consumer = kafka.consumer({ groupId: clientId });
    }

    /**
     * Connect the consumer
     */
    async connectConsumer() {
        await this.consumer.connect();
    }

    /**
     * Disconnect the consumer
     */
    async disconnectConsumer() {
        if (this.consumer) {
            await this.consumer.disconnect();
        }
    }

    /**
     * Consume messages from the given topics
     * @param topics - the topics to consume from
     * @param fromBeginning - whether to consume from the beginning
     */
    async consumeMessage(topics: string[], fromBeginning: boolean) {
        await this.consumer.subscribe({ topics, fromBeginning });
        switch (topic){
            case "product":
                await handleProductUpdate(message.value?.toString())
                break;
            default:
                console.log("nothing doing ")
        }
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log(`Received message from topic ${topic}, partition ${partition}:`, message.value?.toString());
            },
        });
    }
}

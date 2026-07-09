import { Kafka, Consumer } from "kafkajs";
import { MessageBroker } from "../types/broker";
import { handleProductUpdate } from "../productCache/productUpdateHandler";
import { handleToppingUpdate } from "../toppingCache/toppingUpdateHandler";

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
        
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log(`Received message from topic ${topic}, partition ${partition}:`, message.value?.toString());
                
                switch (topic){
                    case "product":
                        if (message.value) {
                            await handleProductUpdate(message.value.toString());
                        }
                        break;
                    case "topping":
                        if (message.value) {
                            await handleToppingUpdate(message.value.toString());
                        }
                        break;
                    default:
                        console.log("nothing doing ");
                }
            },
        });
    }
}

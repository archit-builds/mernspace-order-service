import config from "config";
import { MessageBroker } from "../../../types/broker";
import { KafkaBroker } from "../../../config/kafka";

let broker: MessageBroker | null = null;

export const createMessageBroker = (): MessageBroker => {
  console.log("connecting to kafka broker...");
  // singleton
  if (!broker) {
    broker = new KafkaBroker("order-service", [config.get("kafka.broker")]);
  }
  return broker;
};
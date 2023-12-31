import { globalEvents } from "@tabletop-playground/api";

namespace EventBus {
    export type BusId = `@${string}/${string}`;

    export type Schema = {
        [signal: string]: any[];
    };

    type Handler<A extends any[]> = (...vargs: A) => void;

    export interface Bus<D extends Schema> {
        /**
         * Subscribes a handler function to a specific event signal.
         *
         * @param {Signal} signal - The event signal to subscribe to.
         * @param {Handler<Schema[Signal]>} handler - The event handler function.
         * @returns {Function} A function to unsubscribe the handler.
         */
        subscribe<const S extends keyof D>(signal: S, handler: Handler<D[S]>): () => void;

        /**
         * Unsubscribes a handler function from a specific event signal.
         *
         * @param {Signal} signal - The event signal to unsubscribe from.
         * @param {Handler<Schema[Signal]>} handler - The event handler function.
         */
        unsubscribe<const S extends keyof D>(signal: S, handler: Handler<D[S]>): void;

        /**
         * Triggers an event with the provided arguments.
         *
         * @param {Signal} signal - The event signal to trigger.
         * @param {...Schema[Signal]} args - The arguments associated with the event.
         */
        trigger<const S extends keyof D>(signal: S, ...args: D[S]): void;

        /**
         * Clears all handlers for a specific event signal.
         *
         * @param {Signal} signal - The event signal to clear.
         */
        clear<const S extends keyof D>(signal: S): void;
    }

    class BusHolder<const D extends Schema> {
        #listeners: { [key in keyof D]?: Handler<D[key]>[] };

        constructor() {
            this.#listeners = {};
        }

        subscribe<const S extends keyof D>(signal: S, handler: Handler<D[S]>): () => void {
            if (!(signal in this.#listeners)) {
                this.#listeners[signal] = [];
            }
            this.#listeners[signal]!.push(handler);

            return () => {
                this.#listeners[signal] = this.#listeners[signal]?.filter((a) => a !== handler) ?? [];
            };
        }

        unsubscribe<const S extends keyof D>(signal: S, handler: Handler<D[S]>) {
            if (this.#listeners[signal]) {
                this.#listeners[signal] = this.#listeners[signal]?.filter((a) => a !== handler) ?? [];
            }
        }

        trigger<const S extends keyof D>(signal: S, ...args: D[S]) {
            if (this.#listeners[signal]) {
                this.#listeners[signal]!.forEach((handler) => {
                    handler(...args);
                });
            }
        }

        clear<const S extends keyof D>(signal: S) {
            this.#listeners[signal] = [];
        }
    }

    /**
     * Retrieves or creates a Bus instance with a specific schema.
     *
     * @template Schema - The schema representing different types of events and their associated data.
     * @param {BusId} busId - The unique identifier for the event bus.
     * @returns {Bus<Schema>} The Bus instance associated with the provided busId.
     */
    export const get = <const T extends Schema>(busId: BusId): Bus<T> => {
        const busCarriers = globalEvents as typeof globalEvents & { eventBus: { [key: BusId]: BusHolder<any> } };
        if (!("eventBus" in globalEvents)) {
            busCarriers.eventBus = {};
        }
        if (!(busId in busCarriers.eventBus)) {
            busCarriers.eventBus[busId] = new BusHolder<T>();
        }
        return busCarriers.eventBus[busId];
    };
}

export default EventBus;

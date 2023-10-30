import { globalEvents } from "@tabletop-playground/api";

namespace EventBus {
    export type BusId = `@${string}/${string}`;

    export type Schema = {
        [signal: string]: any[];
    };

    type Handler<A extends any[]> = (...vargs: A) => void;

    class Bus<const D extends Schema> {
        #listeners: { [key in keyof D]?: Handler<D[key]>[] };

        constructor() {
            this.#listeners = {};
        }

        subscribe<const S extends keyof D>(signal: S, handler: Handler<D[S]>) {
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

    export const get = <const T extends Schema>(busId: BusId): Bus<T> => {
        const busCarriers = globalEvents as typeof globalEvents & { eventBus: { [key: BusId]: Bus<any> } };
        if (!("eventBus" in globalEvents)) {
            busCarriers.eventBus = {};
        }
        if (!(busId in busCarriers.eventBus)) {
            busCarriers.eventBus[busId] = new Bus<T>();
        }
        return busCarriers.eventBus[busId];
    };
}

export default EventBus;

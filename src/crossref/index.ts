import { world } from "@tabletop-playground/api";

namespace CrossRef {
    export type RefId = `@${string}/${string}`;

    /**
     * Registers a value with a given key and reference ID.
     *
     * @template T - The type of the value being registered.
     * @param {RefId} id - The unique reference ID.
     * @param {string} key - The key associated with the value.
     * @param {T} value - The value to be registered.
     * @returns {Function} A function to unregister the value.
     */
    export const register = <T>(id: RefId, key: string, value: T): (() => void) => {
        const w = world as any;
        if (!("CROSSREF" in world)) {
            w.CROSSREF = {};
        }
        if (!(id in w.CROSSREF)) {
            w.CROSSREF[id] = {};
        }
        w.CROSSREF[id][key] = value;
        return () => {
            delete w.CROSSREF?.[id]?.[key];
        };
    };

    /**
     * Unregisters a value associated with a specific key and reference ID.
     *
     * @param {RefId} id - The unique reference ID.
     * @param {string} key - The key associated with the value to be unregistered.
     */
    export const unregister = (id: RefId, key: string) => {
        delete (world as any).CROSSREF?.[id]?.[key];
    };

    /**
     * Retrieves a value associated with a specific key and reference ID.
     *
     * @template T - The expected type of the value.
     * @param {RefId} id - The unique reference ID.
     * @param {string} key - The key associated with the value.
     * @returns {T | undefined} The value associated with the key, or undefined if not found.
     */
    export const get = <T>(id: RefId, key: string): T | undefined => {
        return (world as any)?.CROSSREF?.[id]?.[key] as T | undefined;
    };

    /**
     * Retrieves an array of keys associated with a specific reference ID.
     *
     * @param {RefId} id - The unique reference ID.
     * @returns {string[]} An array of keys associated with the reference ID.
     */
    export const keys = (id: RefId): string[] => {
        return Object.keys((world as any)?.CROSSREF?.[id] ?? {});
    };
}

export default CrossRef;

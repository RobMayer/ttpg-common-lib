import { GameObject, GameWorld, JSConsole } from "@tabletop-playground/api";

const chunkString = (str: string, size: number) => {
    return Array(Math.ceil(str.length / size))
        .fill("")
        .map((_, i) => str.slice(i * size, i * size + size));
};

namespace Storage {
    export type Tokenizable = string | number | boolean | null | { [key: string | number]: Tokenizable } | Tokenizable[] | keyof any[] | readonly Tokenizable[];

    export type StorageId = `@${string}/${string}`;
    export type Metadata = {
        version?: string;
        chunks: number;
        size: number;
    };

    export type Store<T extends Tokenizable> = {
        load: () => undefined | T;
        save: (data: T, version?: string) => boolean;
        metadata: () => Metadata;
    };

    export const get = <T extends Tokenizable>(obj: GameObject | GameWorld, id: StorageId): Store<T> => {
        /**
         * Loads and deserializes the Tokenizable object from storage.
         *
         * @returns {T | undefined} The loaded Tokenizable object, or undefined if the data is not present on the GameObject/GameWorld
         */
        const load = () => {
            try {
                const raw = obj.getSavedData(id);
                if (raw === "") {
                    return;
                }
                const meta = JSON.parse(raw) as { p?: string; c: number; s: number; v?: string };
                if (meta.p) {
                    return JSON.parse(meta.p) as T;
                }
                return JSON.parse(
                    Array(meta.c)
                        .fill("")
                        .map((e, i) => obj.getSavedData(`${id}[${i}]`))
                        .join("")
                ) as T;
            } catch (e) {}
        };

        /**
         * Saves a Tokenizable object to storage with an optional version string.
         *
         * @template T - The type of the Tokenizable object.
         * @param {T} data - The Tokenizable object to be saved.
         * @param {string | undefined} version - Optional version string associated with the data.
         * @returns {boolean} True if the data was successfully saved, false otherwise.
         */
        const save = (data: T, version?: string) => {
            const raw = JSON.stringify(data);
            if (raw.length > 1000 * 60) {
                JSConsole.error("Data is too large");
                return false;
            }
            const rawMd = JSON.stringify({ v: version, s: raw.length });
            if (rawMd.length + raw.length <= 1000) {
                obj.setSavedData(JSON.stringify({ v: version, c: 0, s: raw.length, p: raw }), id);
            } else {
                const chunks = chunkString(raw, 1000);
                obj.setSavedData(JSON.stringify({ v: version, c: chunks.length, s: raw.length }), id);
                const toSave = Array(60).fill("");
                toSave.splice(0, chunks.length, ...chunks);
                toSave.forEach((chunk, i) => {
                    obj.setSavedData(chunk, `${id}[${i}]`);
                });
            }
            return true;
        };

        /**
         * Retrieves metadata about the saved data associated with the provided StorageId.
         *
         * @returns {Metadata} An object containing metadata information (version, chunks, size).
         */
        const metadata = (): Metadata => {
            const metaRaw = obj.getSavedData(id);
            if (metaRaw === "") {
                return { chunks: 0, size: 0 };
            }
            const m = JSON.parse(metaRaw) as { p?: string; c?: number; s: number; v?: string };
            return { version: m.v, chunks: m.c ?? 0, size: m.s };
        };

        return {
            load,
            save,
            metadata,
        };
    };
}

export default Storage;

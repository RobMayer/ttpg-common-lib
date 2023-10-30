import { GameObject, GameWorld, JSConsole } from "@tabletop-playground/api";

const chunkString = (str: string, size: number) => {
    return Array(Math.ceil(str.length / size))
        .fill("")
        .map((_, i) => str.slice(i * size, i * size + size));
};

namespace Storage {
    export type Tokenizable = string | number | { [key: string | number]: Tokenizable } | Tokenizable[];

    export type StorageId = `@${string}/${string}`;
    export type Metadata = {
        version?: string;
        chunks: number;
        size: number;
    };

    export const get = <T extends Tokenizable>(obj: GameObject | GameWorld, id: StorageId) => {
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
                Array(60)
                    .fill("")
                    .splice(0, chunks.length, ...chunks)
                    .forEach((chunk, i) => {
                        obj.setSavedData(chunk, `${id}[${i}]`);
                    });
            }
            return true;
        };

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

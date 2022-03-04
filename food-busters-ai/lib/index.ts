import * as tf from "@tensorflow/tfjs-node";

const labelMap = {
    1: "Omelet Rice",
    2: "Chicken Rice",
} as const;

type valueOf<T> = T[keyof T];

export interface MLResult {
    type: valueOf<typeof labelMap>;
    score: number;
}

// const mroot = "food-busters-ai/model";

export async function getMLResult(img: string) {
    // const model = tf.io.fileSystem(`${mroot}/model.json`);
    // const m1 = tf.io.fileSystem(`${mroot}/group1-shard1of3.bin`);
    // const m2 = tf.io.fileSystem(`${mroot}/group1-shard2of3.bin`);
    // const m3 = tf.io.fileSystem(`${mroot}/group1-shard3of3.bin`);

    const net = await tf.loadGraphModel(process.env.ML_ENDPOINT as string);

    const decodedImage = tf.node.decodeImage(
        Buffer.from(img.replace(/^data:image\/.+;base64,/, ""), "base64"),
        3
    );

    const transformed = tf.image
        .resizeBilinear(decodedImage, [640, 480])
        .cast("int32")
        .expandDims(0);
    const obj = await net.executeAsync(transformed);

    const result: MLResult = {
        // @ts-ignore
        type: labelMap[(await obj[7].array())[0][0]],
        // @ts-ignore
        score: (await obj[2].array())[0][0],
    };

    tf.dispose(decodedImage);
    tf.dispose(transformed);
    tf.dispose(obj);

    return result;
}

export enum VersionRejectReason {
    PASS,
    INVALID_VERSION,
    OUTDATED,
}

export function checkVersion(toCheck: string, minApp: number, minWeb: number) {
    const tokens = toCheck?.trim()?.split("-");

    if (tokens?.length != 2) {
        return VersionRejectReason.INVALID_VERSION;
    }

    if (tokens[0] == "app") {
        return +tokens[1] >= minApp
            ? VersionRejectReason.PASS
            : VersionRejectReason.OUTDATED;
    }

    if (tokens[0] == "web") {
        return +tokens[1] >= minWeb
            ? VersionRejectReason.PASS
            : VersionRejectReason.OUTDATED;
    }

    return VersionRejectReason.INVALID_VERSION;
}

export function makeRes(code: number, message: string) {
    return {
        status: code,
        body: {
            message,
            error: code,
        },
    };
}

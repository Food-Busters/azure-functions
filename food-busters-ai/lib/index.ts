import * as tf from "@tensorflow/tfjs-node";

import { Version } from "../../config";

import { MLResult, FoodNutrition } from "./types";

const labelMap: { [key: number]: { name: string; nutrition: FoodNutrition } } =
    {
        1: {
            name: "Omelet Rice",
            nutrition: {
                carbohydrate: 65,
                fat: 15,
                protein: 20,
            },
        },
        2: {
            name: "Chicken Rice",
            nutrition: {
                carbohydrate: 45,
                fat: 25,
                protein: 30,
            },
        },
    };

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

    // @ts-ignore
    const detected: number = (await obj[7].array())[0][0];

    const result: MLResult = {
        foodName: labelMap[detected].name,
        foodNutrition: labelMap[detected].nutrition,
        // @ts-ignore
        score: (await obj[2].array())[0][0],
        version: Version,
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

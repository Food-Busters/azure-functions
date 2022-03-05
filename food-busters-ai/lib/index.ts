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
let net: tf.GraphModel;
let lnet: tf.LayersModel;

export async function getMLLayerModel(img: string) {
    if (!lnet)
        lnet = await tf.loadLayersModel(
            "file://food-busters-ai/model-U/model.json"
        );

    const decodedImage = tf.node.decodeImage(
        Buffer.from(img.replace(/^data:image\/.+;base64,/, ""), "base64"),
        3
    );

    const transformed = tf.image
        .resizeBilinear(decodedImage, [224, 224])
        // stupid mistake
        .cast("float32")
        .div(255)
        .expandDims(0);

    const res = lnet.predict(transformed) as tf.Tensor;

    // @ts-ignore
    const arr = (await res.array())[0] as number[];

    console.log(
        `Omelet: ${arr[0] * 100}%, Chicken: ${arr[1] * 100}%, None: ${
            arr[2] * 100
        }%`
    );

    // C++ Way lol
    let max = arr[0];
    let maxpos = 0;
    for (let i = 1; i < arr.length - 1; i++) {
        if (arr[i] > max) {
            max = arr[i];
            maxpos = i;
        }
    }

    const result: MLResult = {
        foodName: labelMap[maxpos + 1].name,
        foodNutrition: labelMap[maxpos + 1].nutrition,
        confidence: max,
        version: Version,
    };

    tf.dispose(decodedImage);
    tf.dispose(transformed);
    tf.dispose(res);

    return result;
}

export async function getMLResult(img: string) {
    if (!net)
        net = await tf.loadGraphModel(
            "file://food-busters-ai/model/model.json"
        );

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
        confidence: (await obj[2].array())[0][0],
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

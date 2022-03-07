import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import {
    checkVersion,
    getMLLayerModel,
    getMLResult,
    makeRes,
    VersionRejectReason,
} from "./lib";

const MinAppVersion = 321;
const MinWebVersion = 6;

const index: AzureFunction = async (context: Context, req: HttpRequest) => {
    const { body, headers } = req;

    const VersionCheck = checkVersion(
        headers.version,
        MinAppVersion,
        MinWebVersion
    );

    if (VersionCheck != VersionRejectReason.PASS) {
        context.res = makeRes(
            400,
            VersionCheck == VersionRejectReason.INVALID_VERSION
                ? "Invalid Version"
                : "Outdated Version"
        );
        return;
    }

    if (body.modelType != "P" && body.modelType != "U") {
        context.res = makeRes(400, `Invalid Model Type: ${body.modelType}`);
        return;
    }

    if (!body.image) {
        context.res = makeRes(400, "Missing Image");
        return;
    }

    if (!(body.image as string).startsWith("data:image/")) {
        context.res = makeRes(400, "Not An Image");
        return;
    }

    let result;
    try {
        if (body.modelType == "P") result = await getMLResult(body.image);

        if (body.modelType == "U") result = await getMLLayerModel(body.image);
    } catch (err) {
        context.res = makeRes(500, `Error executing Model: ${err}`);
        return;
    }

    context.res = {
        status: 200,
        body: result,
    };
};

export default index;

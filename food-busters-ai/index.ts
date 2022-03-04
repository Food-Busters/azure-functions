import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { checkVersion, getMLResult, makeRes, VersionRejectReason } from "./lib";

const MinAppVersion = 306;
const MinWebVersion = 1;

const index: AzureFunction = async (context: Context, req: HttpRequest) => {
    const { body, headers } = req;

    if (!process.env.token) {
        context.res = makeRes(
            500,
            "The server is unable to authorize incoming request"
        );
        return;
    }

    if (headers.token != process.env.token) {
        context.res = makeRes(401, "Unauthorized");
        return;
    }

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
        result = await getMLResult(body.image);
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

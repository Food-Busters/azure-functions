import { assert } from "chai";

import { checkVersion, VersionRejectReason } from "../food-busters-ai/lib";

describe("Check Version Function", () => {
    const minApp = 69;
    const minWeb = 420;

    it("Outdated Version", () => {
        assert.equal(
            checkVersion("web-33", minApp, minWeb),
            VersionRejectReason.OUTDATED
        );
    });

    it("Invalid Version", () => {
        assert.equal(
            checkVersion("apps-555", minApp, minWeb),
            VersionRejectReason.INVALID_VERSION
        );

        assert.equal(
            checkVersion("faidkfdsfdsa  dfawdfdafsdaf", minApp, minWeb),
            VersionRejectReason.INVALID_VERSION
        );

        assert.equal(
            checkVersion("", minApp, minWeb),
            VersionRejectReason.INVALID_VERSION
        );

        assert.equal(
            // @ts-ignore
            checkVersion(undefined, minApp, minWeb),
            VersionRejectReason.INVALID_VERSION
        );
    });

    it("Pass", () => {
        assert.equal(
            checkVersion("web-421", minApp, minWeb),
            VersionRejectReason.PASS
        );

        assert.equal(
            checkVersion("app-69", minApp, minWeb),
            VersionRejectReason.PASS
        );
    });
});

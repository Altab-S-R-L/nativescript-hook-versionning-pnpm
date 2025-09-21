const fs = require("fs-extra");
const AndroidManifest = require("androidmanifest");
const iOSPList = require("plist");

module.exports = function (
  $logger,
  $platformsDataService,
  $projectData,
  hookArgs
) {
  const nsConfig = $projectData.nsConfig;
  const hookConfig = $projectData.nsConfig.nativescriptHookVersioning;

  if (!nsConfig || !nsConfig.version) {
    $logger.warn(
      "[nativescript-hook-versioning-pnpm] NativeScript version is not defined. Skipping native metadata update."
    );
    return;
  }

  if (!hookConfig) {
    $logger.warn(
      "[nativescript-hook-versioning-pnpm] The hook config isn't defined in nativescript.config.ts."
    );
    return;
  }

  let versionCodeEnabled =
    hookConfig.versionCode &&
    hookConfig.versionCode.enabled &&
    hookConfig.versionCode.content;
  let versionCodeContent = hookConfig.versionCode.content;
  let versionCodeEnvVar = null;

  if (versionCodeEnabled) {
    if (versionCodeContent.includes("+")) {
      const splitted = hookConfig.versionCode.content.split("+");
      versionCodeEnvVar = splitted[0];

      if (!process.env[versionCodeEnvVar]) {
        versionCodeEnabled = false;
      } else {
        versionCodeContent =
          parseInt(process.env[versionCodeEnvVar], 10) + parseInt(splitted[1], 10);
      }
    } else if (process.env[versionCodeContent]) {
      versionCodeEnvVar = versionCodeContent;
      versionCodeContent = process.env[versionCodeContent];
    } else {
      versionCodeEnabled = false;
    }
  }

  if (versionCodeEnabled) {
    const parsedCode = parseInt(versionCodeContent, 10);
    if (Number.isNaN(parsedCode)) {
      versionCodeEnabled = false;
    } else {
      versionCodeContent = parsedCode;
    }
  }

  const platform = hookArgs.prepareData.platform;
  const platformData =
    $platformsDataService.platformsDataService[platform]._platformData;

  if (platform == "android") {
    let manifest = new AndroidManifest().readFile(
      platformData.configurationFilePath
    );

    if (hookConfig.versionName || versionCodeEnabled) {
      const envInfo = versionCodeEnvVar
        ? `${versionCodeEnvVar}=${process.env[versionCodeEnvVar] || 'undefined'}`
        : 'env unused';
      $logger.info(
        `[nativescript-hook-versioning-pnpm] Android manifest -> versionName=${nsConfig.version}, versionCode=${
          versionCodeEnabled ? versionCodeContent : 'disabled'
        } (${envInfo})`
      );
    }

    if (hookConfig.versionName) {
      manifest.$("manifest").attr("android:versionName", nsConfig.version);
    }

    if (versionCodeEnabled) {
      manifest.$("manifest").attr("android:versionCode", versionCodeContent);
    }

    manifest.writeFile(platformData.configurationFilePath);
  } else if (platform == "ios") {
    let plist = iOSPList.parse(
      fs.readFileSync(platformData.configurationFilePath, "utf8")
    );

    if (hookConfig.versionName || versionCodeEnabled) {
      $logger.info(
        `[nativescript-hook-versioning-pnpm] iOS Info.plist -> versionName=${nsConfig.version}, versionCode=${
          versionCodeEnabled ? versionCodeContent : 'disabled'
        }`
      );
    }

    if (hookConfig.versionName) {
      plist.CFBundleShortVersionString = nsConfig.version;
    }

    if (versionCodeEnabled) {
      plist.CFBundleVersion = versionCodeContent.toString();
    }

    fs.writeFileSync(platformData.configurationFilePath, iOSPList.build(plist));
  }
};

# NativeScript Hook Versioning (pnpm friendly)

Repository: [Altab-S-R-L/nativescript-hook-versionning-pnpm](https://github.com/Altab-S-R-L/nativescript-hook-versionning-pnpm)

This plugin installs an `after-prepare` hook that keeps your native project metadata in sync with the values defined in `nativescript.config.ts`. It is a fork of `@altabsrl/nativescript-hook-versioning` updated to work when the project is installed with pnpm (while remaining compatible with npm/yarn).

- Take your `version` from `nativescript.config.ts` and put it as `versionName` into your `AndroidManifest.xml` and as `CFBundleShortVersionString` into your `Info.plist`.
- Take an environment variable of your choice and put it as `versionCode` into your `AndroidManifest.xml` and as `CFBundleVersion` into your `Info.plist`. That allow you to use an environment variable from your CICD and auto increment your version code.

# Installation

`ns plugin add @altabsrl/nativescript-hook-versioning-pnpm`

# Usage

You can add the following configuration into your `nativescript.config.ts`

```
nativescriptHookVersioning: {
    versionName: true,
    versionCode: {
      enabled: true,
      content: 'BUNDLE_VERSION_CODE', // This can contains '+ANY_NUMBER' if you need to increment your versionCode.
    },
  },
```

to configure it to your likings.

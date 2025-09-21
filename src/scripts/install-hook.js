const fs = require('fs');
const os = require('os');
const path = require('path');

const pkgDir = path.resolve(__dirname, '..');
const pkg = require(path.join(pkgDir, 'package.json'));
const hooks = (pkg.nativescript && pkg.nativescript.hooks) || [];

function isNativeScriptAppRoot(dir) {
  if (!dir) {
    return false;
  }

  const tsConfig = path.join(dir, 'nativescript.config.ts');
  const jsConfig = path.join(dir, 'nativescript.config.js');

  return fs.existsSync(tsConfig) || fs.existsSync(jsConfig);
}

function normalizeCandidate(dir) {
  if (!dir) {
    return [];
  }

  const candidates = [dir];

  try {
    const real = fs.realpathSync(dir);
    if (real && real !== dir) {
      candidates.push(real);
    }
  } catch (err) {
    // ignore realpath issues
  }

  return candidates;
}

function walkUpwards(startDir) {
  let current = startDir;
  let previous = null;

  while (current && current !== previous) {
    if (isNativeScriptAppRoot(current)) {
      return current;
    }

    previous = current;
    current = path.dirname(current);
  }

  return null;
}

function findProjectDir(pkgdir) {
  const candidates = [];

  if (process.env.INIT_CWD) {
    candidates.push(...normalizeCandidate(process.env.INIT_CWD));
  }

  candidates.push(...normalizeCandidate(pkgdir));

  for (const candidate of candidates) {
    const found = walkUpwards(candidate);
    if (found) {
      return found;
    }
  }

  return null;
}

function generateHookName(pkgName, hook) {
  const base = (hook.name || pkgName).replace(/@/g, '').replace(/\//g, '-');
  return `${base}.js`;
}

function install() {
  if (!hooks.length) {
    return;
  }

  const projectDir = findProjectDir(pkgDir);
  if (!projectDir) {
    console.warn('[nativescript-hook-versioning-pnpm] Unable to locate NativeScript project root. The hook will not be installed.');
    return;
  }

  hooks.forEach((hook) => {
    const hookDir = path.join(projectDir, 'hooks', hook.type);
    fs.mkdirSync(hookDir, { recursive: true });

    const hookFileName = generateHookName(pkg.name, hook);
    const hookPath = path.join(hookDir, hookFileName);

    if (fs.existsSync(hookPath)) {
      return;
    }

    const trampoline = `${hook.inject ? 'module.exports = ' : ''}require("${pkg.name}/${hook.script}");`;
    fs.writeFileSync(hookPath, `${trampoline}${os.EOL}`);
  });
}

install();

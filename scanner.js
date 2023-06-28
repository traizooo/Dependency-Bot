const { extractDependenciesFromPackageJson } = require('./packageUtils');
const { startUpdateCheck } = require('./updateUtils');

async function testScanner(packageJsonPath) {
  const dependencies = extractDependenciesFromPackageJson(packageJsonPath);

  startUpdateCheck(24 * 60 * 60 * 1000, dependencies, packageJsonPath, null, false);
}

testScanner('./package.json');

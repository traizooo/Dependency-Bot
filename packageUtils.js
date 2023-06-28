const fs = require('fs');

function extractDependenciesFromPackageJson(packageJsonPath) {
  try {
    const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonData);
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const allDependencies = { ...dependencies, ...devDependencies };

    return Object.keys(allDependencies);
  } catch (error) {
    console.error(`Error reading or parsing package.json: ${error}`);
    return [];
  }
}

module.exports = {
  extractDependenciesFromPackageJson,
};
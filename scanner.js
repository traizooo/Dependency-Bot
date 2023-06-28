const readline = require('readline');
const { extractDependenciesFromPackageJson } = require('./packageUtils');
const { startUpdateCheck } = require('./updateUtils');

async function testScanner(packageJsonPath) {
  const dependencies = extractDependenciesFromPackageJson(packageJsonPath);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    rl.question('Update all dependencies? (y/n) ', (response) => {
      resolve(response.toLowerCase());
    });
  });

  rl.close();

  const updateAll = answer === 'y';
  const updateCheckInterval = 24 * 60 * 60 * 1000;

  startUpdateCheck(updateCheckInterval, dependencies, packageJsonPath, updateAll);
}

testScanner('./package.json');

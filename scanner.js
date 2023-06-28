const readline = require('readline');
const { extractDependenciesFromPackageJson } = require('./packageUtils');
const { startUpdateCheck } = require('./updateUtils');

async function testScanner(packageJsonPath) {
  const dependencies = extractDependenciesFromPackageJson(packageJsonPath);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Do you want to receive daily reports? (y/n) ', (receiveReportsResponse) => {
    const receiveReports = receiveReportsResponse.toLowerCase() === 'y';

    if (receiveReports) {
      rl.question('Enter your email address: ', (email) => {
        rl.close();
        startUpdateCheck(24 * 60 * 60 * 1000, dependencies, packageJsonPath, email, receiveReports);
      });
    } else {
      rl.close();
      startUpdateCheck(24 * 60 * 60 * 1000, dependencies, packageJsonPath, null, receiveReports);
    }
  });
}

testScanner('./package.json');

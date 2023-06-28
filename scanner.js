const fs = require('fs');
const axios = require('axios');

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

function displayDependencies(dependencies) {
  console.log('Dependencies:');
  dependencies.forEach((dependency, index) => {
    console.log(`${index + 1}. ${dependency}`);
  });
}

async function checkForUpdates(dependencies, packageJsonPath) {
  console.log('Checking for updates...');

  const dependenciesToUpdate = [];

  // Iterate over each dependency
  for (const dependency of dependencies) {
    const packageName = dependency;

    try {
      // Make a request to the package registry API to get the latest version
      const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
      const latestVersion = response.data['dist-tags'].latest;

      // Compare the latest version with the installed version
      const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonData);
      const installedVersion = packageJson.dependencies[packageName] || packageJson.devDependencies[packageName];

      if (installedVersion && installedVersion !== latestVersion) {
        dependenciesToUpdate.push({
          packageName,
          installedVersion,
          latestVersion,
        });
      }
    } catch (error) {
      console.error(`Error fetching data for ${packageName}: ${error}`);
    }
  }

  // Output the dependencies that require an update
  if (dependenciesToUpdate.length > 0) {
    console.log('Dependencies that require an update:');
    dependenciesToUpdate.forEach((dependency, index) => {
      console.log(`${index + 1}. ${dependency.packageName}: Installed (${dependency.installedVersion}), Latest (${dependency.latestVersion})`);
    });
  } else {
    console.log('No dependencies require an update.');
  }
}

function startUpdateCheck(interval, dependencies, packageJsonPath) {
  // Start the initial check
  checkForUpdates(dependencies, packageJsonPath);

  // Schedule periodic checks at the specified interval (in milliseconds)
  setInterval(() => {
    checkForUpdates(dependencies, packageJsonPath);
  }, interval);
}

function testScanner(packageJsonPath) {
  // Extract dependencies from the package.json file
  const dependencies = extractDependenciesFromPackageJson(packageJsonPath);

  // Display the dependencies
  displayDependencies(dependencies);

  // Start periodic update checks (every 24 hours in this example)
  const updateCheckInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  startUpdateCheck(updateCheckInterval, dependencies, packageJsonPath);
}

// Run the test with the path to the package.json file
testScanner('./package.json');

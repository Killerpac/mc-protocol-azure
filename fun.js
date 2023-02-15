const msRestAzure = require('ms-rest-azure');
const ComputeManagementClient = require('azure-arm-compute');

const subscriptionId = 'c998bf3b-1bdb-431e-9433-223621b66b94';
const resourceGroupName = 'minecraft';
const vmName = 'sanic';


async function login() {
  const credentials = await msRestAzure.interactiveLogin({
    domain: '205b3f8b-f373-4eca-85b7-e74f105b93c2'
  })
  const computeClient = new ComputeManagementClient(credentials, subscriptionId);
  return computeClient;
}

async function startVM(computeClient) {
  try {
    await computeClient.virtualMachines.start(resourceGroupName, vmName);
    return 1
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function stopVM(computeClient) {
  try {
    const deallocateParams = {
      keepResources: [],
      skipShutdown: false
    };
    await computeClient.virtualMachines.deallocate(resourceGroupName, vmName, deallocateParams);
    return 1
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

//check if server is online
async function checkServer(serverIP, serverPort) {
  const statusResponse = await fetch(`https://api.mcsrvstat.us/2/${serverIP}:${serverPort}`);
  if (statusResponse.status === 404) {
    // If the server is offline or doesn't exist, return -1
    return -1;
  } else if (statusResponse.status === 200) {
    const statusData = await statusResponse.json();
    if (statusData.players === undefined) {
      // If the server is online but there are no players, return 0
      return 0;
    } else {
      // If the server is online and there are players, return the number of players
      return statusData.players.online;
    }
  }
}

//check if azure vm is running
async function checkVM(computeClient) {
  try {
    const vm = await computeClient.virtualMachines.get(resourceGroupName, vmName, { expand: 'instanceView' });
    const status = vm.instanceView.statuses[1].displayStatus;
    switch (status) {
      case 'VM running':
        return 1;
      case 'VM deallocated':
        return 2;
      case 'VM stopping':
      case 'VM deallocating':
      case 'VM starting':
        return -1;
      default:
        return 0;
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    return 0;
  }
}

//export functions
module.exports = {
  login,
  startVM,
  stopVM,
  checkServer,
  checkVM
}
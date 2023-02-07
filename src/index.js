
import { BigNumber, Contract, providers, ethers, utils } from "ethers";

//import { ethers2 } from "hardhat";

import clientReceiptAbi from "../artifacts/contracts/ClientReceipt.sol/ClientReceipt.json";

window.ethers = ethers;

var rawLogs, currentBlock, provider, providerOA, signer, account, clientReceiptAdd, clientReceiptContract, clientReceiptContractForLogs;

// REQUIRED
// Conectar con metamask
async function initSCsGoerli() {
    console.log("Conectandose a los contratos de Goerli");
    clientReceiptAdd = "0x42B5c67408a8F4246226e2B5f007Ea94E8208dBe";
    provider = new providers.Web3Provider(window.ethereum);
    clientReceiptContract = new Contract(clientReceiptAdd, clientReceiptAbi.abi, provider);
}

async function getCurrentBlock() {
    console.log(`Getting latest block number...`);

    currentBlock = await providerOA.getBlockNumber();
    console.log(`Latest block number: ${currentBlock}`);
}

// OPTIONAL
// No require conexion con Metamask
// Usar JSON-RPC
// Se pueden escuchar eventos de los contratos usando el provider con RPC
async function initSCsGoerliToReadLogs() {
    console.log("Conectandose a los contratos de Goerli para leer logs");
    clientReceiptAdd = "0x42B5c67408a8F4246226e2B5f007Ea94E8208dBe";

    var urlProvider = "https://eth-goerli.g.alchemy.com/v2/RWt4iDLIiQ6CwV8pVRWqyahDeRsKociK";
    providerOA = new providers.JsonRpcProvider(urlProvider);

    clientReceiptContractForLogs = new Contract(clientReceiptAdd, clientReceiptAbi.abi, providerOA);


}


async function getEvents() {
    console.log(`Getting the ClientReceipt events...`);

    /*
    const eventSignature = "DepositLog(address,string,uint256)";
    const eventTopic = ethers.utils.id(eventSignature); // Get the data hex string
    console.log("eventTopic :" + eventTopic);


    rawLogs = await providerOA.getLogs({
        address: clientReceiptAdd,
        topics: [eventTopic],
        fromBlock: currentBlock - 500,
        toBlock: currentBlock
    });
    */
    var myAddress = "0xbc2568ae7c08501b54d1f53b0a6fb149818fed9e";

    //await clientReceiptContractForLogs.filters.DepositLog(myAddress)

    //const filter = clientReceiptContractForLogs.filters.DepositLog();
    //const events = await clientReceiptContractForLogs.getLogs(filter);

    const filter = clientReceiptContractForLogs.filters.DepositLog();
    const events = await clientReceiptContractForLogs.queryFilter(filter);




}


async function setUpListeners() {
    // Connect to Metamask
    var bttn = document.getElementById("connect");

    bttn.addEventListener("click", async function () {
        if (window.ethereum) {
            [account] = await ethereum.request({
                method: "eth_requestAccounts",
            });
            console.log("Billetera metamask", account);

            provider = new providers.Web3Provider(window.ethereum);
            signer = provider.getSigner(account);
            window.signer = signer;

            console.log("conectado a metamask");

        }
    });


    var bttn = document.getElementById("getLogButton");
    bttn.addEventListener("click", async function () {

        //await getEvents();
        //await processLogsWithInterface();

        const filter = clientReceiptContractForLogs.filters.DepositLog();//null,null,10000);
        const events = await clientReceiptContractForLogs.queryFilter(filter);

        for (const event of events) {
            //console.log(`Event ${event.event} with args ${event.args}`);

            var ul = document.getElementById("allEventList");
            var li = document.createElement("li");
            var children = ul.children.length + 1
            li.setAttribute("id", "element" + children)
            li.appendChild(document.createTextNode("Event from " + event.args[0] + " to " + event.args[1] + " value " + event.args[2]));
            ul.appendChild(li)

        }


        /*
        const intrfc = new ethers.utils.Interface(clientReceiptAbi.abi);
        var log;
        events.forEach((log) => {
            console.log(`BEFORE PARSING:`);
            console.debug(log);
            console.log(`\n`);

            console.log(`AFTER PARSING:`);
            let parsedLog = intrfc.parseLog(log);
            console.debug(parsedLog);
            console.log('************************************************');
        })
        */


    });


    async function processLogsWithInterface() {
        //const abi: string = '[{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"punkIndex","type":"uint256"}],"name":"PunkTransfer","type":"event"}]';
        const intrfc = new ethers.utils.Interface(clientReceiptAbi.abi);
        var log;
        rawLogs.forEach((log) => {
            console.log(`BEFORE PARSING:`);
            console.debug(log);
            console.log(`\n`);

            console.log(`AFTER PARSING:`);
            let parsedLog = intrfc.parseLog(log);
            console.debug(parsedLog);
            console.log('************************************************');
        })
    }



    var bttn = document.getElementById("depositButton");
    bttn.addEventListener("click", async function () {

        //const ethAmount = "0.01";
        //const weiAmount = ethers.utils.parseEther(ethAmount);
        //const transaction = {
        //    value: weiAmount,
        //};
        var valorCajaTexto = document.getElementById("depositInput").value;
        var value = BigNumber.from(`${valorCajaTexto}00`);
        var tx = await clientReceiptContract
            .connect(signer)
            .deposit(valorCajaTexto, value);

        var response = await tx.wait();
        console.log(response);
        return response;

    });

}

async function setUpEventsContracts() {

    clientReceiptContract.on("DepositLog", (_from, _id, _value) => {
        console.log("from", _from);
        console.log("id", _id);
        console.log("value", _value);

        var ul = document.getElementById("eventList");
        var li = document.createElement("li");
        var children = ul.children.length + 1
        li.setAttribute("id", "element" + children)
        li.appendChild(document.createTextNode("Event from " + _from + " to " + _id + " value " + _value));
        ul.appendChild(li)

    });
}

async function setUp() {
    //init(window.ethereum);
    await initSCsGoerli();
    await initSCsGoerliToReadLogs();
    await getCurrentBlock();
    //await getLogs();
    await setUpListeners();
    await setUpEventsContracts();
}

setUp()
    .then()
    .catch((e) => console.log(e));

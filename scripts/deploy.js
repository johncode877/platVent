require("dotenv").config();
const { ethers } = require("hardhat");
const hre = require("hardhat");

var pEth = hre.ethers.utils.parseEther;

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
  printAddressNoUp,
} = require("../utils");

var alxiriSC, ordenCompraSC, catalogoSC;
const PRODUCT_ROLE = getRole("PRODUCT_ROLE");
const COURIER_ROLE = getRole("COURIER_ROLE");
const WORKFLOW_ROLE = getRole("WORKFLOW_ROLE");

const catalogoProductoAbi = require("../artifacts/contracts/CatalogoProducto.sol/CatalogoProducto.json");
const ordenCompraAbi = require("../artifacts/contracts/OrdenCompra.sol/OrdenCompra.json");

// 0xD9Aa1Cc658c925034856cad7c695e30d4b872059
async function deployAlxiriCoin() {
  console.log("Desplegando AlxiriCoin...");
  alxiriSC = await deploySCNoUp("AlxiriCoin", []);
  await printAddressNoUp("AlxiriCoin", alxiriSC.address);
  console.log("Verificando AlxiriCoin...");
  await verify(alxiriSC.address, "AlxiriCoin", []);
}

// 0x1188cE1C596E2c950100a2d18e0A58478314466c
async function deployCatalogoSC() {
  console.log("Desplegando CatalogoProducto ...");
  catalogoSC = await deploySC("CatalogoProducto", []);
  await printAddress("CatalogoProducto", catalogoSC.address);
  console.log("Verificando CatalogoProducto...");
  await verify(catalogoSC.address, "CatalogoProducto", []);
}

// 0xA5B7E62678b514e6394d9CDFC843528d80A3d3d8
async function deployOrdenCompraSC() {
  console.log("Desplegando OrdenCompra ...");
  ordenCompraSC = await deploySC("OrdenCompra", []);
  await printAddress("OrdenCompra", ordenCompraSC.address);
  console.log("Verificando OrdenCompra...");
  await verify(ordenCompraSC.address, "OrdenCompra", []);
}

async function initCatalogoSC() {
  console.log("Registrando productos en CatalogoProducto ...");
  var catalogoAdd = "0x1188cE1C596E2c950100a2d18e0A58478314466c";

  var [owner] = await hre.ethers.getSigners();
  var urlProvider = process.env.GOERLI_TESNET_URL;
  var provider = new ethers.providers.JsonRpcProvider(urlProvider);

  console.log("conectando a CatalogoProducto ...");
  var catalogoContract = new hre.ethers.Contract(catalogoAdd, catalogoProductoAbi.abi, provider);

  const producto1 = { nombre: "polo_manga_larga", descripcion: "polos de algodon de diferentes colores", total: 2000, estado: 0, precio: 1 };
  const producto2 = { nombre: "pijamas", descripcion: "pijamas de algodon", total: 5000, estado: 0, precio: 3 };
  const producto3 = { nombre: "sabanas", descripcion: "diversos colores y 200 hilos", total: 3500, estado: 0, precio: 5 };


  console.log("asignando rol para registrar productos");
  var tx = await catalogoContract.connect(owner).grantRole(PRODUCT_ROLE, owner.address);
  await tx.wait();

  console.log("registra producto1");
  var tx = await catalogoContract.connect(owner).agregarProducto(producto1);
  await tx.wait();

  console.log("registra producto2");
  var tx = await catalogoContract.connect(owner).agregarProducto(producto2);
  await tx.wait();

  console.log("registra producto3");
  var tx = await catalogoContract.connect(owner).agregarProducto(producto3);
  await tx.wait();

}


async function configOrdenCompraSC() {
  console.log("Configurando orden de compra ...");
  var catalogoAdd = "0x1188cE1C596E2c950100a2d18e0A58478314466c";
  var alxiriAdd = "0xD9Aa1Cc658c925034856cad7c695e30d4b872059";
  var ordenCompraAdd = "0xA5B7E62678b514e6394d9CDFC843528d80A3d3d8";

  var [owner] = await hre.ethers.getSigners();
  var urlProvider = process.env.GOERLI_TESNET_URL;
  var provider = new ethers.providers.JsonRpcProvider(urlProvider);

  var ordenCompraContract = new hre.ethers.Contract(ordenCompraAdd, ordenCompraAbi.abi, provider);

  console.log("configurando dirección criptomoneda ");
  var tx = await ordenCompraContract.connect(owner).setAlxiriAdd(alxiriAdd);
  await tx.wait();

  console.log("configurando dirección contrato catalogo ");
  var tx = await ordenCompraContract.connect(owner).setCatalogoAdd(catalogoAdd);
  await tx.wait();







}


async function mintearAlxiriCoin() {

  console.log("inicia minteo");
  var alxiriAdd = "0xD9Aa1Cc658c925034856cad7c695e30d4b872059";
  var AlxiriCoin = await hre.ethers.getContractFactory("AlxiriCoin");
  var alxiriCoin = AlxiriCoin.attach(alxiriAdd);

  var addLuis = "0xBFF17AbAe9cDb9a9476CC999802B59f2e7da5AeC";
  var addJohn = "0xbC2568Ae7c08501B54D1f53b0A6FB149818feD9E";

  var tx = await alxiriCoin.mint(addJohn, pEth("1000"));

  await tx.wait();

  console.log("finalizo minteo");
}

async function main() {

}


async function grantRoleUpdateProduct() {
  var [owner] = await hre.ethers.getSigners();
  var urlProvider = process.env.GOERLI_TESNET_URL;
  var provider = new ethers.providers.JsonRpcProvider(urlProvider);
  var ordenCompraAdd = "0xA5B7E62678b514e6394d9CDFC843528d80A3d3d8";
  var catalogoAdd = "0x1188cE1C596E2c950100a2d18e0A58478314466c";
  var catalogoContract = new hre.ethers.Contract(catalogoAdd, catalogoProductoAbi.abi, provider);

  console.log("asignando rol para registrar/actualizar productos al ordenCompra");
  var tx = await catalogoContract.connect(owner).grantRole(PRODUCT_ROLE, ordenCompraAdd);
  await tx.wait();
  console.log("Termino de asignar rol a OrdenCompra");
}


async function asignarRoldeWorkflowyCourierRole() {
  console.log("Iniciar asignarRoldeWorkflowyCourierRole");
  var ordenCompraAdd = "0xA5B7E62678b514e6394d9CDFC843528d80A3d3d8";
  var johnAdd = "0xbC2568Ae7c08501B54D1f53b0A6FB149818feD9E";
  var [owner] = await hre.ethers.getSigners();
  var urlProvider = process.env.GOERLI_TESNET_URL;
  var provider = new ethers.providers.JsonRpcProvider(urlProvider);

  console.log("conectando a OrdenCompra ...");
  var ordenCompraContract = new hre.ethers.Contract(ordenCompraAdd, ordenCompraAbi.abi, provider);

  // asignar rol a carl para que pueda atender el pedido  
  var tx = await ordenCompraContract.connect(owner).grantRole(WORKFLOW_ROLE,johnAdd);
  await tx.wait();

  tx = await ordenCompraContract.connect(owner).grantRole(COURIER_ROLE,johnAdd);
  await tx.wait();



  console.log("Termina asignarRoldeWorkflowyCourierRole");

}

async function asignarRoldeWorkflowyCourierRoleToLuis() {
  console.log("Iniciar asignarRoldeWorkflowyCourierRoleToLuis");
  var ordenCompraAdd = "0xA5B7E62678b514e6394d9CDFC843528d80A3d3d8";
  var luisAdd = "0xBFF17AbAe9cDb9a9476CC999802B59f2e7da5AeC";
  var [owner] = await hre.ethers.getSigners();
  var urlProvider = process.env.GOERLI_TESNET_URL;
  var provider = new ethers.providers.JsonRpcProvider(urlProvider);

  console.log("conectando a OrdenCompra ...");
  var ordenCompraContract = new hre.ethers.Contract(ordenCompraAdd, ordenCompraAbi.abi, provider);

  // asignar rol a carl para que pueda atender el pedido  
  var tx = await ordenCompraContract.connect(owner).grantRole(WORKFLOW_ROLE,luisAdd);
  await tx.wait();

  tx = await ordenCompraContract.connect(owner).grantRole(COURIER_ROLE,luisAdd);
  await tx.wait();


  console.log("Termina asignarRoldeWorkflowyCourierRoleToLuis");

}



async function updateOrdenCompra() {

  console.log("Actualizando OrdenCompra ......");

  var OrdenCompraProxyAdd = "0xA5B7E62678b514e6394d9CDFC843528d80A3d3d8";
  const OrdenCompraUpgrade = await hre.ethers.getContractFactory("OrdenCompra");

  var ordenCompraUpgrade = await upgrades.upgradeProxy(OrdenCompraProxyAdd, OrdenCompraUpgrade);
  try {
    await ordenCompraUpgrade.deployTransaction.wait(3);
  } catch (error) {
    console.log(error);
  }

  var implmntAddress = await upgrades.erc1967.getImplementationAddress(ordenCompraUpgrade.address);

  console.log("Proxy address OrdenCompra:", ordenCompraUpgrade.address);
  console.log("Implementation address OrdenCompraUpgrade:", implmntAddress);

  await hre.run("verify:verify", {
    address: implmntAddress,
    constructorArguments: [],
  });





}





//main()
//deployAlxiriCoin()
//deployCatalogoSC()
//deployOrdenCompraSC()
//initCatalogoSC()
//configOrdenCompraSC()
//verOrdenesCreadas()
//mintearAlxiriCoin()
//updateOrdenCompra()

//asignarRoldeWorkflowyCourierRole()
asignarRoldeWorkflowyCourierRoleToLuis()
  //atenderPedidoArea2()
  //atenderPedidoArea3()
  //entregaPedido()
  //grantRoleUpdateProduct()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

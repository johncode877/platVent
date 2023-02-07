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
  var catalogoAdd  = "0x1188cE1C596E2c950100a2d18e0A58478314466c";

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
  var catalogoAdd  = "0x1188cE1C596E2c950100a2d18e0A58478314466c";
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

async function main() {
  
}  


//deployAlxiriCoin()
//deployCatalogoSC()
//deployOrdenCompraSC()
//initCatalogoSC()
//configOrdenCompraSC()
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

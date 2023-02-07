const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");


const { getRole, deploySC, printAddress, deploySCNoUp, ex, pEth, printAddressNoUp } = require("../utils");

const PRODUCT_ROLE = getRole("PRODUCT_ROLE");
const WORKFLOW_ROLE = getRole("WORKFLOW_ROLE");
const COURIER_ROLE = getRole("COURIER_ROLE");

var makeBN = (num) => ethers.BigNumber.from(String(num));

describe("CATALOGO PRODUCTOS TESTING", function () {

  var alxiriSC, ordenCompraSC, catalogoSC, nftContract, publicSale, miPrimerToken, usdcSC;

  // el usuario alice pertenece al area ventas 
  // que se encarga de actualizar los precios/stock de productos

  var owner, gnosis, alice, bob, carl, deysi, routerUniSwap;

  before(async () => {
    [owner, gnosis, alice, bob, carl, deysi] = await ethers.getSigners();
  });

  async function deployAlxiriCoinSC() {
    console.log("Desplegando AlxiriCoin...");
    alxiriSC = await deploySCNoUp("AlxiriCoin", []);
    await printAddressNoUp("AlxiriCoin", alxiriSC.address);
  }


  async function deployCatalogoSC() {
    console.log("Desplegando CatalogoProducto ...");

    catalogoSC = await deploySC("CatalogoProducto", []);
    var implementation = await printAddress("CatalogoProducto", catalogoSC.address);

  }

  async function deployOrdenCompraSC() {
    console.log("Desplegando OrdenCompra ...");

    ordenCompraSC = await deploySC("OrdenCompra", []);
    var implementation = await printAddress("OrdenCompra", ordenCompraSC.address);


  }

  async function initCatalogoSC() {
    console.log("Inicializando Catalogo ...");

    const producto1 = { nombre: "polo_manga_larga", descripcion: "polos de algodon de diferentes colores", total: 2000, estado: 0, precio: 1 };
    const producto2 = { nombre: "pijamas", descripcion: "pijamas de algodon", total: 5000, estado: 0, precio: 3 };
    const producto3 = { nombre: "sabanas", descripcion: "diversos colores y 200 hilos", total: 3500, estado: 0, precio: 5 };

    await catalogoSC.grantRole(PRODUCT_ROLE, alice.address);
    // alice pertenece al area que controla el stock de productos 
    await catalogoSC.connect(alice).agregarProducto(producto1);
    await catalogoSC.connect(alice).agregarProducto(producto2);
    await catalogoSC.connect(alice).agregarProducto(producto3);

  }

  async function configOrdenCompraSC() {
    console.log("Config Orden de Compra ...");

    await ordenCompraSC.setAlxiriAdd(alxiriSC.address);

    await ordenCompraSC.setCatalogoAdd(catalogoSC.address);


  }


  describe("CATALOGO PRODUCTOS Smart Contract", () => {
    // Se publica el contrato antes de cada test
    beforeEach(async () => {
      await deployCatalogoSC();
    });


    it("No tiene permiso para agregar productos ", async () => {

      // se agrega producto por primera vez
      const producto = { nombre: "polo_manga_larga", descripcion: "polos de algodon de diferentes colores", total: 2000, estado: 0, precio: 1 };

      // se agrega producto
      await expect(catalogoSC.connect(alice).agregarProducto(producto))
        .to.revertedWith(
          `AccessControl: account ${alice.address.toLowerCase()} is missing role ${PRODUCT_ROLE}`
        );

    });

    it("Registra producto, si tiene permiso ", async () => {

      // se agrega producto por primera vez
      const producto = { nombre: "polo_manga_larga", descripcion: "polos de algodon de diferentes colores", total: 2000, estado: 0, precio: 1 };

      await catalogoSC.grantRole(PRODUCT_ROLE, alice.address);

      // se agrega producto
      await catalogoSC.connect(alice).agregarProducto(producto);

      let productos = await catalogoSC.connect(alice).obtenerTodos();
      expect(productos[0].nombre).to.equal("polo_manga_larga");
      expect(productos[0].precio).to.equal(1);

    });

    it("Actualiza producto, si tiene permiso ", async () => {

      // se agrega producto por primera vez
      const producto = { nombre: "polo_manga_larga", descripcion: "polos de algodon de diferentes colores", total: 2000, estado: 0, precio: 1 };

      await catalogoSC.grantRole(PRODUCT_ROLE, alice.address);

      // se agrega producto
      await catalogoSC.connect(alice).agregarProducto(producto);

      // actualiza producto
      await catalogoSC.connect(alice).actualizarProducto(producto.nombre, 500, 2);

      let productos = await catalogoSC.connect(alice).obtenerTodos();
      expect(productos[0].nombre).to.equal(producto.nombre);
      expect(productos[0].precio).to.equal(2);


    });


    it("No se puede registrar otra vez el mismo producto", async () => {
      // se agrega producto por primera vez
      const producto = { nombre: "polo_manga_larga", descripcion: "polos de algodon de diferentes colores", total: 2000, estado: 0, precio: 1 };

      await catalogoSC.grantRole(PRODUCT_ROLE, alice.address);

      // se agrega producto
      await catalogoSC.connect(alice).agregarProducto(producto);

      await expect(catalogoSC.connect(alice).agregarProducto(producto))
        .to.revertedWith('El producto ya esta registrado');
    });

    it("No se encuentra detalle del producto", async () => {
      var nombreProducto = "polo_manga_larga";
      await expect(catalogoSC.connect(alice).verDetalleProducto(nombreProducto))
        .to.revertedWith('El producto no existe o no esta registrado');
    });

    it("Se intenta registrar un producto con valor incorrecto", async () => {
      const producto = { nombre: "polo_manga_larga", descripcion: "polos de algodon de diferentes colores", total: 0, estado: 0, precio: 1 };

      await catalogoSC.grantRole(PRODUCT_ROLE, alice.address);

      await expect(catalogoSC.connect(alice).agregarProducto(producto))
        .to.revertedWith('Se debe ingresar un valor correcto para el parametro total');
    });

    it("Se intenta actualizar un producto con valor incorrecto y mantiene su valor actual", async () => {
      const producto = { nombre: "polo_manga_larga", descripcion: "polos de algodon de diferentes colores", total: 5000, estado: 0, precio: 1 };

      await catalogoSC.grantRole(PRODUCT_ROLE, alice.address);

      // se agrega producto
      await catalogoSC.connect(alice).agregarProducto(producto);

      const productoUpdate = { nombre: "polo_manga_larga", descripcion: "polos de algodon de diferentes colores", total: 0, estado: 0, precio: 1 };

      await catalogoSC.connect(alice).actualizarProducto(productoUpdate.nombre, productoUpdate.total, productoUpdate.precio);

      let productos = await catalogoSC.connect(alice).obtenerTodos();
      expect(productos[0].total).to.equal(producto.total);
      expect(productos[0].precio).to.equal(producto.precio);

    });

  });


  describe("ORDENES DE COMPRA Smart Contract", () => {
    // Se publica el contrato antes de cada test
    beforeEach(async () => {
      await deployAlxiriCoinSC();
      await deployCatalogoSC();
      await deployOrdenCompraSC();
      await initCatalogoSC();
      await configOrdenCompraSC();

    });

    it("No se puede crear Orden si no existe producto", async () => {

      // usuario tiene suficiente credito para comprar
      // acuñar tokens a favor de alice 
      await alxiriSC.mint(
        bob.address,
        ethers.utils.parseEther("100")
      );

      // usuario dio permisos a OrdenCompra para que use sus AlxiriTokens
      const approveOrdenCompra = alxiriSC.connect(bob).functions["approve(address,uint256)"];
      await approveOrdenCompra(ordenCompraSC.address, 100);

      await expect(ordenCompraSC.connect(bob).hacerPedido("polo", 100, "Lince/Av Arenales 1120"))
        .to.revertedWith('El producto no existe o no esta registrado');

    });

    it("No se puede crear Orden si no hay stock del producto", async () => {

      // usuario tiene suficiente credito para comprar
      // acuñar tokens a favor de alice 
      await alxiriSC.mint(
        bob.address,
        ethers.utils.parseEther("500")
      );

      // usuario dio permisos a OrdenCompra para que use sus AlxiriTokens
      const approveOrdenCompra = alxiriSC.connect(bob).functions["approve(address,uint256)"];
      await approveOrdenCompra(ordenCompraSC.address, 100);

      await expect(ordenCompraSC.connect(bob).hacerPedido("pijamas", 10000, "Lince/Av Arenales 1120"))
        .to.revertedWith('Cantidad invalida o no hay stock suficiente');
    });


    it("Usuario no tiene fondos suficientes para hacer la compra", async () => {

      // usuario tiene suficiente credito para comprar
      // acuñar tokens a favor de alice 
      await alxiriSC.mint(
        bob.address,
        ethers.utils.parseEther("10")
      );

      // usuario dio permisos a OrdenCompra para que use sus AlxiriTokens
      const approveOrdenCompra = alxiriSC.connect(bob).functions["approve(address,uint256)"];
      await approveOrdenCompra(ordenCompraSC.address, 10);

      // usuario debe tener 90 = 3 x 30 Alxiris 
      // para poder comprar las 30 pijamas
      await expect(ordenCompraSC.connect(bob).hacerPedido("pijamas", 30, "Lince/Av Arenales 1120"))
        .to.revertedWith('OrdenCompra: Not enough allowance');
    });



    it("OrdenCompra no tiene permisos para actualizar stock despues de compra", async () => {

      // usuario tiene suficiente credito para comprar
      // acuñar tokens a favor de alice 
      await alxiriSC.mint(
        bob.address,
        ethers.utils.parseEther("90")
      );

      // usuario dio permisos a OrdenCompra para que use sus AlxiriTokens
      const approveOrdenCompra = alxiriSC.connect(bob).functions["approve(address,uint256)"];
      await approveOrdenCompra(ordenCompraSC.address, 90);

      // usuario debe tener 90 = 3 x 30 Alxiris 
      // para poder comprar las 30 pijamas
      await expect(ordenCompraSC.connect(bob).hacerPedido("pijamas", 30, "Lince/Av Arenales 1120"))
        .to.revertedWith(`AccessControl: account ${ordenCompraSC.address.toLowerCase()} is missing role ${PRODUCT_ROLE}`);
    });


    it("Se emite evento RegistraPedido despues de hacer el pedido", async () => {

      // usuario tiene suficiente credito para comprar
      // acuñar tokens a favor de alice 
      await alxiriSC.mint(
        bob.address,
        ethers.utils.parseEther("90")
      );

      // usuario dio permisos a OrdenCompra para que use sus AlxiriTokens
      const approveOrdenCompra = alxiriSC.connect(bob).functions["approve(address,uint256)"];
      await approveOrdenCompra(ordenCompraSC.address, 90);

      // asignar rol PRODUCT_ROLE al contrato OrdenCompra en
      // CatalogoProducto 
      await catalogoSC.grantRole(PRODUCT_ROLE, ordenCompraSC.address);

      const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

      await expect(ordenCompraSC.connect(bob).hacerPedido("pijamas", 30, "Lince/Av Arenales 1120"))
        .to.emit(ordenCompraSC, "RegistraPedido")
        .withArgs(0, bob.address, anyValue, "pijamas", 30);

    });


    it("No se puede atender el pedido porque no tiene el permiso", async () => {

      // usuario tiene suficiente credito para comprar
      // acuñar tokens a favor de alice 
      await alxiriSC.mint(
        bob.address,
        ethers.utils.parseEther("90")
      );

      // usuario dio permisos a OrdenCompra para que use sus AlxiriTokens
      const approveOrdenCompra = alxiriSC.connect(bob).functions["approve(address,uint256)"];
      await approveOrdenCompra(ordenCompraSC.address, 90);

      // asignar rol PRODUCT_ROLE al contrato OrdenCompra en CatalogoProducto 
      await catalogoSC.grantRole(PRODUCT_ROLE, ordenCompraSC.address);

      // asignar rol a carl para que pueda atender el pedido  
      //await ordenCompraSC.grantRole(WORKFLOW_ROLE, carl.address);

      const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

      await expect(ordenCompraSC.connect(bob).hacerPedido("pijamas", 30, "Lince/Av Arenales 1120"))
        .to.emit(ordenCompraSC, "RegistraPedido")
        .withArgs(0, bob.address, anyValue, "pijamas", 30);

      await expect(ordenCompraSC.connect(carl).atenderPedido(0))
        .to.revertedWith(`AccessControl: account ${carl.address.toLowerCase()} is missing role ${WORKFLOW_ROLE}`);


    });


    it("Atiende el pedido y lo transfiere a otra area", async () => {

      // usuario tiene suficiente credito para comprar
      // acuñar tokens a favor de alice 
      await alxiriSC.mint(
        bob.address,
        ethers.utils.parseEther("90")
      );

      // usuario dio permisos a OrdenCompra para que use sus AlxiriTokens
      const approveOrdenCompra = alxiriSC.connect(bob).functions["approve(address,uint256)"];
      await approveOrdenCompra(ordenCompraSC.address, 90);

      // asignar rol PRODUCT_ROLE al contrato OrdenCompra en CatalogoProducto 
      await catalogoSC.grantRole(PRODUCT_ROLE, ordenCompraSC.address);

      // asignar rol a carl para que pueda atender el pedido  
      await ordenCompraSC.grantRole(WORKFLOW_ROLE, carl.address);

      const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

      await expect(ordenCompraSC.connect(bob).hacerPedido("pijamas", 30, "Lince/Av Arenales 1120"))
        .to.emit(ordenCompraSC, "RegistraPedido")
        .withArgs(0, bob.address, anyValue, "pijamas", 30);

      await expect(ordenCompraSC.connect(carl).atenderPedido(0))
        .to.emit(ordenCompraSC, "Envio")
        .withArgs(0, "corte", "acabados", bob.address, anyValue, "pijamas", 30);

    });


    it("No puede entregar el pedido porque no tiene permiso", async () => {

      // usuario tiene suficiente credito para comprar
      // acuñar tokens a favor de alice 
      await alxiriSC.mint(
        bob.address,
        ethers.utils.parseEther("90")
      );

      // usuario dio permisos a OrdenCompra para que use sus AlxiriTokens
      const approveOrdenCompra = alxiriSC.connect(bob).functions["approve(address,uint256)"];
      await approveOrdenCompra(ordenCompraSC.address, 90);

      // asignar rol PRODUCT_ROLE al contrato OrdenCompra en CatalogoProducto 
      await catalogoSC.grantRole(PRODUCT_ROLE, ordenCompraSC.address);

      // asignar rol a carl para que pueda atender el pedido  
      await ordenCompraSC.grantRole(WORKFLOW_ROLE, carl.address);

      const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

      await expect(ordenCompraSC.connect(bob).hacerPedido("pijamas", 30, "Lince/Av Arenales 1120"))
        .to.emit(ordenCompraSC, "RegistraPedido")
        .withArgs(0, bob.address, anyValue, "pijamas", 30);

      await expect(ordenCompraSC.connect(carl).atenderPedido(0))
        .to.emit(ordenCompraSC, "Envio")
        .withArgs(0, "corte", "acabados", bob.address, anyValue, "pijamas", 30);


      // deysi es del area de despacho quien puede entregar el producto al cliente
      // y llamar al metodo entragarCliente

      // asignar rol a deysi para que pueda entregar el pedido al cliente
      // llamando al metodo entragarCliente
      //await ordenCompraSC.grantRole(COURIER_ROLE, deysi.address);

      await expect(ordenCompraSC.connect(deysi).entregarCliente(0))
        .to.revertedWith(`AccessControl: account ${deysi.address.toLowerCase()} is missing role ${COURIER_ROLE}`);


    });

    it("No puede entregar el pedido porque aun no esta listo", async () => {

      // usuario tiene suficiente credito para comprar
      // acuñar tokens a favor de alice 
      await alxiriSC.mint(
        bob.address,
        ethers.utils.parseEther("90")
      );

      // usuario dio permisos a OrdenCompra para que use sus AlxiriTokens
      const approveOrdenCompra = alxiriSC.connect(bob).functions["approve(address,uint256)"];
      await approveOrdenCompra(ordenCompraSC.address, 90);

      // asignar rol PRODUCT_ROLE al contrato OrdenCompra en CatalogoProducto 
      await catalogoSC.grantRole(PRODUCT_ROLE, ordenCompraSC.address);

      // asignar rol a carl para que pueda atender el pedido  
      await ordenCompraSC.grantRole(WORKFLOW_ROLE, carl.address);

      const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

      await expect(ordenCompraSC.connect(bob).hacerPedido("pijamas", 30, "Lince/Av Arenales 1120"))
        .to.emit(ordenCompraSC, "RegistraPedido")
        .withArgs(0, bob.address, anyValue, "pijamas", 30);

      await expect(ordenCompraSC.connect(carl).atenderPedido(0))
        .to.emit(ordenCompraSC, "Envio")
        .withArgs(0, "corte", "acabados", bob.address, anyValue, "pijamas", 30);


      // deysi es del area de despacho quien puede entregar el producto al cliente
      // y llamar al metodo entragarCliente

      // asignar rol a deysi para que pueda entregar el pedido al cliente
      // llamando al metodo entragarCliente
      await ordenCompraSC.grantRole(COURIER_ROLE, deysi.address);

      await expect(ordenCompraSC.connect(deysi).entregarCliente(0))
        .to.revertedWith("Tracking: No se puede entregar la orden");


    });

    it("Se realiza la entrega del pedido al cliente", async () => {

      // usuario tiene suficiente credito para comprar
      // acuñar tokens a favor de alice 
      await alxiriSC.mint(
        bob.address,
        ethers.utils.parseEther("90")
      );

      // usuario dio permisos a OrdenCompra para que use sus AlxiriTokens
      const approveOrdenCompra = alxiriSC.connect(bob).functions["approve(address,uint256)"];
      await approveOrdenCompra(ordenCompraSC.address, 90);

      // asignar rol PRODUCT_ROLE al contrato OrdenCompra en CatalogoProducto 
      await catalogoSC.grantRole(PRODUCT_ROLE, ordenCompraSC.address);

      // asignar rol a carl para que pueda atender el pedido  
      await ordenCompraSC.grantRole(WORKFLOW_ROLE, carl.address);

      const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

      await expect(ordenCompraSC.connect(bob).hacerPedido("pijamas", 30, "Lince/Av Arenales 1120"))
        .to.emit(ordenCompraSC, "RegistraPedido")
        .withArgs(0, bob.address, anyValue, "pijamas", 30);

      await expect(ordenCompraSC.connect(carl).atenderPedido(0))
        .to.emit(ordenCompraSC, "Envio")
        .withArgs(0, "corte", "acabados", bob.address, anyValue, "pijamas", 30);

      await expect(ordenCompraSC.connect(carl).atenderPedido(0))
        .to.emit(ordenCompraSC, "Envio")
        .withArgs(0, "acabados", "despacho", bob.address, anyValue, "pijamas", 30);

      await expect(ordenCompraSC.connect(carl).atenderPedido(0))
        .to.emit(ordenCompraSC, "Envio")
        .withArgs(0, "despacho", "cliente", bob.address, anyValue, "pijamas", 30);


      // deysi es del area de despacho quien puede entregar el producto al cliente
      // y llamar al metodo entragarCliente

      // asignar rol a deysi para que pueda entregar el pedido al cliente
      // llamando al metodo entragarCliente
      await ordenCompraSC.grantRole(COURIER_ROLE, deysi.address);

      await expect(ordenCompraSC.connect(deysi).entregarCliente(0))
        .to.emit(ordenCompraSC, "Entrega")
        .withArgs(0, "despacho", "cliente", bob.address, anyValue, "pijamas", 30);


    });



    it("No se puede hacer seguimiento a una orden que no existe", async () => {

      await expect(ordenCompraSC.connect(bob).seguimiento(1))
        .to.revertedWith("Tracking: No existe la orden");


    });




  });

});

const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");




describe("ClientReceipt", function () {

  var clientReceipt;
  var owner, alice, bob, carl, deysi;

  before(async () => {
    [owner, alice, bob, carl, deysi] = await ethers.getSigners();
  });


  async function deployClientReceipt() {
    console.log("deployClientReceipt start ....")
    // Contracts are deployed using the first signer/account by default
    const ClientReceipt = await ethers.getContractFactory("ClientReceipt");
    clientReceipt = await ClientReceipt.deploy();

    console.log(" bob address: " + bob.address);

    

  }

  describe("Probando los metodos", function () {

    it("Se emite evento DepositLog despues de llamar al metodo deposit", async () => {
      // Se publica el contrato antes de cada test
      //beforeEach(async () => {
      await deployClientReceipt();
      //});

      await expect(clientReceipt.connect(bob).deposit("john", 300))
        .to.emit(clientReceipt, "DepositLog")
        .withArgs(bob.address, "john", 300);


    });

  });

});

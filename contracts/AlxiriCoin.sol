// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


/// @title Token para transacciones en la plataforma 
/// @author John Neil Sevillano Colina
/// @author Luis Gangas Vasquez
/// @author Segundo Humberto Melendez Fernandez
/// @notice Puedes usar este contrato para realizar pagos en la compra de productos 
/// @custom:experimental Este es un contrato a modo de prueba.
contract AlxiriCoin is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Alxiri Coin", "ALXC") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
      return 6;
    }
}
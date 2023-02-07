// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract CatalogoProducto is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PRODUCT_ROLE = keccak256("PRODUCT_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    struct ProductoDetail {
        string nombre;
        string descripcion;
        uint256 total;
        uint256 estado;
        uint256 precio;
    }

    mapping(string => uint256) precioProductos;
    ProductoDetail[] listaProductos;

    function validarExiste(
        string memory _nombre
    ) internal returns (uint256, uint256) {
        ProductoDetail memory item;
        for (uint256 i = 0; i < listaProductos.length; i++) {
            item = listaProductos[i];

            if (bytes(item.nombre).length == bytes(_nombre).length) {
                if (
                    keccak256(abi.encodePacked(item.nombre)) ==
                    keccak256(abi.encodePacked(_nombre))
                ) {
                    return (i, item.estado);
                }
            }
        }
        return (0, 0);
    }

    function agregarProducto(
        ProductoDetail memory _producto
    ) public onlyRole(PRODUCT_ROLE) returns (uint256) {
        uint256 indice;
        uint256 estado;

        (indice, estado) = validarExiste(_producto.nombre);
        require(
            (estado == 0) && (indice == 0),
            "El producto ya esta registrado"
        );

        require(
            _producto.total > 0,
            "Se debe ingresar un valor correcto para el parametro total"
        );

        require(
            _producto.precio > 0,
            "Se debe ingresar un valor correcto para el precio unitario"
        );

        indice = listaProductos.length;

        ProductoDetail memory item = ProductoDetail({
            nombre: _producto.nombre,
            descripcion: _producto.descripcion,
            total: _producto.total,
            estado: 1,
            precio: _producto.precio
        });

        //precioProductos[_producto.nombre] = _precio;
        listaProductos.push(item);

        return indice;
    }

    /************************************************************************
     *
     *   string memory _nombre: Nombre del producto
     *   uint256 _newTotal: Nuevo stock del producto
     *   uint256 _precio: Nuevo precio del producto
     *************************************************************************/
    function actualizarProducto(
        string memory _nombre,
        uint256 _newTotal,
        uint256 _precio
    ) public onlyRole(PRODUCT_ROLE) returns (bool) {
        uint256 indice;
        uint256 estado;
        (indice, estado) = validarExiste(_nombre);
        require(
            (estado > 0) && (indice >= 0),
            "El producto no esta registrado"
        );

        ProductoDetail memory item = listaProductos[indice];

        if (_newTotal > 0) {
            item.total = _newTotal;
        }

        if (_precio > 0) {
            item.precio = _precio;
        }

        listaProductos[indice] = item;

        return true;
    }

    /************************************************************************
     *
     *   string _id: identificador del producto
     *   uint256 _newTotal: Nuevo stock del producto
     *   uint256 _precio: Nuevo precio del producto
     *************************************************************************/
    function actualizarProductoPorId(
        uint256 _id,
        uint256 _newTotal,
        uint256 _precio
    ) public onlyRole(PRODUCT_ROLE) returns (bool) {
        ProductoDetail memory item = listaProductos[_id];

        require(item.estado > 0, "El producto no esta registrado");

        if (_newTotal > 0) {
            item.total = _newTotal;
        }

        if (_precio > 0) {
            item.precio = _precio;
        }

        listaProductos[_id] = item;
        return true;
    }

    function verDetalleProducto(
        string memory _nombre
    ) public returns (ProductoDetail memory) {
        uint256 indice;
        uint256 estado;
        (indice, estado) = validarExiste(_nombre);
        require(
            (estado > 0) && (indice >= 0),
            "El producto no existe o no esta registrado"
        );

        ProductoDetail memory item = listaProductos[indice];

        return item;
    }

    function verDetalleProductoPorId(
        uint256 _id
    ) public returns (ProductoDetail memory) {
        ProductoDetail memory item = listaProductos[_id];
        require(item.estado > 0, "El producto no existe o no esta registrado");
        return item;
    }

    function obtenerTodos() external view returns (ProductoDetail[] memory) {
        return listaProductos;
    }
}

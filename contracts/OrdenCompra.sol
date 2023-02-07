// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

struct ProductoDetail {
    string nombre;
    string descripcion;
    uint256 total;
    uint256 estado;
    uint256 precio;
}

interface ICatalogoProducto {
    function verDetalleProducto(
        string memory _nombre
    ) external returns (ProductoDetail memory productoDetail);

    function actualizarProducto(
        string memory _nombre,
        uint256 _newTotal,
        uint256 _precio
    ) external returns (bool);
}

contract OrdenCompra is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    struct Orden {
        string producto;
        uint256 cantidad;
        uint256 fecha;
        uint256 estado;
        address cliente;
        string envio;
    }

    struct Tracking {
        uint256 orden;
        string from;
        string to;
        uint256 arrival;
        uint256 departure;
        uint256 estado;
    }

    event RegistraPedido(
        uint256 _indice,
        address _cliente,
        uint256 _fechaPedido,
        string _producto,
        uint256 _cantidad
    );

    event Envio(
        uint256 _indice,
        string from,
        string to,
        address _cliente,
        uint256 arrival,
        string _producto,
        uint256 _cantidad
    );

    event Entrega(
        uint256 _indice,
        string from,
        string to,
        address _cliente,
        uint256 _arribo,
        string _producto,
        uint256 _cantidad
    );

    mapping(string => string) transferencias;
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant WORKFLOW_ROLE = keccak256("WORKFLOW_ROLE");
    bytes32 public constant COURIER_ROLE = keccak256("COURIER_ROLE");

    ICatalogoProducto catalogo;
    IERC20 alxiricoin;

    Orden[] listaOrdenes;
    Tracking[] listaTracking;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    string courier;

    function initialize() public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        courier = "despacho";
        transferencias["compras"] = "corte";
        transferencias["corte"] = "acabados";
        transferencias["acabados"] = courier;
        transferencias["despacho"] = "cliente";
    }

    // define la secuencia de areas/locaciones
    // por donde circulara el pedido antes
    // de ser enviado al cliente
    function setTransfer(string memory from, string memory to) external {
        transferencias[from] = to;
    }

    function setAlxiriAdd(address _alxiricoinAdd) external {
        alxiricoin = IERC20(_alxiricoinAdd);
    }

    function setCatalogoAdd(address _catalogoAdd) external {
        catalogo = ICatalogoProducto(_catalogoAdd);
    }

    // funcion para el cliente
    function hacerPedido(
        string memory _nombre,
        uint256 _cantidad,
        string memory envio
    ) external returns (uint256) {
        ProductoDetail memory item = catalogo.verDetalleProducto(_nombre);

        require(
            item.total >= _cantidad,
            "Cantidad invalida o no hay stock suficiente"
        );
        uint256 precioTotal = item.precio * _cantidad;
        uint256 allowance = alxiricoin.allowance(msg.sender, address(this));
        require(allowance >= precioTotal, "OrdenCompra: Not enough allowance");

        uint256 balance = alxiricoin.balanceOf(msg.sender);
        require(
            balance >= precioTotal,
            "OrdenCompra: Not enough token balance"
        );

        alxiricoin.transferFrom(msg.sender, address(this), precioTotal);

        uint256 _fecha = block.timestamp;

        uint256 indice = listaOrdenes.length;

        Orden memory orden = Orden({
            producto: item.nombre,
            cantidad: _cantidad,
            fecha: _fecha,
            estado: 1,
            cliente: msg.sender,
            envio: envio
        });

        item.total = item.total - _cantidad;

        bool resActProd = catalogo.actualizarProducto(
            item.nombre,
            item.total,
            0
        );
        require(resActProd, "CatalogoProducto: No se pudo actualizar");

        listaOrdenes.push(orden);

        // se registra la orden en el flujo de fabricacion del producto
        Tracking memory tracking = Tracking({
            orden: indice,
            from: "compras",
            to: "corte",
            arrival: 0,
            departure: _fecha,
            estado: 1
        });

        listaTracking.push(tracking);

        emit RegistraPedido(
            indice,
            msg.sender,
            _fecha,
            orden.producto,
            orden.cantidad
        );

        emit Envio(
            indice,
            tracking.from,
            tracking.to,
            orden.cliente,
            _fecha,
            orden.producto,
            orden.cantidad
        );

        return indice;
    }

    // funcion para el cliente
    function seguimiento(uint256 idOrden) external returns (Tracking memory) {
        require(listaTracking.length > idOrden, "Tracking: No existe la orden");
        Tracking memory tracking = listaTracking[idOrden];
        require(tracking.estado > 0, "Tracking: No existe la orden");
        return tracking;
    }

    // funcion para area interna
    function atenderPedido(
        uint256 idOrden
    ) external onlyRole(WORKFLOW_ROLE) returns (bool) {
        require(listaTracking.length > idOrden, "Tracking: No existe la orden");
        Tracking memory tracking = listaTracking[idOrden];
        require(tracking.estado > 0, "Tracking: No existe la orden");
        uint256 _fecha = block.timestamp;
        tracking.arrival = 0;
        tracking.departure = _fecha;
        tracking.from = tracking.to;
        tracking.to = transferencias[tracking.to];

        // actualizar movimiento del pedido
        listaTracking[idOrden] = tracking;
        Orden memory orden = listaOrdenes[idOrden];

        emit Envio(
            idOrden,
            tracking.from,
            tracking.to,
            orden.cliente,
            _fecha,
            orden.producto,
            orden.cantidad
        );

        return true;
    }

    function entregarCliente(
        uint256 idOrden
    ) external onlyRole(COURIER_ROLE) returns (bool) {
        require(listaTracking.length > idOrden, "Tracking: No existe la orden");
        Tracking memory tracking = listaTracking[idOrden];
        require(tracking.estado > 0, "Tracking: No existe la orden");

        bool evalEntrega = (bytes(tracking.from).length ==
            bytes(courier).length) &&
            (keccak256(abi.encodePacked(tracking.from)) ==
                keccak256(abi.encodePacked(courier)));

        require(evalEntrega, "Tracking: No se puede entregar la orden");

        uint256 _fecha = block.timestamp;
        tracking.arrival = _fecha;
        tracking.departure = 0;
        tracking.from = tracking.from;
        tracking.to = tracking.to;

        // actualizar movimiento del pedido
        listaTracking[idOrden] = tracking;
        Orden memory orden = listaOrdenes[idOrden];

        emit Entrega(
            idOrden,
            tracking.from,
            tracking.to,
            orden.cliente,
            _fecha,
            orden.producto,
            orden.cantidad
        );

        return true;
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
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

struct ProductDetail {
    string name;
    string description;
    uint256 total;
    uint256 status;
    uint256 price;
}

interface IProductCatalog {
    function verDetalleProducto(
        string memory _nombre
    ) external returns (ProductDetail memory ProductDetail);

    function updateProduct(
        string memory _name,
        uint256 _newTotal,
        uint256 _newPrice
    ) external returns (bool);
}

contract PurchaseOrder is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    struct Order {
        string product;
        uint256 quantity;
        uint256 date;
        uint256 status;
        address client;
        string location;
    }

    struct Tracking {
        uint256 order;
        string from;
        string to;
        uint256 arrival;
        uint256 departure;
        uint256 status;
    }

    event RegisterOrder(
        uint256 _index,
        address _client,
        uint256 _dateOrder,
        string _product,
        uint256 _quantity
    );

    event Shipping(
        uint256 _index,
        string from,
        string to,
        address _client,
        uint256 arrival,
        string _product,
        uint256 _quantity
    );

    event Delivery(
        uint256 _index,
        string from,
        string to,
        address _client,
        uint256 _arrive,
        string _product,
        uint256 _quantity
    );

    mapping(string => string) transfers;
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant WORKFLOW_ROLE = keccak256("WORKFLOW_ROLE");
    bytes32 public constant COURIER_ROLE = keccak256("COURIER_ROLE");

    IProductCatalog catalog;
    IERC20 alxiricoin;

    Order[] listOrders;
    Tracking[] listTracking;

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
        transfers["compras"] = "corte";
        transfers["corte"] = "acabados";
        transfers["acabados"] = courier;
        transfers["despacho"] = "cliente";
    }

    // define la secuencia de areas/locaciones
    // por donde circulara el pedido antes
    // de ser enviado al cliente
    function setTransfer(string memory from, string memory to) external {
        transfers[from] = to;
    }

    function setAlxiriAdd(address _alxiricoinAdd) external {
        alxiricoin = IERC20(_alxiricoinAdd);
    }

    function setCatalogAdd(address _catalogAdd) external {
        catalog = IProductCatalog(_catalogAdd);
    }

    // funcion para el cliente
    function placeOrder(
        string memory _name,
        uint256 _quantity,
        string memory location
    ) external returns (uint256) {
        ProductDetail memory item = catalog.verDetalleProducto(_name);

        require(
            item.total >= _quantity,
            "Cantidad invalida o no hay stock suficiente"
        );
        uint256 totalPrice = item.price * _quantity;
        uint256 allowance = alxiricoin.allowance(msg.sender, address(this));
        require(allowance >= totalPrice, "PurchaseOrder: Not enough allowance");

        uint256 balance = alxiricoin.balanceOf(msg.sender);
        require(
            balance >= totalPrice,
            "PurchaseOrder: Not enough token balance"
        );

        alxiricoin.transferFrom(msg.sender, address(this), totalPrice);

        uint256 _dateRegister = block.timestamp;

        uint256 index = listOrders.length;

        Order memory order = Order({
            product: item.name,
            quantity: _quantity,
            date: _dateRegister,
            status: 1,
            client: msg.sender,
            location: location
        });

        item.total = item.total - _quantity;

        bool resActProd = catalog.updateProduct(
            item.name,
            item.total,
            0
        );
        require(resActProd, "ProductCatalog: Didn't update");

        listOrders.push(order);

        // se registra la orden en el flujo de fabricacion del producto
        Tracking memory tracking = Tracking({
            order: index,
            from: "compras",
            to: "corte",
            arrival: 0,
            departure: _dateRegister,
            status: 1
        });

        listTracking.push(tracking);

        emit RegisterOrder(
            index,
            msg.sender,
            _dateRegister,
            order.product,
            order.quantity
        );

        emit Delivery(
            index,
            tracking.from,
            tracking.to,
            order.client,
            _dateRegister,
            order.product,
            order.quantity
        );

        return index;
    }

    // funcion para el cliente
    function seguimiento(
        uint256 idOrden
    ) public view returns (Tracking memory) {
        require(listTracking.length > idOrden, "Tracking: Order doesn't exists");
        Tracking memory tracking = listTracking[idOrden];
        return tracking;
    }

    // funcion para area interna
    function atenderPedido(
        uint256 idOrder
    ) external onlyRole(WORKFLOW_ROLE) returns (bool) {
        require(listTracking.length > idOrder, "Tracking: Order doesn't exists");
        Tracking memory tracking = listTracking[idOrder];
        require(tracking.status > 0, "Tracking: Order doesn't exists");
        uint256 _dateRegister = block.timestamp;
        tracking.arrival = 0;
        tracking.departure = _dateRegister;
        tracking.from = tracking.to;
        tracking.to = transfers[tracking.to];

        // actualizar movimiento del pedido
        listTracking[idOrder] = tracking;
        Order memory order = listOrders[idOrder];

        emit Delivery(
            idOrder,
            tracking.from,
            tracking.to,
            order.client,
            _dateRegister,
            order.product,
            order.quantity
        );

        return true;
    }

    function entregarCliente(
        uint256 idOrder
    ) external onlyRole(COURIER_ROLE) returns (bool) {
        require(listTracking.length > idOrder, "Tracking: Order doesn't exists");
        Tracking memory tracking = listTracking[idOrder];
        require(tracking.status > 0, "Tracking: Order doesn't exists");

        bool evalEntrega = (bytes(tracking.from).length ==
            bytes(courier).length) &&
            (keccak256(abi.encodePacked(tracking.from)) ==
                keccak256(abi.encodePacked(courier)));

        require(evalEntrega, "Tracking: No se puede entregar la orden");

        uint256 _dateRegister = block.timestamp;
        tracking.arrival = _dateRegister;
        tracking.departure = 0;

        // actualizar movimiento del pedido
        listTracking[idOrder] = tracking;
        Order memory order = listOrders[idOrder];

        emit Delivery(
            idOrder,
            tracking.from,
            tracking.to,
            order.client,
            _dateRegister,
            order.product,
            order.quantity
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

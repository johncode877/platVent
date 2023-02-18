// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ProductoCatalog is
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

    struct ProductDetail {
        string name;
        string description;
        uint256 total;
        uint256 status;
        uint256 price;
    }

    mapping(string => uint256) priceProducts;
    ProductDetail[] listProducts;

    function validateExist(
        string memory _name
    ) internal view returns (uint256, uint256) {
        ProductDetail memory item;
        for (uint256 i = 0; i < listProducts.length; i++) {
            item = listProducts[i];

            if (bytes(item.name).length == bytes(_name).length) {
                if (
                    keccak256(abi.encodePacked(item.name)) ==
                    keccak256(abi.encodePacked(_name))
                ) {
                    return (i, item.status);
                }
            }
        }
        return (0, 0);
    }

    function addProduct(
        ProductDetail memory _product
    ) public onlyRole(PRODUCT_ROLE) returns (uint256) {
        uint256 index;
        uint256 status;

        (index, status) = validateExist(_product.name);
        require((status == 0) && (index == 0), "Product already register");

        require(_product.total > 0, "Set a correct value for total");

        require(_product.price > 0, "Set a correct value for unit price");

        index = listProducts.length;

        ProductDetail memory item = ProductDetail({
            name: _product.name,
            description: _product.description,
            total: _product.total,
            status: 1,
            price: _product.price
        });

        listProducts.push(item);

        return index;
    }

    /************************************************************************
     *
     *   string memory _nombre: Nombre del producto
     *   uint256 _newTotal: Nuevo stock del producto
     *   uint256 _precio: Nuevo precio del producto
     *************************************************************************/
    function updateProduct(
        string memory _name,
        uint256 _newTotal,
        uint256 _newPrice
    ) public onlyRole(PRODUCT_ROLE) returns (bool) {
        uint256 index;
        uint256 status;
        (index, status) = validateExist(_name);
        require((status > 0) && (index >= 0), "Product doesn't register");

        ProductDetail memory item = listProducts[index];

        if (_newTotal > 0) {
            item.total = _newTotal;
        }

        if (_newPrice > 0) {
            item.price = _newPrice;
        }

        listProducts[index] = item;

        return true;
    }

    /************************************************************************
     *
     *   string _id: identificador del producto
     *   uint256 _newTotal: Nuevo stock del producto
     *   uint256 _precio: Nuevo precio del producto
     *************************************************************************/
    function updateProductById(
        uint256 _id,
        uint256 _newTotal,
        uint256 _newPrice
    ) public onlyRole(PRODUCT_ROLE) returns (bool) {
        uint256 lpSize = listProducts.length;

        require(_id < lpSize, "Product doesn't register");

        ProductDetail memory item = listProducts[_id];

        if (_newTotal > 0) {
            item.total = _newTotal;
        }

        if (_newPrice > 0) {
            item.price = _newPrice;
        }

        listProducts[_id] = item;
        return true;
    }

    function getProductDetail(
        string memory _name
    ) public view returns (ProductDetail memory) {
        uint256 index;
        uint256 status;
        (index, status) = validateExist(_name);
        require(
            (status > 0) && (index >= 0),
            "Product doesn't register or exist"
        );

        ProductDetail memory item = listProducts[index];

        return item;
    }

    function getProductDetailById(
        uint256 _id
    ) public view returns (ProductDetail memory) {
        uint256 lpSize = listProducts.length;

        require(_id < lpSize, "Product doesn't register or exist");

        ProductDetail memory item = listProducts[_id];

        return item;
    }

    function getAll() external view returns (ProductDetail[] memory) {
        return listProducts;
    }
}

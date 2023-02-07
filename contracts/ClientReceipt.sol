// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract ClientReceipt {
    event DepositLog(address _from, string _id, uint256 _value);

    function deposit(string memory _id, uint256 _value) public {
        emit DepositLog(msg.sender, _id, _value);
    }
}

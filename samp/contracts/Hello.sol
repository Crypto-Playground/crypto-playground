//SPDX-License-Identifier: who cares?
pragma solidity ^0.8.0;

contract Hello {
    string private message;

    constructor(string memory _message) {
        message = _message;
    }

    function hello() public view returns (string memory) {
        return message;
    }

    function setMessage(string memory _message) public {
        message = _message;
    }
}

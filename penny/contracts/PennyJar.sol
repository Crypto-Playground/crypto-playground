//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// import "hardhat/console.sol";

contract PennyJar {
    string private _message;

    constructor(string memory message) {
        // console.log("Deploying a PennyJar using message:", message);
        _message = message;
    }

    function getMessage() public view returns (string memory) {
        return _message;
    }

    function donatePennies(string memory newMessage) public payable {
        require(
            msg.value > 0,
            "You must add ETH to the penny jar when donating."
        );
        // console.log(
        //     "'%d' wei was donated; changing message from '%s' to '%s'",
        //     msg.value,
        //     _message,
        //     newMessage
        // );
        _message = newMessage;
    }

    function takePennies(uint256 amount) public {
        require(
            amount <= address(this).balance / 2,
            "Don't take more than half the pennies in the jar!"
        );
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Unable to hand you pennies; sorry!");
    }
}

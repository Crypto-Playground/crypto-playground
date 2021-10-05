//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// This is a pretty handy developer library. It exports something that
// lets you write lines of Solidity that look a *lot* like a standard
// javascript console.log() invocation. But it's Solidity. There's magic here;
// if you're running the hardhat dev tools, they intercept these logs and
// spit them out to console.
//
// import "hardhat/console.sol";

contract PennyJar {
    // This declares contract storage. That's right: this variable is stored
    // on the blockchain itself. Remember the SSTORE and SLOAD opcodes that
    // we saw in the Command-Line Crypto #01 video? Solidity sure is using them
    // here!
    string private _message;

    event PenniesDonated(address by, uint256 amount, string message);
    event PenniesTaken(address by, uint256 amount);

    constructor(string memory message) {
        // console.log("Deploying a PennyJar using message:", message);
        _message = message;
    }

    function getMessage() public view returns (string memory) {
        // 'view' means that we read data from the blockchain but don't modify;
        // eth_call can be used rather than eth_send*Transaction to invoke
        // our deployed contract's getMessage().
        return _message;
    }

    function donatePennies(string memory newMessage) public payable {
        // How much is being donated? Easy, the answer is in the msg.value
        // structure. Remember that CALLVALUE opcode from video #01? Solidity
        // compiles `msg.value` down to an invocation of CALLVALUE.
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
        emit PenniesDonated(msg.sender, msg.value, newMessage);
    }

    function takePennies(uint256 amount) public {
        // address(this) is the address of the deployed contract.
        // msg.sender is the address of the account that's calling us. That could
        // be an Externally Owned Account (aka a normal account), or it could
        // be a Contract Account. We try to cast it to payable(), which is a way
        // of saying that if you're going to take pennies, you must be able to
        // do something with the `msg.value` of the message we're about to send
        // you. Check out the compiled code to see how this works under the hood.
        require(
            amount <= address(this).balance / 2,
            "Don't take more than half the pennies in the jar!"
        );
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Unable to hand you pennies; sorry!");
        emit PenniesTaken(msg.sender, amount);
    }
}

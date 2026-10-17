// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title LaunchToken
/// @notice Fixed-supply ERC-20. The whole supply is minted once in the constructor
///         and there is no mint function, owner or admin afterwards.
contract LaunchToken is ERC20 {
    error ZeroSupply();
    error ZeroRecipient();

    constructor(string memory name_, string memory symbol_, uint256 totalSupply_, address recipient)
        ERC20(name_, symbol_)
    {
        if (totalSupply_ == 0) revert ZeroSupply();
        if (recipient == address(0)) revert ZeroRecipient();
        _mint(recipient, totalSupply_);
    }
}

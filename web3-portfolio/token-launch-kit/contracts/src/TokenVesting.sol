// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TokenVesting
/// @notice Linear vesting with a cliff for a single beneficiary.
///         Nothing is claimable before `cliff`. From `cliff` on, the vested amount is
///         `total * (now - start) / duration`, capped at `total` once `start + duration` passes.
///         `total` is every token the contract has ever held: current balance + already released.
/// @dev No owner, no revoke, no sweep. Only the beneficiary can move tokens out, and only
///      the vested part. Tokens sent here are locked under the same schedule.
contract TokenVesting is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint64 public immutable start;
    uint64 public immutable cliff;
    uint64 public immutable duration;

    uint256 public released;

    event Claimed(address indexed beneficiary, uint256 amount);

    error ZeroAddress();
    error ZeroDuration();
    error CliffAfterEnd();
    error NotBeneficiary();
    error NothingToClaim();

    /// @param cliffDuration seconds after `start_` before anything unlocks
    /// @param duration_ total vesting length in seconds, counted from `start_`
    constructor(IERC20 token_, address beneficiary_, uint64 start_, uint64 cliffDuration, uint64 duration_) {
        if (address(token_) == address(0) || beneficiary_ == address(0)) revert ZeroAddress();
        if (duration_ == 0) revert ZeroDuration();
        if (cliffDuration > duration_) revert CliffAfterEnd();
        token = token_;
        beneficiary = beneficiary_;
        start = start_;
        cliff = start_ + cliffDuration;
        duration = duration_;
    }

    function end() public view returns (uint256) {
        return uint256(start) + duration;
    }

    /// @notice Total tokens under this schedule (claimed + still held).
    function totalAllocation() public view returns (uint256) {
        return token.balanceOf(address(this)) + released;
    }

    /// @notice Amount vested at `timestamp`, including what was already claimed.
    function vestedAmount(uint64 timestamp) public view returns (uint256) {
        return _vestingSchedule(totalAllocation(), timestamp);
    }

    /// @notice Amount the beneficiary can claim right now.
    function claimable() public view returns (uint256) {
        return vestedAmount(uint64(block.timestamp)) - released;
    }

    function claim() external nonReentrant returns (uint256 amount) {
        if (msg.sender != beneficiary) revert NotBeneficiary();
        amount = claimable();
        if (amount == 0) revert NothingToClaim();
        released += amount; // effects before the external call
        emit Claimed(beneficiary, amount);
        token.safeTransfer(beneficiary, amount);
    }

    function _vestingSchedule(uint256 total, uint64 timestamp) internal view returns (uint256) {
        if (timestamp < cliff) return 0;
        if (timestamp >= end()) return total;
        return (total * (timestamp - start)) / duration; // rounds down, never over-releases
    }
}

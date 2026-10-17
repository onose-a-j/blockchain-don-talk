// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {LaunchToken} from "../../src/LaunchToken.sol";
import {TokenVesting} from "../../src/TokenVesting.sol";

/// Random actors warp time and try to claim; only the beneficiary may succeed.
contract VestingHandler is Test {
    LaunchToken public token;
    TokenVesting public vesting;
    address public team;
    uint256 public claimedByTeam;

    constructor(LaunchToken t, TokenVesting v, address b) {
        token = t;
        vesting = v;
        team = b;
    }

    function warp(uint32 secs) external {
        vm.warp(block.timestamp + bound(secs, 0, 30 days));
    }

    function claimAsTeam() external {
        if (vesting.claimable() == 0) return;
        vm.prank(team);
        claimedByTeam += vesting.claim();
    }

    function claimAsStranger(address who) external {
        if (who == team) return;
        vm.prank(who);
        try vesting.claim() {
            revert("stranger claimed");
        } catch {}
    }
}

contract VestingInvariantTest is Test {
    LaunchToken token;
    TokenVesting vesting;
    VestingHandler handler;
    address team = makeAddr("team");
    uint256 constant ALLOCATION = 200_000_000 ether;

    function setUp() public {
        vm.warp(1_700_000_000);
        token = new LaunchToken("Launch Kit Token", "LKT", 1_000_000_000 ether, address(this));
        vesting = new TokenVesting(token, team, uint64(block.timestamp), 90 days, 365 days);
        token.transfer(address(vesting), ALLOCATION);
        handler = new VestingHandler(token, vesting, team);
        targetContract(address(handler));
    }

    function invariant_ConservesTokens() public view {
        assertEq(token.balanceOf(team) + token.balanceOf(address(vesting)), ALLOCATION);
    }

    function invariant_ReleasedNeverExceedsVested() public view {
        assertLe(vesting.released(), vesting.vestedAmount(uint64(block.timestamp)));
        assertEq(vesting.released(), handler.claimedByTeam());
        assertEq(token.balanceOf(team), vesting.released());
    }

    function invariant_NothingReleasedBeforeCliff() public view {
        if (block.timestamp < vesting.cliff()) assertEq(vesting.released(), 0);
    }
}

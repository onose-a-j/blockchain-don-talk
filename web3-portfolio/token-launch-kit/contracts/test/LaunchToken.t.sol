// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {LaunchToken} from "../src/LaunchToken.sol";

contract LaunchTokenTest is Test {
    LaunchToken token;
    address treasury = makeAddr("treasury");
    uint256 constant SUPPLY = 1_000_000_000 ether;

    function setUp() public {
        token = new LaunchToken("Launch Kit Token", "LKT", SUPPLY, treasury);
    }

    function test_Metadata() public view {
        assertEq(token.name(), "Launch Kit Token");
        assertEq(token.symbol(), "LKT");
        assertEq(token.decimals(), 18);
    }

    function test_WholeSupplyMintedToRecipient() public view {
        assertEq(token.totalSupply(), SUPPLY);
        assertEq(token.balanceOf(treasury), SUPPLY);
    }

    function test_RevertWhen_ZeroSupply() public {
        vm.expectRevert(LaunchToken.ZeroSupply.selector);
        new LaunchToken("X", "X", 0, treasury);
    }

    function test_RevertWhen_ZeroRecipient() public {
        vm.expectRevert(LaunchToken.ZeroRecipient.selector);
        new LaunchToken("X", "X", 1, address(0));
    }

    /// There is no mint entry point after deploy: common mint signatures all fail.
    function test_NoMintFunctionExists() public {
        bytes[3] memory calls = [
            abi.encodeWithSignature("mint(address,uint256)", address(this), 1),
            abi.encodeWithSignature("mint(uint256)", 1),
            abi.encodeWithSignature("_mint(address,uint256)", address(this), 1)
        ];
        for (uint256 i; i < calls.length; ++i) {
            (bool ok,) = address(token).call(calls[i]);
            assertFalse(ok);
        }
        assertEq(token.totalSupply(), SUPPLY);
    }

    function testFuzz_TransfersNeverChangeSupply(address to, uint256 amount) public {
        vm.assume(to != address(0) && to != treasury);
        amount = bound(amount, 0, SUPPLY);
        vm.prank(treasury);
        token.transfer(to, amount);
        assertEq(token.balanceOf(to), amount);
        assertEq(token.balanceOf(treasury), SUPPLY - amount);
        assertEq(token.totalSupply(), SUPPLY);
    }

    function testFuzz_RevertWhen_TransferMoreThanBalance(uint256 amount) public {
        amount = bound(amount, SUPPLY + 1, type(uint256).max);
        vm.prank(treasury);
        vm.expectRevert();
        token.transfer(address(1), amount);
    }
}

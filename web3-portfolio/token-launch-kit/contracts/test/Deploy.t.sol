// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {LaunchToken} from "../src/LaunchToken.sol";
import {TokenVesting} from "../src/TokenVesting.sol";

contract DeployScriptTest is Test {
    function setUp() public {
        // anvil's first default key; never holds real funds
        vm.setEnv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    }

    function test_DeployWiresEverything() public {
        vm.chainId(84532);
        (LaunchToken token, TokenVesting vesting) = new Deploy().run();
        uint256 supply = 1_000_000_000 ether;
        assertEq(token.totalSupply(), supply);
        assertEq(token.balanceOf(address(vesting)), supply * 2000 / 10_000);
        assertEq(address(vesting.token()), address(token));
        assertEq(vesting.cliff() - vesting.start(), 10 minutes);
    }

    function test_RevertWhen_NotTestnet() public {
        vm.chainId(8453); // Base mainnet
        Deploy d = new Deploy();
        vm.expectRevert(abi.encodeWithSelector(Deploy.WrongChain.selector, 8453));
        d.run();
    }
}

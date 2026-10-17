// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {LaunchToken} from "../src/LaunchToken.sol";
import {TokenVesting} from "../src/TokenVesting.sol";

/// @notice Deploys the token and a team vesting contract, then funds the vesting contract.
/// Testnet only: refuses to run on any chain other than Base Sepolia (84532) or a local anvil (31337).
///
/// Env (all optional except PRIVATE_KEY):
///   TOKEN_NAME, TOKEN_SYMBOL, TOTAL_SUPPLY (whole tokens), TEAM_BENEFICIARY,
///   TEAM_ALLOCATION_BPS (default 2000 = 20%), CLIFF_SECONDS, VESTING_SECONDS
contract Deploy is Script {
    error WrongChain(uint256 chainId);

    function run() external returns (LaunchToken token, TokenVesting vesting) {
        if (block.chainid != 84532 && block.chainid != 31337) revert WrongChain(block.chainid);

        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        string memory name = vm.envOr("TOKEN_NAME", string("Launch Kit Demo"));
        string memory symbol = vm.envOr("TOKEN_SYMBOL", string("LKD"));
        uint256 supply = vm.envOr("TOTAL_SUPPLY", uint256(1_000_000_000)) * 1e18;
        address beneficiary = vm.envOr("TEAM_BENEFICIARY", deployer);
        uint256 teamBps = vm.envOr("TEAM_ALLOCATION_BPS", uint256(2000));
        // Short demo schedule so the claim flow is visible: 10-minute cliff, 30-day linear vest.
        uint64 cliff = uint64(vm.envOr("CLIFF_SECONDS", uint256(10 minutes)));
        uint64 duration = uint64(vm.envOr("VESTING_SECONDS", uint256(30 days)));

        vm.startBroadcast(pk);
        token = new LaunchToken(name, symbol, supply, deployer);
        vesting = new TokenVesting(token, beneficiary, uint64(block.timestamp), cliff, duration);
        token.transfer(address(vesting), supply * teamBps / 10_000);
        vm.stopBroadcast();

        console.log("LaunchToken:  ", address(token));
        console.log("TokenVesting: ", address(vesting));
        console.log("Beneficiary:  ", beneficiary);
    }
}

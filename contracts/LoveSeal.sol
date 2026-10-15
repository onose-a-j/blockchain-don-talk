// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LoveSeal — seal a "Blockchain Don Talk" result on-chain
/// @notice Only the keccak256 hash of the two names is stored, never the names.
///         The score is derived on-chain from the hash, so nobody can fake it.
contract LoveSeal {
    /// @dev pairHash = keccak256(bytes("name1|name2")), names lowercased, trimmed and sorted.
    mapping(bytes32 => uint256) public sealCount;
    uint256 public totalSeals;

    event Sealed(bytes32 indexed pairHash, address indexed sealer, uint8 score, uint256 count);

    /// @notice Same formula the website uses: first two bytes of the hash, mod 101.
    function scoreOf(bytes32 pairHash) public pure returns (uint8) {
        return uint8(uint16(bytes2(pairHash)) % 101);
    }

    function seal(bytes32 pairHash) external {
        uint256 count = ++sealCount[pairHash];
        totalSeals++;
        emit Sealed(pairHash, msg.sender, scoreOf(pairHash), count);
    }
}

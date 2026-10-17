// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {LaunchToken} from "../src/LaunchToken.sol";
import {TokenVesting} from "../src/TokenVesting.sol";

contract TokenVestingTest is Test {
    LaunchToken token;
    TokenVesting vesting;

    address team = makeAddr("team");
    address attacker = makeAddr("attacker");

    uint256 constant SUPPLY = 1_000_000_000 ether;
    uint256 constant ALLOCATION = 200_000_000 ether;
    uint64 constant START = 1_700_000_000;
    uint64 constant CLIFF = 90 days;
    uint64 constant DURATION = 365 days;

    function setUp() public {
        vm.warp(START);
        token = new LaunchToken("Launch Kit Token", "LKT", SUPPLY, address(this));
        vesting = new TokenVesting(token, team, START, CLIFF, DURATION);
        token.transfer(address(vesting), ALLOCATION);
    }

    // ---------------------------------------------------------------- constructor

    function test_Constructor() public view {
        assertEq(address(vesting.token()), address(token));
        assertEq(vesting.beneficiary(), team);
        assertEq(vesting.start(), START);
        assertEq(vesting.cliff(), START + CLIFF);
        assertEq(vesting.end(), START + DURATION);
        assertEq(vesting.totalAllocation(), ALLOCATION);
    }

    function test_RevertWhen_ZeroToken() public {
        vm.expectRevert(TokenVesting.ZeroAddress.selector);
        new TokenVesting(IERC20(address(0)), team, START, CLIFF, DURATION);
    }

    function test_RevertWhen_ZeroBeneficiary() public {
        vm.expectRevert(TokenVesting.ZeroAddress.selector);
        new TokenVesting(token, address(0), START, CLIFF, DURATION);
    }

    function test_RevertWhen_ZeroDuration() public {
        vm.expectRevert(TokenVesting.ZeroDuration.selector);
        new TokenVesting(token, team, START, 0, 0);
    }

    function test_RevertWhen_CliffAfterEnd() public {
        vm.expectRevert(TokenVesting.CliffAfterEnd.selector);
        new TokenVesting(token, team, START, DURATION + 1, DURATION);
    }

    // ---------------------------------------------------------------- schedule points

    function test_NothingClaimableBeforeCliff() public {
        vm.warp(START + CLIFF - 1);
        assertEq(vesting.claimable(), 0);
    }

    function test_AtCliffExactAmountUnlocks() public {
        vm.warp(START + CLIFF);
        assertEq(vesting.claimable(), ALLOCATION * CLIFF / DURATION);
    }

    function test_HalfwayHalfUnlocks() public {
        vm.warp(START + DURATION / 2);
        assertEq(vesting.claimable(), ALLOCATION / 2);
    }

    function test_AfterEndEverythingUnlocks() public {
        vm.warp(START + DURATION + 1000 days);
        assertEq(vesting.claimable(), ALLOCATION);
        vm.prank(team);
        vesting.claim();
        assertEq(token.balanceOf(team), ALLOCATION);
        assertEq(token.balanceOf(address(vesting)), 0);
    }

    function test_ClaimEmitsEvent() public {
        vm.warp(START + DURATION);
        vm.expectEmit(true, false, false, true, address(vesting));
        emit TokenVesting.Claimed(team, ALLOCATION);
        vm.prank(team);
        vesting.claim();
    }

    function test_VestingCanStartInTheFuture() public {
        TokenVesting later = new TokenVesting(token, team, START + 30 days, 0, DURATION);
        token.transfer(address(later), 1000 ether);
        assertEq(later.claimable(), 0); // before start
        vm.warp(START + 30 days + DURATION);
        assertEq(later.claimable(), 1000 ether);
    }

    // ---------------------------------------------------------------- attack attempts

    function test_RevertWhen_ClaimingBeforeCliff() public {
        vm.warp(START + CLIFF - 1);
        vm.prank(team);
        vm.expectRevert(TokenVesting.NothingToClaim.selector);
        vesting.claim();
    }

    function test_RevertWhen_ClaimingBeforeStart() public {
        TokenVesting later = new TokenVesting(token, team, START + 30 days, 0, DURATION);
        token.transfer(address(later), 1000 ether);
        vm.prank(team);
        vm.expectRevert(TokenVesting.NothingToClaim.selector);
        later.claim();
    }

    function test_RevertWhen_ClaimingTwiceInSameBlock() public {
        vm.warp(START + CLIFF + 10 days);
        vm.startPrank(team);
        vesting.claim();
        vm.expectRevert(TokenVesting.NothingToClaim.selector);
        vesting.claim();
        vm.stopPrank();
    }

    function test_RevertWhen_ClaimingTwiceAfterEnd() public {
        vm.warp(START + DURATION);
        vm.startPrank(team);
        vesting.claim();
        vm.warp(START + DURATION + 365 days);
        vm.expectRevert(TokenVesting.NothingToClaim.selector);
        vesting.claim();
        vm.stopPrank();
        assertEq(token.balanceOf(team), ALLOCATION);
    }

    function testFuzz_RevertWhen_NonBeneficiaryClaims(address caller, uint64 t) public {
        vm.assume(caller != team);
        vm.warp(bound(t, START, START + DURATION * 2));
        vm.prank(caller);
        vm.expectRevert(TokenVesting.NotBeneficiary.selector);
        vesting.claim();
    }

    function test_NoOwnerCanSweepTokens() public {
        // There is no admin path out: common sweep/withdraw/revoke selectors all fail.
        bytes[4] memory calls = [
            abi.encodeWithSignature("withdraw()"),
            abi.encodeWithSignature("revoke()"),
            abi.encodeWithSignature("sweep(address)", attacker),
            abi.encodeWithSignature("transferOwnership(address)", attacker)
        ];
        for (uint256 i; i < calls.length; ++i) {
            vm.prank(address(this)); // deployer
            (bool ok,) = address(vesting).call(calls[i]);
            assertFalse(ok);
        }
        assertEq(token.balanceOf(address(vesting)), ALLOCATION);
    }

    function test_DonationDoesNotUnlockEarly() public {
        vm.warp(START + CLIFF - 1);
        token.transfer(address(vesting), 1_000_000 ether);
        assertEq(vesting.claimable(), 0);
    }

    function test_TopUpFollowsSameSchedule() public {
        vm.warp(START + DURATION / 4);
        vm.prank(team);
        uint256 first = vesting.claim();
        assertEq(first, ALLOCATION / 4);

        token.transfer(address(vesting), ALLOCATION); // allocation doubles
        assertEq(vesting.totalAllocation(), 2 * ALLOCATION);
        // a quarter of the new total minus what was already claimed
        assertEq(vesting.claimable(), 2 * ALLOCATION / 4 - first);

        vm.warp(START + DURATION);
        vm.prank(team);
        vesting.claim();
        assertEq(token.balanceOf(team), 2 * ALLOCATION);
    }

    function test_ReentrantTokenCannotDoubleClaim() public {
        ReentrantToken evil = new ReentrantToken();
        TokenVesting v = new TokenVesting(IERC20(address(evil)), address(evil), START, 0, DURATION);
        evil.mintTo(address(v), 1000 ether);
        evil.arm(v);
        vm.warp(START + DURATION);
        // evil token is the beneficiary and re-enters claim() inside transfer()
        vm.prank(address(evil));
        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        v.claim();
        assertEq(v.released(), 0);
        assertEq(evil.balanceOf(address(v)), 1000 ether);
    }

    // ---------------------------------------------------------------- fuzz: vesting math

    function testFuzz_VestedAmountMatchesSchedule(uint256 t) public view {
        t = bound(t, 0, uint256(START) + DURATION * 3);
        uint256 vested = vesting.vestedAmount(uint64(t));
        if (t < START + CLIFF) {
            assertEq(vested, 0, "before cliff");
        } else if (t >= START + DURATION) {
            assertEq(vested, ALLOCATION, "after end");
        } else {
            assertEq(vested, ALLOCATION * (t - START) / DURATION, "linear");
            assertLe(vested, ALLOCATION);
        }
    }

    function testFuzz_VestingIsMonotonic(uint256 a, uint256 b) public view {
        a = bound(a, START, START + DURATION * 2);
        b = bound(b, a, START + DURATION * 2);
        assertLe(vesting.vestedAmount(uint64(a)), vesting.vestedAmount(uint64(b)));
    }

    function testFuzz_AnySchedule_AllocationAndTimes(uint128 alloc, uint32 cliff, uint32 duration, uint64 t) public {
        duration = uint32(bound(duration, 1, 10 * 365 days));
        cliff = uint32(bound(cliff, 0, duration));
        alloc = uint128(bound(alloc, 1, SUPPLY - ALLOCATION));
        TokenVesting v = new TokenVesting(token, team, START, cliff, duration);
        token.transfer(address(v), alloc);

        uint256 when = bound(t, START, uint256(START) + duration * 2);
        vm.warp(when);
        uint256 c = v.claimable();
        assertLe(c, alloc);
        if (when < START + cliff) assertEq(c, 0);
        if (when >= uint256(START) + duration) assertEq(c, alloc);
    }

    function testFuzz_SequentialClaimsNeverExceedAllocation(uint256 t1, uint256 t2, uint256 t3) public {
        t1 = bound(t1, START + CLIFF, START + DURATION * 2);
        t2 = bound(t2, t1, START + DURATION * 2);
        t3 = bound(t3, t2, START + DURATION * 2);
        uint256[3] memory ts = [t1, t2, t3];
        vm.startPrank(team);
        for (uint256 i; i < 3; ++i) {
            vm.warp(ts[i]);
            if (vesting.claimable() > 0) vesting.claim();
            assertEq(token.balanceOf(team), vesting.vestedAmount(uint64(ts[i])));
            assertLe(token.balanceOf(team), ALLOCATION);
        }
        vm.stopPrank();
        assertEq(token.balanceOf(team) + token.balanceOf(address(vesting)), ALLOCATION);
    }

    function testFuzz_ClaimEveryDayEndsWithFullAllocation(uint8 stepDays) public {
        uint256 step = bound(stepDays, 1, 60) * 1 days;
        vm.startPrank(team);
        for (uint256 t = START + CLIFF; t < START + DURATION; t += step) {
            vm.warp(t);
            if (vesting.claimable() > 0) vesting.claim();
        }
        vm.warp(START + DURATION);
        if (vesting.claimable() > 0) vesting.claim();
        vm.stopPrank();
        assertEq(token.balanceOf(team), ALLOCATION); // rounding dust is not lost
        assertEq(vesting.claimable(), 0);
    }
}

/// Token that re-enters TokenVesting.claim() from inside transfer().
contract ReentrantToken is ERC20 {
    TokenVesting target;

    constructor() ERC20("Evil", "EVIL") {}

    function mintTo(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function arm(TokenVesting t) external {
        target = t;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (address(target) != address(0)) target.claim();
        return super.transfer(to, amount);
    }
}

pragma solidity 0.5.16;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/VBets.sol";

contract TestVBets {
	VBets vbets = VBets(DeployedAddresses.VBets());

	function testBetInitialized() public {
		VBet bet = VBet(vbets.createBet("test", 1000, 10, 20, 3));
		uint256 state = uint256(bet.getState());
		Assert.equal(state, 0, "Nay!");
	}

	function testCreateMultipleBets() public {
		vbets.createBet("test1", 10, 1, 1, 1);
		vbets.createBet("test2", 10, 10, 1, 1);
		vbets.createBet("test3", 10, 10, 1, 1);

		Assert.equal(vbets.getBetsLength(), 4, "Didn't create exact number of bets!");
	}

	function testBetMultipleTimes() public {
		VBet bet = VBet(vbets.bets(0));
		bet.betFor(1000);
		bet.betAgainst(1000);
		bet.betFor(1000);

		Assert.equal(uint256(bet.getBettersForLength() + bet.getBettersAgainstLength()), 1, "Betted more times than allowed!");
	}
}


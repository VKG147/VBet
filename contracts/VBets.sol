pragma solidity 0.5.16;

contract VBets {
    address[] public bets;
    function getBetsLength() external view returns (uint256) {
        return bets.length;
    }

    address payable public owner;
    
    constructor() public payable {
        owner = msg.sender;
    }
    
    function createBet(string memory description, uint256 voteAmountInWei, uint256 waitingTime, uint256 expirationTime, uint256 minBetterCount) public returns (address) {
        VBet bet = new VBet(description, voteAmountInWei, waitingTime, expirationTime, minBetterCount, owner);
        bets.push(address(bet));
        return address(bet);
    }
}

contract VBet {
    uint256 public deployTime = block.timestamp;
    
    // All possible states of contract
    enum State { Initiated, Pending, ForWon, AgainstWon, Aborted }

    // Address that receives a small percentage of all bets
    address payable private taxAddress;
    uint128 constant tax = 10; // x / 1000 * voteAmount goes to taxAddress
    
    // Voters addresses (for fund transfering)
    address payable[] private bettersForAddresses;
    mapping (address => bool) private bettersFor;
    function getBettersForLength() external view returns (uint256) {
        return bettersForAddresses.length;
    }
    
    address payable[] private bettersAgainstAddresses;
    mapping (address => bool) private bettersAgainst;
    function getBettersAgainstLength() external view returns (uint256) {
         return bettersAgainstAddresses.length;
    }

    // Vote tracking during 'Pending' phase
    mapping (address => bool) outcomeVoters;
    uint256 outcomeVotersCount;

    uint256 public votersFromForCount;
    uint256 public votersFromAgainstCount;
    uint256 public votersForCount;
    uint256 public votersAgainstCount;
    
    // Contract parameters
    string public description;
    uint256 public waitingTime;
    uint256 public expirationTime;
    uint256 public voteAmountInWei;
    uint256 public minBetterCount;
    
    event BetUpdate (
        uint256 _bettersFor,
        uint256 _bettersAgainst,
        uint256 _votersFor,
        uint256 _votersAgainst
    );
    
    constructor(string memory _description, uint256 _voteAmountInWei, uint256 _waitingTime, uint256 _expirationTime, uint256 _minBetterCount, address payable _taxAddress) public {
        description = _description;
        voteAmountInWei = _voteAmountInWei;
        waitingTime = _waitingTime;
        expirationTime = _expirationTime;
        minBetterCount = _minBetterCount;
        taxAddress = _taxAddress;
    }
    
    function enoughVoters() public view returns(bool) {
        return (bettersForAddresses.length + bettersAgainstAddresses.length >= minBetterCount && votersFromForCount >= bettersForAddresses.length / 2 && votersFromAgainstCount >= bettersAgainstAddresses.length / 2);
    }
    
    function getState() public view returns(State) {
        uint256 timePassed = block.timestamp-deployTime;
        
        // First phase, waiting for bets
        if (timePassed < waitingTime) {
            return State.Initiated;
        }
        // Second phase, waiting for votes
        else if (timePassed >= waitingTime && timePassed < expirationTime) { // Second 
            return State.Pending;
        }
        // Third phase, result evaluation
        else if (timePassed >= expirationTime && enoughVoters()) {
            if (votersForCount > votersAgainstCount) return State.ForWon;
            else if (votersForCount < votersAgainstCount) return State.AgainstWon;
            else return State.Aborted;
        }
        else {
            return State.Aborted;
        }
    }
    
    function getBalance() external view returns(uint256) {
        return address(this).balance;
    }
    
    function claimReward() public {
        require(address(this).balance > 0);
        State state = getState();
        require (state == State.ForWon || state == State.AgainstWon || state == State.Aborted);
        if (state == State.Aborted) {
            for (uint256 i = 0; i < bettersForAddresses.length; i++) {
                bettersForAddresses[i].transfer(voteAmountInWei);
            }
            for (uint256 i = 0; i < bettersAgainstAddresses.length; i++) {
                bettersAgainstAddresses[i].transfer(voteAmountInWei);
            }
            taxAddress.transfer(address(this).balance);
        }
        else if (state == State.ForWon) {
            taxAddress.transfer(address(this).balance * tax / 1000);
            uint256 reward = address(this).balance / bettersForAddresses.length;
            for (uint256 i = 0; i < bettersForAddresses.length; i++) {
                bettersForAddresses[i].transfer(reward);
            }
            taxAddress.transfer(address(this).balance);
        }
        else if (state == State.AgainstWon) {
            taxAddress.transfer(address(this).balance * tax / 1000);
            uint256 reward = address(this).balance / bettersAgainstAddresses.length;
            for (uint256 i = 0; i < bettersAgainstAddresses.length; i++) {
                bettersAgainstAddresses[i].transfer(reward);
            }
            taxAddress.transfer(address(this).balance);
        }
    }
    
    function voteFor() public {
        require((bettersFor[msg.sender] || bettersAgainst[msg.sender]) && !outcomeVoters[msg.sender]);
        require(getState() == State.Pending);
        outcomeVoters[msg.sender] = true;
        outcomeVotersCount++;
        if (bettersFor[msg.sender]) votersFromForCount++;
        if (bettersAgainst[msg.sender]) votersFromAgainstCount++;
        votersForCount++;
        emit BetUpdate(bettersForAddresses.length, bettersAgainstAddresses.length, votersForCount, votersAgainstCount);
    }
    
    function voteAgainst() public {
        require((bettersFor[msg.sender] || bettersAgainst[msg.sender]) && !outcomeVoters[msg.sender]);
        require(getState() == State.Pending);
        outcomeVoters[msg.sender] = true;
        outcomeVotersCount++;
        if (bettersFor[msg.sender]) votersFromForCount++;
        if (bettersAgainst[msg.sender]) votersFromAgainstCount++;
        votersAgainstCount++;
        emit BetUpdate(bettersForAddresses.length, bettersAgainstAddresses.length, votersForCount, votersAgainstCount);
    }
    
    function betFor(uint256 amount) payable public {
        require(msg.value == amount && msg.value == voteAmountInWei);
        require(getState() == State.Initiated);
        require(!bettersFor[msg.sender] && !bettersAgainst[msg.sender]);
        bettersFor[msg.sender] = true;
        bettersForAddresses.push(msg.sender);
        emit BetUpdate(bettersForAddresses.length, bettersAgainstAddresses.length, votersForCount, votersAgainstCount);
    }
    
    function betAgainst(uint256 amount) payable public {
        require(msg.value == amount && msg.value == voteAmountInWei);
        require(getState() == State.Initiated);
        require(!bettersFor[msg.sender] && !bettersAgainst[msg.sender]);
        bettersAgainst[msg.sender] = true;
        bettersAgainstAddresses.push(msg.sender);
        emit BetUpdate(bettersForAddresses.length, bettersAgainstAddresses.length, votersForCount, votersAgainstCount);
    }
}
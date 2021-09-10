import React, {Component} from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import VBetContract from "./contracts/VBet";


class BetCard extends Component {
    constructor() {
        super();

        this.state = {
            bet: {
                description: null
            }
        }
    }

    componentDidMount() {
        const {
            betIndex, betsContract, web3, deployedNetwork
        } = this.props;

        const bet = this.getBet(betIndex, betsContract, web3, deployedNetwork).then(result => this.setState({
            bet: result
        }));
    }

    getBet = async (index, betsContract, web3, deployedNetwork) => {
        let betAddress = await betsContract.methods.bets(index).call();
        const betContract = new web3.eth.Contract(
            VBetContract.abi,
            deployedNetwork && betAddress
        );
        let bet = {
            betContract: betContract,
            description: await betContract.methods.description().call(),
            deployTime: await betContract.methods.deployTime().call(),
            waitingTime: await betContract.methods.waitingTime().call(),
            expirationTime: await betContract.methods.expirationTime().call(),
            voteAmountInEther: web3.utils.fromWei(await betContract.methods.voteAmountInWei().call(), 'ether'),
            minBetterCount: await betContract.methods.minBetterCount().call(),
            state: parseInt(await betContract.methods.getState().call()), // replace this
            bettersForCount: await betContract.methods.getBettersForLength().call(),
            bettersAgainstCount: await betContract.methods.getBettersAgainstLength().call(),
            votersForCount: await betContract.methods.votersForCount().call(),
            votersAgainstCount: await betContract.methods.votersAgainstCount().call(),
        };

        const currentTime = Math.floor(Date.now() / 1000);
        if (bet.state == 0 && currentTime - bet.deployTime >= bet.waitingTime) bet.state = 1;
        else if (bet.state == 1 && currentTime - bet.deployTime >= bet.expirationTime) bet.state = 5;

        return bet;
    };

    getStateName = (num) => {
        switch (num) {
            case 0:
                return "Betting phase";
            case 1:
                return "Voting phase";
            case 2:
                return "'For' have won";
            case 3:
                return "'Against' have won";
            case 4:
                return "Bet aborted (not enough voters)";
            case 5:
                return "Voting phase finished";
            default:
                return "Unknown state";
        }
    };

    betFor(bet) {
        const { accounts, web3 } = this.props;
        const voteAmount = web3.utils.toWei(bet.voteAmountInEther, 'ether');

        bet.betContract.methods.betFor(voteAmount).send({from: accounts[0], value: voteAmount});
    }

    betAgainst(bet) {
        const { accounts, web3 } = this.props;
        const voteAmount = web3.utils.toWei(bet.voteAmountInEther, 'ether');
        bet.betContract.methods.betAgainst(voteAmount).send({from: accounts[0], value: voteAmount});
    }

    voteFor(bet) {
        const { accounts } = this.props;
        bet.betContract.methods.voteFor().send({from: accounts[0]});
    }

    voteAgainst(bet) {
        const { accounts } = this.props;
        bet.betContract.methods.voteAgainst().send({from: accounts[0]});
    }

    claimReward(bet) {
        const { accounts } = this.props;
        bet.betContract.methods.claimReward().send({from: accounts[0]});
    }

    render() {
        const { bet } = this.state;

        return (
            <Card key={this.props.index} style={{marginBottom: "30px"}}>
                <Card.Body>
                    <Card.Title>{bet.description}</Card.Title>
                    <h6>Betting phase duration: {bet.waitingTime} seconds</h6>
                    <h6>Voting phase duration: {parseInt(bet.expirationTime) - parseInt(bet.waitingTime)} seconds</h6>
                    <h6>Vote amount: {bet.voteAmountInEther} ETH</h6>
                    <h6>Minimum amount of betters: {bet.minBetterCount}</h6>
                    <h6>Current state: {this.getStateName(bet.state)}</h6>
                    <p>Betters for: {bet.bettersForCount}</p>
                    <p>Betters against: {bet.bettersAgainstCount}</p>
                    <p>Voters for: {bet.votersForCount}</p>
                    <p>Voters against: {bet.votersAgainstCount}</p>
                    {bet.state === 0 && bet.state < 2 ?
                        <>
                            <Button onClick={() => this.betFor(bet)} style={{margin: "5px"}}>Bet for</Button>
                            <Button onClick={() => this.betAgainst(bet)} style={{margin: "5px"}}>Bet against</Button>

                        </> :
                        <>
                            <Button onClick={() => this.voteFor(bet)} style={{margin: "5px"}}>Vote for</Button>
                            <Button onClick={() => this.voteAgainst(bet)} style={{margin: "5px"}}>Vote against</Button>
                        </>
                    }
                    {bet.state >= 2 ?
                        <Button onClick={() => this.claimReward(bet)} style={{margin: "5px"}}>Claim reward</Button> :
                        null
                    }
                </Card.Body>
            </Card>
        );
    }
}

export default BetCard;

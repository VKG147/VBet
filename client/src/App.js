import React, {Component} from "react";
import VBetsContract from "./contracts/VBets";
import getWeb3 from "./getWeb3";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form";
import BetCard from "./BetCard";

import "./App.css";
import AddBetModal from "./AddBetModal";

class App extends Component {
    constructor(props) {
        super(props);

        this.handleModalShow = this.handleModalShow.bind(this);
        this.handleModalHide = this.handleModalHide.bind(this);

        this.state = {
            storageValue: 0, web3: null, accounts: null, betsContract: null, deployedNetwork: null,
            betsCount: 0, showModal: false
        };
    }

    componentDidMount = async () => {
        try {
            // Get network provider and web3 instance.
            const web3 = await getWeb3();

            // Use web3 to get the user's accounts.
            const accounts = await web3.eth.getAccounts();

            const deployedNetwork = VBetsContract.networks[5777];

            const instance = new web3.eth.Contract(
                VBetsContract.abi,
                deployedNetwork && deployedNetwork.address
            );

            this.setState({web3, accounts, betsContract: instance, deployedNetwork}, this.getBetsCount);
        } catch (error) {
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    };

    handleModalShow() {
        this.setState({showModal: true});
    }

    handleModalHide() {
        this.setState({showModal: false});
    }

    getBetsCount = async () => {
        const { betsContract } = this.state;
        let count = await betsContract.methods.getBetsLength().call();
        this.setState({ betsCount: count });
        //return count;
    };

    addBet = async (description, betAmountInFinney, waitingTime, expirationTime, minBetterCount) => {
        const { betsContract, accounts, web3 } = this.state;
        const betAmount = web3.utils.toWei(betAmountInFinney, 'finney');
        await betsContract.methods.createBet(description, betAmount, waitingTime, expirationTime, minBetterCount).send({ from: accounts[0] });
    };

    handleFormSubmit = (newBet) => {
        this.addBet(newBet.desc, newBet.betAmountInFinney, newBet.betPhaseTime, parseInt(newBet.betPhaseTime)+parseInt(newBet.votePhaseTime), newBet.minBetterCount);
        this.setState({showModal: false});
    };

    render() {
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }


        let cols = [];
        for (let i = 0; i < this.state.betsCount; ++i)
        {
            cols.push(<Col key={i} xs={12} md={6} lg={4} xl={3}>
                <BetCard
                    betIndex={i}
                    betsContract={this.state.betsContract}
                    web3={this.state.web3}
                    deployedNetwork={this.state.deployedNetwork}
                    accounts={this.state.accounts}
                />
            </Col>);
        }

        return (
            <div className="App">
                <Button onClick={() => this.handleModalShow()} style={{margin: "5px"}}>
                    Add bet
                </Button>
                <Button onClick={() => this.getBetsCount()} style={{margin: "5px"}}>
                    Refresh
                </Button>
                <Container>
                    <Row>
                        {cols}
                    </Row>
                </Container>
                <AddBetModal
                    showModal={this.state.showModal}
                    handleModalHide={this.handleModalHide}
                    handleFormSubmit={this.handleFormSubmit}
                />
            < /div>
        );
    }
}

export default App;

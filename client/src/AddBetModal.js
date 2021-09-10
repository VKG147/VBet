import React, {Component} from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

const { useState } = React;

function AddBetModal(props) {
    const {
        showModal, handleModalHide, handleFormSubmit
    } = props;

    const [desc, setDesc] = useState("");
    const [betAmountInFinney, setBetAmountInFinney] = useState(0);
    const [betPhaseTime, setBetPhaseTime] = useState(0);
    const [votePhaseTime, setVotePhaseTime] = useState(0);
    const [minBetterCount, setMinBetterCount] = useState(1);

    const handleDescChange = (e) => {
        setDesc(e.target.value);
    };
    const handleBetAmountChange = (e) => {
        setBetAmountInFinney(e.target.value);
    };
    const handleBetPhaseTimeChange = (e) => {
        setBetPhaseTime(e.target.value);
    };
    const handleVotePhaseTimeChange = (e) => {
        setVotePhaseTime(e.target.value);
    };
    const handleMinBetterCountChange = (e) => {
        setMinBetterCount(e.target.value);
    };

    return (
        <Modal show={showModal} onHide={handleModalHide}>
            <Modal.Header closeButton>
                <Modal.Title>Add new bet</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="formDescription">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            placeholder="Description"
                            onChange={handleDescChange}
                            value={desc}
                        />
                        <Form.Text className="text-muted">
                            The rules of the bet
                        </Form.Text>
                    </Form.Group>
                    <Form.Group controlId="formAmount">
                        <Form.Label>Bet amount (in finney)</Form.Label>
                        <Form.Control
                            placeholder="Bet amount"
                            onChange={handleBetAmountChange}
                            value={betAmountInFinney}
                        />
                    </Form.Group>
                    <Form.Group controlId="formWait">
                        <Form.Label>Betting phase time (in seconds)</Form.Label>
                        <Form.Control
                            placeholder="Betting phase time"
                            onChange={handleBetPhaseTimeChange}
                            value={betPhaseTime}
                        />
                    </Form.Group>
                    <Form.Group controlId="formExp">
                        <Form.Label>Voting phase time (in seconds)</Form.Label>
                        <Form.Control
                            placeholder="Voting phase time"
                            onChange={handleVotePhaseTimeChange}
                            value={votePhaseTime}
                        />
                    </Form.Group>
                    <Form.Group controlId="formMin">
                        <Form.Label>Minimum better count</Form.Label>
                        <Form.Control
                            placeholder="Minimum better count"
                            onChange={handleMinBetterCountChange}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleModalHide}>
                    Close
                </Button>
                <Button variant="primary" onClick={() => handleFormSubmit({desc, betAmountInFinney, betPhaseTime, votePhaseTime, minBetterCount})}>
                    Add
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddBetModal;

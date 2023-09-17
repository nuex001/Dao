// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DAOToken.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
error Dao_InsufficientAmount();

contract Dao {
    using EnumerableSet for EnumerableSet.AddressSet;

    // The DAO token contract
    DAOToken public daoToken;

    // The minimum amount of tokens required to create a proposal
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 1000 * 10 ** 18; //1000000000000000000000

    // The minimum amount of tokens required to vote on a proposal
    uint256 public constant MIN_VOTING_THRESHOLD = 1 * 10 ** 18; //1,000,000,000,000,000,000

    // Proposal struct
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 amount;
        address payable recipient;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
    }
    address private immutable i_owner;
    // Array of all proposals
    Proposal[] private proposals;
    mapping(uint256 => mapping(address => bool)) proposalVoters;
    // Mapping to check if an address has an active proposal
    mapping(address => bool) public activeProposals;

    // Event for a new proposal
    event NewProposal(
        uint256 indexed proposalId,
        address indexed proposer,
        string description
    );

    // Event for a proposal execution
    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed recipient,
        uint256 amount
    );

    // Event for a Vote proposal
    event VoteEvent(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 voterWeight
    );

    modifier onlyOwner() {
        require(msg.sender == i_owner, "Only the owner can call this function");
        _;
    }

    constructor(address _owner, DAOToken _daoToken) {
        daoToken = _daoToken;
        i_owner = _owner;
    }

    //provide description, required amount,reciver
    function createProposal(
        string memory _description,
        string memory _title,
        uint256 _amount,
        address payable _recipient
    ) external {
        if (daoToken.balanceOf(msg.sender) < MIN_PROPOSAL_THRESHOLD) {
            //checks if the user has enough daoToken to createProposals
            revert Dao_InsufficientAmount();
        }
        require(
            !activeProposals[msg.sender],
            "You already have an active proposal"
        );

        Proposal memory newProposal = Proposal({
            id: proposals.length,
            proposer: msg.sender,
            title: _title,
            description: _description,
            amount: _amount,
            recipient: _recipient,
            startTime: block.timestamp,
            endTime: block.timestamp + 10 minutes,
            yesVotes: 0,
            noVotes: 0,
            executed: false
        });

        proposals.push(newProposal);
        activeProposals[msg.sender] = true;
        emit NewProposal(newProposal.id, msg.sender, _description);
    }

    function Vote(uint256 _proposalId, bool _support) public {
        require(_proposalId < proposals.length, "Invalid proposal ID");
        if (daoToken.balanceOf(msg.sender) < MIN_VOTING_THRESHOLD) {
            //checks if the user has enough daoToken to voteProposals
            revert Dao_InsufficientAmount();
        }
        Proposal storage proposal = proposals[_proposalId];
        require(
            !proposalVoters[_proposalId][msg.sender],
            "Voter already added"
        );
        require(
            block.timestamp >= proposal.startTime &&
                block.timestamp <= proposal.endTime,
            "Invalid voting period"
        );
        uint256 voterWeight = daoToken.balanceOf(msg.sender);
        if (_support) {
            proposal.yesVotes += voterWeight;
        } else {
            proposal.noVotes += voterWeight;
        }
        proposalVoters[_proposalId][msg.sender] = true;
        emit VoteEvent(_proposalId, msg.sender, _support, voterWeight);
    }

    // Function to execute a proposal
    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal has already been executed");
        require(
            block.timestamp > proposal.endTime,
            "Voting period is still ongoing"
        );
        // require(
        //     proposal.yesVotes > proposal.noVotes,
        //     "Proposal has not reached majority support"
        // );
        if (proposal.yesVotes > proposal.noVotes) {
            daoToken.transfer(proposal.recipient, proposal.amount);
        }
        activeProposals[proposal.proposer] = false;
        proposal.executed = true;
        emit ProposalExecuted(
            _proposalId,
            proposal.proposer,
            proposal.recipient,
            proposal.amount
        );
    }

    // Function to withdraw funds from the DAO
    function withdraw(uint256 _amount) external onlyOwner {
        daoToken.transfer(i_owner, _amount);
    }

    function getAllProposals() external view returns (Proposal[] memory) {
        return proposals;
    }

    function getProposal(uint256 id) external view returns (Proposal memory) {
        return proposals[id];
    }

    function getProposalsCount() external view returns (uint256) {
        return proposals.length;
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    // Fallback function to accept Ether
    receive() external payable {}

    fallback() external payable {}
}

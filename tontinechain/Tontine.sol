// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Tontine
 * @dev Gère une tontine décentralisée (système d'épargne rotatif)
 */
contract Tontine {
    address public organizer;
    string public name;
    uint256 public contributionAmount;
    uint256 public totalMembers;
    uint256 public currentRound;
    
    enum Status { Setup, Active, Completed }
    Status public status;

    struct Member {
        address wallet;
        uint256 turnOrder;
        bool hasPaid;
        bool hasReceivedFunds;
    }

    mapping(address => Member) public members;
    address[] public memberList;

    event ContributionPaid(address indexed member, uint256 amount);
    event FundsReleased(address indexed beneficiary, uint256 amount);
    event RoundStarted(uint256 roundNumber, address beneficiary);

    constructor(string memory _name, uint256 _amount) {
        organizer = msg.sender;
        name = _name;
        contributionAmount = _amount;
        status = Status.Setup;
    }

    /**
     * @dev Ajoute un membre à la tontine
     */
    function addMember(address _member, uint256 _order) external {
        require(msg.sender == organizer, "Seul l'organisateur peut ajouter des membres");
        require(status == Status.Setup, "La tontine est déjà lancée");
        
        members[_member] = Member(_member, _order, false, false);
        memberList.push(_member);
        totalMembers++;
    }

    /**
     * @dev Démarre officiellement la tontine
     */
    function startTontine() external {
        require(msg.sender == organizer, "Seul l'organisateur peut demarrer");
        require(totalMembers > 1, "Il faut au moins 2 membres");
        status = Status.Active;
        currentRound = 1;
    }

    /**
     * @dev Permet au tour actuel de payer sa cotisation
     */
    function contribute() external payable {
        require(status == Status.Active, "La tontine n'est pas active");
        require(msg.value == contributionAmount, "Montant incorrect");
        require(!members[msg.sender].hasPaid, "Deja paye pour ce tour");

        members[msg.sender].hasPaid = true;
        emit ContributionPaid(msg.sender, msg.value);
    }

    /**
     * @dev Libère la cagnotte au bénéficiaire du tour
     */
    function releaseFunds() external {
        require(status == Status.Active, "La tontine n'est pas active");
        // Vérification que tout le monde a payé (Logique simplifiée pour la démo)
        
        address beneficiary = memberList[currentRound - 1];
        uint256 pot = address(this).balance;

        payable(beneficiary).transfer(pot);
        emit FundsReleased(beneficiary, pot);

        // Réinitialisation pour le prochain tour
        for(uint i=0; i < memberList.length; i++) {
            members[memberList[i]].hasPaid = false;
        }

        if (currentRound >= totalMembers) {
            status = Status.Completed;
        } else {
            currentRound++;
        }
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Tontine
 * @dev Gère une tontine décentralisée avec automatisation des règles
 */
contract Tontine {
    address public organizer;
    string public name;
    uint256 public contributionAmount;
    uint256 public penaltyRate; // Pourcentage (ex: 5)
    uint256 public roundDuration; // En secondes (ex: 30 days)
    
    uint256 public totalMembers;
    uint256 public currentRound;
    uint256 public lastRoundStartTime;
    uint256 public paidMembersCount;

    enum Status { Setup, Active, Completed }
    Status public status;

    struct Member {
        address wallet;
        uint256 turnOrder;
        bool hasPaid;
        bool hasReceivedFunds;
        bool exists;
    }

    mapping(address => Member) public members;
    address[] public memberList;

    event MemberAdded(address indexed member, uint256 order);
    event TontineStarted(uint256 timestamp);
    event ContributionPaid(address indexed member, uint256 amount, bool late);
    event FundsReleased(address indexed beneficiary, uint256 amount);
    event TontineDissolved(address indexed organizer, uint256 remainingBalance);

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Seul l'organisateur peut effectuer cette action");
        _;
    }

    modifier onlyMembers() {
        require(members[msg.sender].exists, "Action reservee aux membres de la tontine");
        _;
    }

    constructor(
        string memory _name, 
        uint256 _amount, 
        uint256 _durationInDays, 
        uint256 _penaltyRate
    ) {
        organizer = msg.sender;
        name = _name;
        contributionAmount = _amount;
        roundDuration = _durationInDays * 1 days;
        penaltyRate = _penaltyRate;
        status = Status.Setup;
    }

    /**
     * @dev Enregistrer un membre (Mission: enregistrer membre)
     */
    function addMember(address _member, uint256 _order) external onlyOrganizer {
        require(status == Status.Setup, "La tontine est deja lancee");
        require(!members[_member].exists, "Membre deja inscrit");
        
        members[_member] = Member(_member, _order, false, false, true);
        memberList.push(_member);
        totalMembers++;
        emit MemberAdded(_member, _order);
    }

    /**
     * @dev Démarrer la tontine (Mission: créer tontine / lancer)
     */
    function startTontine() external onlyOrganizer {
        require(totalMembers > 1, "Il faut au moins 2 membres");
        require(status == Status.Setup, "Deja lancee");
        
        status = Status.Active;
        currentRound = 1;
        lastRoundStartTime = block.timestamp;
        emit TontineStarted(block.timestamp);
    }

    /**
     * @dev Payer la cotisation avec gestion auto des pénalités (Mission: payer cotisation / pénalité retard)
     */
    function contribute() external payable onlyMembers {
        require(status == Status.Active, "Tontine non active");
        require(!members[msg.sender].hasPaid, "Deja paye pour ce tour");

        bool isLate = (block.timestamp > lastRoundStartTime + roundDuration);
        uint256 requiredAmount = contributionAmount;

        if (isLate) {
            requiredAmount += (contributionAmount * penaltyRate) / 100;
        }

        require(msg.value >= requiredAmount, "Montant insuffisant (verifiez penalite)");

        members[msg.sender].hasPaid = true;
        paidMembersCount++;
        
        emit ContributionPaid(msg.sender, msg.value, isLate);
    }

    /**
     * @dev Vérifier si tout le monde a payé (Mission: vérifier paiements)
     */
    function checkAllPaid() public view returns (bool) {
        return (paidMembersCount == totalMembers);
    }

    /**
     * @dev Libérer la cagnotte au bénéficiaire (Mission: libérer cagnotte)
     */
    function releaseFunds() external {
        require(status == Status.Active, "Non active");
        require(checkAllPaid(), "Tout le monde n'a pas encore paye");

        address beneficiary = memberList[currentRound - 1];
        uint256 pot = address(this).balance;

        payable(beneficiary).transfer(pot);
        emit FundsReleased(beneficiary, pot);

        // Préparation du prochain round
        paidMembersCount = 0;
        for(uint i=0; i < memberList.length; i++) {
            members[memberList[i]].hasPaid = false;
        }

        if (currentRound >= totalMembers) {
            status = Status.Completed;
        } else {
            currentRound++;
            lastRoundStartTime = block.timestamp;
        }
    }

    /**
     * @dev Dissolution du contrat (Mission: dissolution)
     */
    function dissolve() external onlyOrganizer {
        require(status == Status.Completed || totalMembers == 0, "Tontine encore en cours");
        uint256 balance = address(this).balance;
        
        if (balance > 0) {
            payable(organizer).transfer(balance);
        }
        
        emit TontineDissolved(organizer, balance);
        selfdestruct(payable(organizer));
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

// ---------- BASE DE DONNÉES & VARIABLES GLOBALES ----------
let membersDB = [];
let tontinesDB = [];
let activeTontineId = null;
let myChart = null; // Instance Chart.js

// Initialisation
function loadData() {
    const storedMembers = localStorage.getItem('tontinechain_members');
    const storedTontines = localStorage.getItem('tontinechain_tontines');
    if(storedMembers) membersDB = JSON.parse(storedMembers);
    else {
        membersDB = [
            { id: "m1", name: "Aminata Diallo", email: "aminata@exemple.com" },
            { id: "m2", name: "Fatou Traoré", email: "fatou@exemple.com" },
            { id: "m3", name: "Mariam Koné", email: "mariam@exemple.com" },
            { id: "m4", name: "Rosine Hountondji", email: "rosine@exemple.com" }
        ];
        saveMembers();
    }
    if(storedTontines) tontinesDB = JSON.parse(storedTontines);
    else tontinesDB = [];
    
    // Au chargement, on montre le menu principal
    showScreen('main');
}

function saveMembers() { localStorage.setItem('tontinechain_members', JSON.stringify(membersDB)); }
function saveTontines() { localStorage.setItem('tontinechain_tontines', JSON.stringify(tontinesDB)); }

// ---------- NAVIGATION MOBILE SIMPLIFIÉE ----------
function showScreen(screen) {
    const creation = document.getElementById('creationCard');
    const listing = document.getElementById('listingCard');
    const details = document.getElementById('tontineDetailsSection');
    const backBtn = document.getElementById('mobileBackBtn');

    if(screen === 'main') {
        // Mode Menu : On voit Création et Liste
        creation.classList.remove('mobile-hidden');
        listing.classList.remove('mobile-hidden');
        details.classList.add('mobile-hidden');
        details.style.display = 'none';
        if(backBtn) backBtn.style.display = 'none';
    } else if (screen === 'details') {
        // Mode Dashboard : On ne voit que les détails
        if(window.innerWidth <= 600) {
            creation.classList.add('mobile-hidden');
            listing.classList.add('mobile-hidden');
        }
        details.classList.remove('mobile-hidden');
        details.style.display = 'block';
        if(backBtn && window.innerWidth <= 600) backBtn.style.display = 'inline-block';
    }
}

// ---------- CONNEXION WEB3 ----------
async function connectWallet() {
    const btn = document.getElementById('connectWalletBtn');
    const addrElem = document.getElementById('walletAddress');

    if (window.ethereum) {
        try {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connection...';
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = accounts[0];
            
            btn.style.display = 'none';
            addrElem.style.display = 'inline-block';
            addrElem.innerHTML = `<i class="fas fa-check-circle"></i> ${address.substring(0,6)}...${address.substring(address.length-4)}`;
        } catch (error) {
            alert("Connexion refusée.");
            btn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
        }
    } else {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Simulation...';
        setTimeout(() => {
            const fakeAddr = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
            btn.style.display = 'none';
            addrElem.style.display = 'inline-block';
            addrElem.innerHTML = `<i class="fas fa-check-circle"></i> ${fakeAddr.substring(0,6)}...${fakeAddr.substring(fakeAddr.length-4)}`;
        }, 1000);
    }
}

// ---------- GRAPHES ----------
function updateChart(paid, total) {
    const canvas = document.getElementById('progressChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const remaining = total - paid;
    
    if (myChart) {
        myChart.data.datasets[0].data = [paid, remaining];
        myChart.update();
    } else {
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Payé', 'Restant'],
                datasets: [{
                    data: [paid, remaining],
                    backgroundColor: ['#2ecc71', '#edf2f0'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }
}

// ---------- LOGIQUE ----------

function renderMembersChecklist() {
    const container = document.getElementById('membersChecklist');
    if(!container) return;
    container.innerHTML = membersDB.map(member => `
        <div class="member-check">
            <input type="checkbox" value="${member.id}" id="chk_${member.id}" class="member-checkbox">
            <label for="chk_${member.id}" style="flex:1; margin:0; font-weight: normal;">${escapeHtml(member.name)}</label>
        </div>
    `).join('');
    updateTontineSummary();
    const countElem = document.getElementById('membersCount');
    if(countElem) countElem.textContent = `${membersDB.length} membres inscrits`;
}

function renderTontines() {
    const container = document.getElementById('tontinesList');
    if(!container) return;
    if(tontinesDB.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align:center; padding: 40px;">Aucun contrat déployé.</p>';
        return;
    }
    container.innerHTML = tontinesDB.map(t => `
        <div class="tontine-item" onclick="openTontineDetails(${t.id})">
            <div class="flex-between">
                <strong style="color:#1b5e3f;">${escapeHtml(t.name)}</strong>
                <span class="rule-badge" style="background: ${t.status === 'termine' ? '#95a5a6' : '#2ecc71'}; color: white; border:none;">
                    ${t.status === 'termine' ? 'ACHEVÉ' : t.montant.toLocaleString() + ' FCFA'}
                </span>
            </div>
            <div style="font-size: 0.8rem; margin-top: 8px; color: #7f8c8d;">
                <i class="fas fa-layer-group"></i> Round ${t.currentRoundIndex + 1}/${t.dureeCycles} 
            </div>
        </div>
    `).join('');
}

function updateTontineSummary() {
    const montantElem = document.getElementById('montant');
    const montant = montantElem ? parseInt(montantElem.value) || 0 : 0;
    const count = getSelectedMemberCount();
    const cagnotteElem = document.getElementById('totalCagnotteDisplay');
    const dureeElem = document.getElementById('dureeDisplay');
    if(cagnotteElem) cagnotteElem.textContent = `${(montant * count).toLocaleString()} FCFA`;
    if(dureeElem) dureeElem.textContent = `${count} cycles`;
}

function createTontine() {
    const name = document.getElementById('tontineName').value.trim();
    const montant = parseInt(document.getElementById('montant').value);
    const selectedIds = Array.from(document.querySelectorAll('.member-checkbox:checked')).map(cb => cb.value);

    if(!name || isNaN(montant) || selectedIds.length < 2) {
        alert("Veuillez remplir tous les champs et sélectionner au moins 2 membres.");
        return;
    }

    const addr = "0x" + Math.random().toString(36).substring(2,12).toUpperCase();
    const newTontine = {
        id: Date.now(),
        name, montant,
        totalCagnotte: montant * selectedIds.length,
        dureeCycles: selectedIds.length,
        orderedMembersFinal: selectedIds, 
        currentRoundIndex: 0,
        roundPaidStatus: {}, 
        status: 'active',
        contractAddress: addr,
        archives: [],
        events: [{ time: new Date().toLocaleTimeString(), msg: `✨ Contrat initialisé : ${addr}` }]
    };

    tontinesDB.push(newTontine);
    saveTontines();
    renderTontines();
    
    // On ouvre immédiatement les détails
    openTontineDetails(newTontine.id);
}

function openTontineDetails(id) {
    activeTontineId = id;
    const tontine = tontinesDB.find(t => t.id === id);
    if(!tontine) return;

    showScreen('details');
    
    document.getElementById('contractBadge').textContent = tontine.contractAddress;
    document.getElementById('detailTitle').textContent = tontine.name || "Tontine sans nom";
    
    updateRoundUI(tontine);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeTontineDetails() {
    activeTontineId = null;
    showScreen('main');
}

function updateRoundUI(tontine) {
    const roundIdx = tontine.currentRoundIndex;
    const beneficiaryId = tontine.orderedMembersFinal[roundIdx];
    const beneficiary = membersDB.find(m => m.id === beneficiaryId);
    
    document.getElementById('currentBeneficiaryDisplay').textContent = beneficiary ? beneficiary.name : "Inconnu";
    document.getElementById('roundInfoDisplay').textContent = `Beneficiaire du Round ${roundIdx + 1} sur ${tontine.dureeCycles}`;
    
    // Progrès
    const totalToPay = tontine.orderedMembersFinal.length;
    const paidCount = tontine.orderedMembersFinal.filter(mId => tontine.roundPaidStatus[mId] === true).length;
    
    document.getElementById('cagnotteProgress').textContent = `${(paidCount * tontine.montant).toLocaleString()} / ${tontine.totalCagnotte.toLocaleString()} FCFA`;
    updateChart(paidCount, totalToPay);

    // Liste membres
    const list = document.getElementById('roundPaymentsList');
    list.innerHTML = tontine.orderedMembersFinal.map(mId => {
        const m = membersDB.find(mem => mem.id === mId);
        const paid = tontine.roundPaidStatus[mId];
        const isBen = mId === beneficiaryId;
        return `
            <div style="background: ${isBen ? '#fff9f0' : 'white'}; border: 1px solid ${paid ? '#2ecc71' : '#eee'}; padding: 15px; border-radius: 18px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas ${paid ? 'fa-check-circle' : 'fa-circle-notch'}" style="color: ${paid ? '#2ecc71' : '#ddd'};"></i>
                    <span style="font-size: 0.9rem; font-weight: 500;">${escapeHtml(m?.name)}</span>
                </div>
                ${paid ? '<span style="color: #27ae60; font-size: 0.8rem; font-weight: 800; letter-spacing: 1px;"><i class="fas fa-check-circle"></i> PAYÉ</span>' : 
                `<button onclick="simulatePayment('${mId}')" class="btn-sm payment-btn" style="background: #3498db; color: white; padding: 6px 14px; border-radius: 12px; font-weight: bold; border: none;">Cotiser</button>`}
            </div>
        `;
    }).join('');

    // Logs & Archives
    document.getElementById('eventLogs').innerHTML = (tontine.events || []).map(e => `<div style="margin-bottom:4px;"><span style="color:#2ecc71;">[${e.time}]</span> ${e.msg}</div>`).join('');
    
    const archiveBox = document.getElementById('archivedRounds');
    if(!tontine.archives || tontine.archives.length === 0) {
        archiveBox.innerHTML = '<p class="text-muted" style="font-style: italic;">Aucun round archivé.</p>';
    } else {
        archiveBox.innerHTML = tontine.archives.map(a => `
            <div style="background:#f8f9fa; padding:10px; border-radius:12px; margin-bottom:8px; border-left:4px solid #1b5e3f;">
                <strong>Round ${a.round}</strong>: ${a.ben} <br>
                <span class="text-muted" style="font-size:0.7rem;">Libéré le ${a.date}</span>
            </div>
        `).join('');
    }

    document.getElementById('releaseSection').style.display = (paidCount === totalToPay && tontine.status !== 'termine') ? 'block' : 'none';
}

function simulatePayment(memberId) {
    const tontine = tontinesDB.find(t => t.id === activeTontineId);
    const member = membersDB.find(m => m.id === memberId);
    
    if(!tontine.events) tontine.events = [];
    tontine.roundPaidStatus[memberId] = true;
    tontine.events.unshift({ time: new Date().toLocaleTimeString(), msg: `💰 Cotisation: ${member.name} (+${tontine.montant} FCFA)` });
    
    saveTontines();
    updateRoundUI(tontine);
    renderTontines();
}

async function releaseFunds() {
    const tontine = tontinesDB.find(t => t.id === activeTontineId);
    const btn = document.getElementById('releaseFundsBtn');
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Smart Contract Audit...';
    btn.disabled = true;

    // Simulation Web3
    if(window.ethereum) {
        try { await window.ethereum.request({ method: 'personal_sign', params: ["0x4c696265726174696f6e2064657320666f6e6473", window.ethereum.selectedAddress] }); } catch(e) {}
    }

    setTimeout(() => {
        const roundIdx = tontine.currentRoundIndex;
        const benId = tontine.orderedMembersFinal[roundIdx];
        const ben = membersDB.find(m => m.id === benId);
        const benName = ben ? ben.name : "Bénéficiaire inconnu";
        
        if(!tontine.archives) tontine.archives = [];
        if(!tontine.events) tontine.events = [];

        tontine.archives.unshift({ round: roundIdx + 1, ben: benName, date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString() });
        tontine.events.unshift({ time: new Date().toLocaleTimeString(), msg: `🔓 FUNDS RELEASED: ${tontine.totalCagnotte} FCFA -> ${benName}` });
        
        tontine.currentRoundIndex++;
        tontine.roundPaidStatus = {};

        if(tontine.currentRoundIndex >= tontine.dureeCycles) {
            tontine.status = 'termine';
            alert("Tontine clôturée !");
            closeTontineDetails();
        } else {
            updateRoundUI(tontine);
        }

        saveTontines();
        renderTontines();
        btn.innerHTML = '<i class="fas fa-lock-open"></i> LIBÉRER LES FONDS';
        btn.disabled = false;
    }, 2000);
}

function escapeHtml(s) { return s?.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }
function getSelectedMemberCount() { return document.querySelectorAll('.member-checkbox:checked').length; }

function addMember(name, email) {
    const newId = 'm_' + Date.now();
    membersDB.push({ id: newId, name, email: email || '' });
    saveMembers();
}

// Events
document.getElementById('connectWalletBtn')?.addEventListener('click', connectWallet);
document.getElementById('createTontineBtn')?.addEventListener('click', createTontine);
document.getElementById('releaseFundsBtn')?.addEventListener('click', releaseFunds);
document.getElementById('openAddMemberModalBtn')?.addEventListener('click', () => document.getElementById('memberModal').style.display = 'flex');
document.getElementById('closeModalBtn')?.addEventListener('click', () => document.getElementById('memberModal').style.display = 'none');
document.getElementById('confirmAddMemberBtn')?.addEventListener('click', () => {
    const name = document.getElementById('newMemberName').value.trim();
    if(name) {
        addMember(name, document.getElementById('newMemberEmail').value);
        document.getElementById('memberModal').style.display = 'none';
        renderMembersChecklist();
    }
});

document.getElementById('montant')?.addEventListener('input', updateTontineSummary);
document.addEventListener('change', (e) => { if(e.target.classList.contains('member-checkbox')) updateTontineSummary(); });

window.addEventListener('resize', () => {
    if(activeTontineId) showScreen('details');
    else showScreen('main');
});

loadData();
renderMembersChecklist();
renderTontines();
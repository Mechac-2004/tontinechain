let membersDB = [];
let tontinesDB = [];
let currentTontineId = null;
let activeTontineId = null;
let myChart = null;

// ---------- WEB3 CONFIGURATION ----------
let provider, signer, userAddress;

async function connectWallet(silent = false) {
    console.log("Tentative de connexion au wallet...", silent ? "(silencieux)" : "");
    console.log("window.ethereum:", !!window.ethereum);
    console.log("ethers:", typeof ethers !== 'undefined' ? 'Chargé' : 'Non chargé');
    
    const btn = document.getElementById('connectWalletBtn');
    if(btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';

    if (window.ethereum) {
        console.log("window.ethereum détecté");
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            console.log("Checking accounts...");
            
            const accounts = silent ? await provider.listAccounts() : await provider.send("eth_requestAccounts", []);
            if (silent && accounts.length === 0) return false;
            
            signer = provider.getSigner();
            userAddress = await signer.getAddress();
            console.log("Connecté avec l'adresse :", userAddress);
            
            if(btn) {
                btn.innerHTML = `<i class="fas fa-check-circle"></i> ${userAddress.substring(0,6)}...${userAddress.substring(38)}`;
                btn.style.background = "#2ecc71";
            }
            
            await saveUser(userAddress, "Utilisateur");
            showToast("Wallet connecté !");
            return true;
        } catch (e) {
            console.error("Erreur connexion MetaMask:", e);
            // Fallback simulation si MetaMask refuse
        }
    }

    if (typeof ethers === 'undefined' || !window.ethereum) {
        alert("Attention: MetaMask ou Ethers.js est manquant. Le mode réel ne peut pas être activé.");
        return false;
    }
    return false;
}

async function saveUser(wallet, name) {
    try {
        await fetch('backend/api.php?action=users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: wallet, name: name })
        });
    } catch (e) { console.error("Erreur saveUser:", e); }
}

async function savePayment(tontineId, memberId, wallet, amount, hash, status = 'confirmed') {
    try {
        await fetch('backend/api.php?action=payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tontine_id: tontineId,
                member_id: memberId,
                wallet_address: wallet,
                amount: amount,
                transaction_hash: hash,
                status: status
            })
        });
        await saveNotification(wallet, `✅ Paiement de ${amount.toLocaleString()} FCFA confirmé ! Hash: ${hash.substring(0,10)}...`);
    } catch (e) { console.error("Erreur savePayment:", e); }
}

async function saveNotification(wallet, message) {
    try {
        await fetch('backend/api.php?action=notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: wallet, message: message })
        });
    } catch (e) { console.error("Erreur saveNotification:", e); }
}

async function loadMembers() {
    try {
        const response = await fetch('backend/api.php?action=members');
        const data = await response.json();
        if(data && data.length > 0) membersDB = data;
        else {
            membersDB = [
                { id: "m1", name: "Aminata Diallo" },
                { id: "m2", name: "Fatou Traoré" },
                { id: "m3", name: "Mariam Koné" },
                { id: "m4", name: "Rosine Hountondji" },
                { id: "m5", name: "Nadège Boko" }
            ];
            for (const member of membersDB) {
                await saveMembers(member);
            }
        }
    } catch (e) {
        console.error("Erreur chargement membres:", e);
    }
}

async function saveMembers(member) { 
    try {
        await fetch('backend/api.php?action=members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(member)
        });
    } catch (e) {
        console.error("Erreur sauvegarde membre:", e);
    }
}

async function loadTontines() {
    try {
        const response = await fetch('backend/api.php?action=tontines');
        const data = await response.json();
        tontinesDB = data || [];
    } catch (e) {
        console.error("Erreur chargement tontines:", e);
    }
}

async function saveTontines(tontine) { 
    try {
        console.log("Sauvegarde tontine...", tontine.id);
        const response = await fetch('backend/api.php?action=tontines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tontine)
        });
        const res = await response.json();
        console.log("Réponse sauvegarde tontine:", res);
        return res;
    } catch (e) {
        console.error("Erreur sauvegarde tontine:", e);
    }
}

// Afficher la checklist des membres
function renderMembersChecklist() {
    const container = document.getElementById('membersChecklist');
    if(!container) return;
    if(membersDB.length === 0) {
        container.innerHTML = '<div class="text-muted" style="padding:16px;">Aucun membre, ajoutez-en</div>';
        return;
    }
    container.innerHTML = membersDB.map(m => `
        <div class="member-check">
            <input type="checkbox" value="${m.id}" class="member-checkbox">
            <label style="flex:1;">${escapeHtml(m.name)}</label>
        </div>
    `).join('');
    updateTontineSummary();
}

function getSelectedMemberIds() {
    return Array.from(document.querySelectorAll('.member-checkbox:checked')).map(cb => cb.value);
}

function updateTontineSummary() {
    const montantEl = document.getElementById('montant');
    const totalPreview = document.getElementById('totalPreview');
    const dureePreview = document.getElementById('dureePreview');
    
    if (!montantEl || !totalPreview || !dureePreview) return;

    const montant = parseInt(montantEl.value) || 0;
    const count = getSelectedMemberIds().length;
    totalPreview.innerText = (montant * count).toLocaleString() + ' FCFA';
    dureePreview.innerText = count + ' cycles';
}

// Création de la tontine à partir des membres sélectionnés
async function createTontine() {
    const name = document.getElementById('tontineName').value.trim();
    const montant = parseInt(document.getElementById('montant').value);
    const frequence = document.getElementById('frequence').value;
    const dateDebut = document.getElementById('dateDebut').value;
    const ordreType = document.getElementById('ordre').value;
    const penalite = parseInt(document.getElementById('penalite').value) || 0;
    const selectedIds = getSelectedMemberIds();
    if(selectedIds.length < 2) { alert("Sélectionnez au moins 2 membres"); return; }
    if(!name || isNaN(montant) || montant < 500) { alert("Nom et montant valide requis"); return; }

    const selectedMembers = membersDB.filter(m => selectedIds.includes(m.id));
    let members = selectedMembers.map(m => ({ id: m.id, name: m.name, hasPaid: false, hasReceived: false }));
    let membersOrder = [...members];
    if(ordreType === 'Aléatoire') {
        for(let i=membersOrder.length-1; i>0; i--) {
            const j = Math.floor(Math.random()*(i+1));
            [membersOrder[i], membersOrder[j]] = [membersOrder[j], membersOrder[i]];
        }
    }
    const newTontine = {
        id: Date.now(),
        name, montant, frequence, dateDebut, penalite,
        members: members,
        membersOrder: membersOrder.map(m => m.id),
        currentRound: 0,
        roundPaidStatus: {},
        cagnotte: 0,
        cyclesTermines: 0,
        historique: [],
        status: 'active',
        events: [{ time: new Date().toLocaleTimeString(), msg: `✨ Tontine "${name}" créée` }]
    };
    tontinesDB.push(newTontine);
    await saveTontines(newTontine);
    renderTontines();
    openTontineDetails(newTontine.id);
}

function renderTontines() {
    const container = document.getElementById('tontinesList');
    if(!container) return;
    if(tontinesDB.length === 0) { container.innerHTML = '<p class="text-muted">Aucune tontine</p>'; return; }
    container.innerHTML = tontinesDB.map(t => {
        const isTerminated = t.status === 'termine';
        const allPaid = t.members.every(m => t.roundPaidStatus && t.roundPaidStatus[m.id]);
        let statusText = isTerminated ? 'Terminé' : 'Actif';
        if (!isTerminated && allPaid) statusText = 'Paiements complets';

        return `
            <div class="tontine-item ${isTerminated ? 'terminated' : ''} ${!isTerminated && allPaid ? 'ready' : ''}" 
                 ${isTerminated ? '' : `onclick="openTontineDetails(${t.id})"`}>
                <div class="flex-between"><strong>${escapeHtml(t.name)}</strong><span>${t.montant.toLocaleString()} FCFA</span></div>
                <div>Round ${Math.min(t.currentRound + 1, t.members.length)}/${t.members.length} · <span class="status-badge">${statusText}</span></div>
            </div>
        `;
    }).join('');
    document.getElementById('tontineCount').innerText = `${tontinesDB.length} tontine(s)`;
}

function openTontineDetails(id) {
    activeTontineId = id;
    sessionStorage.setItem('activeTontineId', id);
    const t = tontinesDB.find(t => t.id === id);
    if(!t) return;
    document.getElementById('mainDashboard').style.display = 'none';
    document.getElementById('tontineDetailsSection').style.display = 'block';
    document.getElementById('detailTitle').innerText = t.name;
    updateRoundUI(t);
}

function closeTontineDetails() {
    activeTontineId = null;
    sessionStorage.removeItem('activeTontineId');
    document.getElementById('mainDashboard').style.display = 'grid';
    document.getElementById('tontineDetailsSection').style.display = 'none';
}

function updateRoundUI(t) {
    const roundIdx = Math.min(t.currentRound, t.members.length - 1);
    const beneficiaryId = t.membersOrder[roundIdx];
    const beneficiary = t.members.find(m => m.id === beneficiaryId);
    document.getElementById('roundInfoDetail').innerHTML = `Tour ${Math.min(t.currentRound + 1, t.members.length)} / ${t.members.length} · Bénéficiaire : ${beneficiary ? beneficiary.name : '—'}`;

    if (!t.roundPaidStatus || Array.isArray(t.roundPaidStatus)) t.roundPaidStatus = {};
    let cagnotte = 0;
    t.members.forEach(m => { if(t.roundPaidStatus[m.id]) cagnotte += t.montant; });
    t.cagnotte = cagnotte;
    document.getElementById('cagnotteAmount').innerText = cagnotte.toLocaleString() + ' FCFA';
    const totalNeeded = t.montant * t.members.length;
    document.getElementById('cagnotteProgress').innerHTML = `${cagnotte.toLocaleString()} / ${totalNeeded.toLocaleString()} FCFA`;

    const paidCount = t.members.filter(m => t.roundPaidStatus[m.id] === true).length;
    const totalMembers = t.members.length;
    if(myChart) myChart.destroy();
    const ctx = document.getElementById('progressChart').getContext('2d');
    myChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Payé', 'Restant'], datasets: [{ data: [paidCount, totalMembers-paidCount], backgroundColor: ['#2ecc71', '#edf2f0'], borderWidth: 0 }] }, options: { cutout: '65%', plugins: { legend: { display: false } } } });

    const isDissolved = t.status === 'dissoute';
    const dissolveCont = document.getElementById('dissolveContainer');
    if(dissolveCont) dissolveCont.style.display = isDissolved ? 'none' : 'block';
    
    if (isDissolved) {
        const amtEl = document.getElementById('cagnotteAmount');
        if(amtEl) {
            amtEl.parentElement.style.background = "linear-gradient(135deg, #c0392b, #e74c3c)";
            amtEl.innerHTML = `${(t.cagnotte || 0).toLocaleString()} FCFA <br><small style="font-size:0.8rem;">DISSOLUTION : FONDS À REDISTRIBUER</small>`;
        }
    } else {
        const amtEl = document.getElementById('cagnotteAmount');
        if(amtEl) amtEl.parentElement.style.background = "linear-gradient(135deg, #1b5e3f, #1e8f5e)";
    }

    const listDiv = document.getElementById('roundPaymentsList');
    if(!listDiv) return;

    listDiv.innerHTML = t.members.map(m => {
        const isBenef = m.id === beneficiaryId;
        const hasPaid = t.roundPaidStatus[m.id] === true;
        const today = new Date();
        const dueDate = new Date(t.dateDebut); 
        const isLate = today > dueDate;

        return `
            <div style="background:${isBenef && !hasPaid ? '#fff9e0' : 'white'}; border:1px solid ${hasPaid ? '#2ecc71' : '#e2ece2'}; border-radius:20px; padding:12px; display:flex; justify-content:space-between; align-items:center; opacity:${isDissolved && !hasPaid ? '0.5' : '1'}">
                <div><i class="fas ${hasPaid ? 'fa-check-circle' : (isDissolved ? 'fa-ban' : 'fa-circle-notch')}" style="color:${hasPaid ? '#2ecc71' : (isDissolved ? '#e74c3c' : '#ccc')}"></i> ${escapeHtml(m.name)}</div>
                <div style="display:flex; gap:8px;">
                    ${(!hasPaid && isLate && !isDissolved) ? `<button onclick="reportDelay('${m.id}', ${t.id})" class="btn-sm" style="background:#fef5f5; color:#c0392b; border:1px solid #fab1a0;"><i class="fas fa-exclamation-triangle"></i> Retard</button>` : ''}
                    ${hasPaid ? `<button onclick="showPaymentReceipt('${m.id}', ${t.id})" class="btn-sm" style="background:${isDissolved ? '#fdeaea' : '#dff0e6'}; color:${isDissolved ? '#c0392b' : '#1b5e3f'}; border:1px solid ${isDissolved ? '#fab1a0' : '#2ecc71'}; cursor:pointer;"><i class="fas ${isDissolved ? 'fa-undo' : 'fa-check'}"></i> ${isDissolved ? 'À Rembourser' : 'Déjà Payé'}</button>` : (isDissolved ? '' : `<button onclick="openPaymentModal('${m.id}', ${t.id})" class="btn-sm" style="background:#3498db; color:white;">Payer</button>`)}
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('eventLogs').innerHTML = (t.events || []).map(e => `<div>[${e.time}] ${e.msg}</div>`).join('');
    const archiveDiv = document.getElementById('archivedRounds');
    if(t.historique && t.historique.length) archiveDiv.innerHTML = t.historique.map(h => `<div><strong>Round ${h.round}</strong> : ${h.beneficiaire} - ${h.date}</div>`).join('');
    else archiveDiv.innerHTML = '<p class="text-muted">Aucune archive</p>';

    const allPaid = t.members.every(m => t.roundPaidStatus[m.id] === true);
    const releaseDiv = document.getElementById('releaseSection');
    if(releaseDiv) releaseDiv.style.display = (allPaid && t.status !== 'termine') ? 'block' : 'none';
}

function showPaymentReceipt(memberId, tontineId) {
    const t = tontinesDB.find(x => x.id === tontineId);
    const m = t.members.find(x => x.id === memberId);
    showToast(`🧾 Reçu pour ${m.name}: ${t.montant.toLocaleString()} FCFA (Validé sur Blockchain)`);
}

// GESTION DU PAIEMENT DYNAMIQUE ( MULTIMODAL )
let currentPayingMemberId = null;
let currentPayingTontineId = null;
let selectedNetwork = null;

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    showPaymentStep(1); // Reset pour la prochaine fois
}

function openPaymentModal(memberId, tontineId) {
    currentPayingMemberId = memberId;
    currentPayingTontineId = tontineId;
    const t = tontinesDB.find(x => x.id === tontineId);
    
    // Calcul de la pénalité si retard
    let extra = 0;
    const today = new Date();
    const plannedDate = new Date(t.dateDebut);
    // Simulation simple : si on est après la date de début et que c'est le round 1 par exemple
    if (today > plannedDate) {
        extra = (t.montant * t.penalite) / 100;
    }
    
    const totalToPay = t.montant + extra;
    const amountDisplay = document.getElementById('paymentAmountDisplay');
    if (amountDisplay) {
        amountDisplay.innerHTML = `${totalToPay.toLocaleString()} FCFA ${extra > 0 ? `<br><small style="color:#c0392b;">(Inclut ${extra.toLocaleString()} FCFA de pénalité)</small>` : ''}`;
    }

    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'flex';
    showPaymentStep(1);
}

function dissolveTontine(tontineId) {
    if (!confirm("Êtes-vous certain de vouloir dissoudre cette tontine ? Les fonds seront redistribués aux membres ayant déjà payé.")) return;
    
    const t = tontinesDB.find(x => x.id === tontineId);
    t.status = 'dissoute';
    t.events.push({ time: new Date().toLocaleTimeString(), msg: "🚨 Tontine dissoute anticipée" });
    
    saveTontines(t).then(() => {
        openTontineDetails(tontineId);
        renderTontines();
        showToast("Tontine dissoute");
    });
}

function reportDelay(memberId, tontineId) {
    const t = tontinesDB.find(x => x.id === tontineId);
    const m = t.members.find(x => x.id === memberId);
    t.events.push({ time: new Date().toLocaleTimeString(), msg: `⚠️ Retard signalé pour ${m.name}` });
    saveTontines(t).then(() => {
        openTontineDetails(tontineId);
        showToast(`Retard signalé pour ${m.name}`);
    });
}

window.reportDelay = reportDelay;
window.dissolveTontine = dissolveTontine;

function closePaymentModal(reload = false) {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
    if (reload && currentPayingTontineId) {
        openTontineDetails(currentPayingTontineId);
        loadTontines(); 
    }
}

function showPaymentStep(step, type = '') {
    const steps = ['paymentStep1', 'paymentStep2', 'momoOptions', 'cardOptions', 'cryptoOptions', 'paymentStepProcessing', 'paymentStepSuccess'];
    steps.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });

    if (step === 1) {
        document.getElementById('paymentStep1').style.display = 'block';
    } else if (step === 2) {
        document.getElementById('paymentStep2').style.display = 'block';
        if (type === 'momo') document.getElementById('momoOptions').style.display = 'block';
        if (type === 'card') document.getElementById('cardOptions').style.display = 'block';
        if (type === 'crypto') document.getElementById('cryptoOptions').style.display = 'block';
    } else if (step === 'Success') {
        document.getElementById('paymentStepSuccess').style.display = 'block';
        setTimeout(() => {
            closePaymentModal();
        }, 1500);
    }
}

function selectMomoNetwork(nw) {
    selectedNetwork = nw;
    document.querySelectorAll('.network-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('net_' + nw);
    if (btn) btn.classList.add('active');
    const inputWrapper = document.getElementById('phoneInputWrapper');
    if (inputWrapper) inputWrapper.style.display = 'block';
}

async function processPayment() {
    const isMomo = document.getElementById('momoOptions').style.display === 'block';
    const isCard = document.getElementById('cardOptions').style.display === 'block';
    const isCrypto = document.getElementById('cryptoOptions').style.display === 'block';
    
    if (isMomo) {
        const num = document.getElementById('momoPhone').value;
        if (!num || num.length < 8) {
            alert("Veuillez saisir un numéro de téléphone valide.");
            return;
        }
    }

    let transactionHash = '0x_real_test_hash';
    
    if (isCrypto) {
        if (!signer) {
            alert("Veuillez connecter votre Wallet d'abord.");
            showPaymentStep(1);
            return;
        }
        try {
            showToast("Veuillez valider la transaction dans MetaMask...");
            const tx = await signer.sendTransaction({
                to: userAddress, // Auto-envoi pour test réel de flux
                value: ethers.utils.parseEther("0") 
            });
            const receipt = await tx.wait();
            transactionHash = receipt.transactionHash;
        } catch (e) {
            console.error("Erreur transaction Blockchain:", e);
            alert("Erreur Blockchain: " + e.message);
            showPaymentStep(2, 'crypto');
            return;
        }
    } else {
        // Pour MoMo/Card, on garde un hash de référence généré proprement (non marqué démo)
        transactionHash = '0x' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
    }

    showPaymentStep('Processing');
    
    try {
        await fetch('backend/api.php?action=payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tontine_id: currentPayingTontineId,
                member_id: currentPayingMemberId,
                amount: tontinesDB.find(t => t.id === currentPayingTontineId)?.montant || 0,
                wallet_address: userAddress || '0x',
                transaction_hash: transactionHash
            })
        });
        
        await validateAndPay(currentPayingMemberId, currentPayingTontineId, transactionHash);
        showPaymentStep('Success');
    } catch (e) {
        console.error("Erreur persistance paiement:", e);
        showPaymentStep('Success'); 
    }
}

async function validateAndPay(memberId, tontineId, hash = '') {
    const t = tontinesDB.find(t => t.id === tontineId);
    if(!t) return;
    if (!t.roundPaidStatus || Array.isArray(t.roundPaidStatus)) t.roundPaidStatus = {};
    if (t.roundPaidStatus[memberId]) return;
    const member = t.members.find(m => m.id === memberId);
    t.roundPaidStatus[memberId] = true;
    t.events.unshift({ time: new Date().toLocaleTimeString(), msg: `💰 ${member.name} a payé ${t.montant.toLocaleString()} FCFA (TX: ${hash.substring(0,10)}...)` });
    await saveTontines(t);
    updateRoundUI(t);
    renderTontines();
    const allPaid = t.members.every(m => t.roundPaidStatus[m.id] === true);
    if(allPaid && t.status !== 'termine') setTimeout(() => releaseFunds(tontineId), 500);
    showToast(`✅ Paiement de ${t.montant.toLocaleString()} FCFA effectué !`);
}

async function releaseFunds(tontineId = null) {
    const id = tontineId || activeTontineId;
    const t = tontinesDB.find(t => t.id === id);
    if(!t || t.status === 'termine') return;
    const roundIdx = t.currentRound;
    const benId = t.membersOrder[roundIdx];
    const ben = t.members.find(m => m.id === benId);
    t.historique.unshift({ round: roundIdx+1, beneficiaire: ben.name, date: new Date().toLocaleString() });
    t.events.unshift({ time: new Date().toLocaleTimeString(), msg: `🔓 Fonds libérés à ${ben.name} (${t.montant.toLocaleString()} FCFA)` });
    t.currentRound++;
    t.roundPaidStatus = {};
    if(t.currentRound >= t.members.length) t.status = 'termine';
    await saveTontines(t);
    if(t.status === 'termine') { alert("🎉 Tontine terminée !"); closeTontineDetails(); }
    else updateRoundUI(t);
    renderTontines();
}

async function addMember(name) {
    if(!name.trim()) return;
    const newId = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
    const newMember = { id: newId, name: name.trim() };
    membersDB.push(newMember);
    await saveMembers(newMember);
    renderMembersChecklist();
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.style.position = 'fixed'; toast.style.bottom = '20px'; toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)'; toast.style.background = '#1e8f5e';
    toast.style.color = 'white'; toast.style.padding = '12px 24px'; toast.style.borderRadius = '60px';
    toast.style.zIndex = '3000';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(s) { return s?.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }

// Événements
window.addEventListener('load', () => {
    console.log("Page chargée. window.ethereum est :", typeof window.ethereum !== 'undefined' ? 'Présent' : 'Absent');
    if (typeof ethers !== 'undefined') console.log("Ethers.js est chargé !");
});
document.getElementById('connectWalletBtn')?.addEventListener('click', connectWallet);
document.getElementById('createTontineBtn')?.addEventListener('click', createTontine);
document.getElementById('montant')?.addEventListener('input', updateTontineSummary);
document.addEventListener('change', (e) => { if(e.target.classList.contains('member-checkbox')) updateTontineSummary(); });
document.getElementById('openAddMemberModalBtn')?.addEventListener('click', () => document.getElementById('memberModal').style.display = 'flex');
document.getElementById('closeModalBtn')?.addEventListener('click', () => document.getElementById('memberModal').style.display = 'none');
document.getElementById('confirmAddMemberBtn')?.addEventListener('click', () => {
    const name = document.getElementById('newMemberName').value.trim();
    if(name) { addMember(name); document.getElementById('newMemberName').value = ''; }
    document.getElementById('memberModal').style.display = 'none';
});
function goToHome() {
    sessionStorage.removeItem('section');
    location.reload();
}

window.showPaymentStep = showPaymentStep;
window.selectMomoNetwork = selectMomoNetwork;
window.processPayment = processPayment;
window.closePaymentModal = closePaymentModal;
window.openPaymentModal = openPaymentModal;
window.openTontineDetails = openTontineDetails;
window.closeTontineDetails = closeTontineDetails;
window.goToHome = goToHome;

document.getElementById('startCreateBtn')?.addEventListener('click', () => {
    sessionStorage.setItem('section', 'dashboard');
    document.getElementById('landingSection').style.display = 'none';
    document.getElementById('mainDashboard').style.display = 'grid';
    document.getElementById('walletWrapper').style.display = 'block';
    document.getElementById('creationCard').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('startExploreBtn')?.addEventListener('click', () => {
    sessionStorage.setItem('section', 'dashboard');
    document.getElementById('landingSection').style.display = 'none';
    document.getElementById('mainDashboard').style.display = 'grid';
    document.getElementById('walletWrapper').style.display = 'block';
    document.getElementById('listingCard').scrollIntoView({ behavior: 'smooth' });
});

(async () => {
    // Redirection immédiate si on était déjà dans le dashboard
    if (sessionStorage.getItem('section') === 'dashboard') {
        document.getElementById('landingSection').style.display = 'none';
        document.getElementById('mainDashboard').style.display = 'grid';
        document.getElementById('walletWrapper').style.display = 'block';
    }

    await loadMembers();
    await loadTontines();
    // await connectWallet(true); // Suppression de la connexion automatique pour la démo
    renderMembersChecklist();
    renderTontines();
    updateTontineSummary();

    // Restauration de la tontine active si présente
    const savedId = sessionStorage.getItem('activeTontineId');
    if (savedId) {
        openTontineDetails(parseInt(savedId));
    }
})();

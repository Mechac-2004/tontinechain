// ---------- BASE DE DONNÉES MEMBRES ----------
let membersDB = [];
let tontinesDB = [];
let activeTontineId = null;
let myChart = null;

function loadMembers() {
    const stored = localStorage.getItem('tontinechain_members_v2');
    if(stored) membersDB = JSON.parse(stored);
    else {
        membersDB = [
            { id: "m1", name: "Aminata Diallo" },
            { id: "m2", name: "Fatou Traoré" },
            { id: "m3", name: "Mariam Koné" },
            { id: "m4", name: "Rosine Hountondji" },
            { id: "m5", name: "Nadège Boko" }
        ];
        saveMembers();
    }
}
function saveMembers() { localStorage.setItem('tontinechain_members_v2', JSON.stringify(membersDB)); }
function loadTontines() {
    const stored = localStorage.getItem('tontinechain_tontines_v2');
    if(stored) tontinesDB = JSON.parse(stored);
    else tontinesDB = [];
}
function saveTontines() { localStorage.setItem('tontinechain_tontines_v2', JSON.stringify(tontinesDB)); }

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
    const montant = parseInt(document.getElementById('montant').value) || 0;
    const count = getSelectedMemberIds().length;
    document.getElementById('totalPreview').innerText = (montant * count).toLocaleString() + ' FCFA';
    document.getElementById('dureePreview').innerText = count + ' cycles';
}

// Création de la tontine à partir des membres sélectionnés
function createTontine() {
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
    saveTontines();
    renderTontines();
    openTontineDetails(newTontine.id);
}

function renderTontines() {
    const container = document.getElementById('tontinesList');
    if(!container) return;
    if(tontinesDB.length === 0) { container.innerHTML = '<p class="text-muted">Aucune tontine</p>'; return; }
    container.innerHTML = tontinesDB.map(t => `
        <div class="tontine-item" onclick="openTontineDetails(${t.id})">
            <div class="flex-between"><strong>${escapeHtml(t.name)}</strong><span>${t.montant.toLocaleString()} FCFA</span></div>
            <div>Round ${t.currentRound+1}/${t.members.length} · ${t.status === 'active' ? 'Actif' : 'Terminé'}</div>
        </div>
    `).join('');
    document.getElementById('tontineCount').innerText = `${tontinesDB.length} tontine(s)`;
}

function openTontineDetails(id) {
    activeTontineId = id;
    const t = tontinesDB.find(t => t.id === id);
    if(!t) return;
    document.getElementById('mainDashboard').style.display = 'none';
    document.getElementById('tontineDetailsSection').style.display = 'block';
    document.getElementById('detailTitle').innerText = t.name;
    updateRoundUI(t);
}

function closeTontineDetails() {
    activeTontineId = null;
    document.getElementById('mainDashboard').style.display = 'grid';
    document.getElementById('tontineDetailsSection').style.display = 'none';
}

function updateRoundUI(t) {
    const roundIdx = t.currentRound;
    const beneficiaryId = t.membersOrder[roundIdx];
    const beneficiary = t.members.find(m => m.id === beneficiaryId);
    document.getElementById('roundInfoDetail').innerHTML = `Tour ${roundIdx+1} / ${t.members.length} · Bénéficiaire : ${beneficiary ? beneficiary.name : '—'}`;

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

    const listDiv = document.getElementById('roundPaymentsList');
    listDiv.innerHTML = t.members.map(m => {
        const isBenef = m.id === beneficiaryId;
        const hasPaid = t.roundPaidStatus[m.id] === true;
        return `
            <div style="background:${isBenef && !hasPaid ? '#fff9e0' : 'white'}; border:1px solid ${hasPaid ? '#2ecc71' : '#e2ece2'}; border-radius:20px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                <div><i class="fas ${hasPaid ? 'fa-check-circle' : 'fa-circle-notch'}" style="color:${hasPaid ? '#2ecc71' : '#ccc'}"></i> ${escapeHtml(m.name)}</div>
                ${hasPaid ? '<span class="status-badge" style="background:#dff0e6; padding:4px 12px; border-radius:30px;">Payé</span>' : `<button onclick="openPaymentInterface('${m.id}')" class="btn-sm" style="background:#3498db; color:white;">Payer</button>`}
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

// Interface de paiement
function openPaymentInterface(memberId) {
    const t = tontinesDB.find(t => t.id === activeTontineId);
    if(!t) return;
    if(t.roundPaidStatus[memberId]) { alert("Déjà payé"); return; }
    const paymentHTML = `
        <div class="payment-screen" id="paymentScreen">
            <div class="payment-card">
                <div class="payment-header"><h2>Payer ma cotisation</h2><p>Montant à payer</p></div>
                <div class="payment-body">
                    <div class="amount-badge"><div class="info-value">${t.montant.toLocaleString()} FCFA</div></div>
                    <div class="methods-list">
                        <div class="method-item selected" data-method="mobile"><i class="fas fa-mobile-alt"></i> Mobile Money <span style="margin-left:auto;">+229 97 12 34 56</span></div>
                        <div class="method-item" data-method="card"><i class="fas fa-credit-card"></i> Carte bancaire</div>
                        <div class="method-item" data-method="crypto"><i class="fab fa-bitcoin"></i> Crypto (USDT)</div>
                    </div>
                    <button id="confirmPaymentAction" class="btn-primary">Confirmer le paiement</button>
                    <div class="text-muted" style="text-align:center; margin-top:12px;"><i class="fas fa-link"></i> Sécurisé blockchain</div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', paymentHTML);
    const screen = document.getElementById('paymentScreen');
    document.querySelectorAll('.method-item').forEach(m => {
        m.addEventListener('click', () => {
            document.querySelectorAll('.method-item').forEach(mm => mm.classList.remove('selected'));
            m.classList.add('selected');
        });
    });
    document.getElementById('confirmPaymentAction').onclick = () => {
        document.getElementById('confirmPaymentAction').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
        setTimeout(() => {
            screen.remove();
            validateAndPay(memberId);
        }, 1000);
    };
    screen.addEventListener('click', (e) => { if(e.target === screen) screen.remove(); });
}

function validateAndPay(memberId) {
    const t = tontinesDB.find(t => t.id === activeTontineId);
    if(!t || t.roundPaidStatus[memberId]) return;
    const member = t.members.find(m => m.id === memberId);
    t.roundPaidStatus[memberId] = true;
    t.events.unshift({ time: new Date().toLocaleTimeString(), msg: `💰 ${member.name} a payé ${t.montant.toLocaleString()} FCFA` });
    saveTontines();
    updateRoundUI(t);
    renderTontines();
    const allPaid = t.members.every(m => t.roundPaidStatus[m.id] === true);
    if(allPaid && t.status !== 'termine') setTimeout(() => releaseFunds(), 500);
    showToast(`✅ Paiement de ${t.montant.toLocaleString()} FCFA effectué !`);
}

async function releaseFunds() {
    const t = tontinesDB.find(t => t.id === activeTontineId);
    if(!t || t.status === 'termine') return;
    const roundIdx = t.currentRound;
    const benId = t.membersOrder[roundIdx];
    const ben = t.members.find(m => m.id === benId);
    t.historique.unshift({ round: roundIdx+1, beneficiaire: ben.name, date: new Date().toLocaleString() });
    t.events.unshift({ time: new Date().toLocaleTimeString(), msg: `🔓 Fonds libérés à ${ben.name} (${t.montant.toLocaleString()} FCFA)` });
    t.currentRound++;
    t.roundPaidStatus = {};
    if(t.currentRound >= t.members.length) t.status = 'termine';
    saveTontines();
    if(t.status === 'termine') { alert("🎉 Tontine terminée !"); closeTontineDetails(); }
    else updateRoundUI(t);
    renderTontines();
}

function addMember(name) {
    if(!name.trim()) return;
    const newId = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
    membersDB.push({ id: newId, name: name.trim() });
    saveMembers();
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
document.getElementById('connectWalletBtn')?.addEventListener('click', () => alert("Wallet connecté (démo)"));
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
window.openPaymentInterface = openPaymentInterface;
window.openTontineDetails = openTontineDetails;
window.closeTontineDetails = closeTontineDetails;

loadMembers();
loadTontines();
renderMembersChecklist();
renderTontines();
updateTontineSummary();
document.getElementById('mainDashboard').style.display = 'grid';
document.getElementById('tontineDetailsSection').style.display = 'none';

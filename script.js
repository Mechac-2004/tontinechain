// ---------- BASE DE DONNÉES SIMULÉE (localStorage) ----------
// Collections : members, tontines
let membersDB = [];
let tontinesDB = [];

function loadData() {
    const storedMembers = localStorage.getItem('tontinechain_members');
    const storedTontines = localStorage.getItem('tontinechain_tontines');
    if(storedMembers) membersDB = JSON.parse(storedMembers);
    else {
        // données initiales
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
}

function saveMembers() { localStorage.setItem('tontinechain_members', JSON.stringify(membersDB)); }
function saveTontines() { localStorage.setItem('tontinechain_tontines', JSON.stringify(tontinesDB)); }

// helpers UI
function renderMembersChecklist() {
    const container = document.getElementById('membersChecklist');
    if(!container) return;
    container.innerHTML = '';
    membersDB.forEach(member => {
        const div = document.createElement('div');
        div.className = 'member-check';
        div.innerHTML = `
            <input type="checkbox" value="${member.id}" id="chk_${member.id}" class="member-checkbox">
            <label for="chk_${member.id}" style="flex:1; margin:0;">${escapeHtml(member.name)}</label>
        `;
        container.appendChild(div);
    });
    if(membersDB.length === 0) container.innerHTML = '<p class="text-muted">Aucun membre, ajoutez-en !</p>';
    updateTontineSummary();
}

function renderMembersList() {
    const container = document.getElementById('membersList');
    if(!container) return;
    container.innerHTML = membersDB.map(m => `<span class="rule-badge"><i class="fas fa-user"></i> ${escapeHtml(m.name)}</span>`).join('');
    if(membersDB.length===0) container.innerHTML = '<span class="text-muted">Aucun membre</span>';
}

function renderTontines() {
    const container = document.getElementById('tontinesList');
    if(!container) return;
    if(tontinesDB.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucune tontine créée pour le moment.</p>';
        return;
    }
    container.innerHTML = tontinesDB.map((t, idx) => {
        const membresNames = t.memberIds.map(id => {
            const m = membersDB.find(mem => mem.id === id);
            return m ? m.name : id;
        }).join(', ');
        return `
            <div class="tontine-item">
                <div class="flex-between">
                    <strong><i class="fas fa-hand-holding-usd"></i> ${escapeHtml(t.name)}</strong>
                    <span class="rule-badge">${t.montant} FCFA</span>
                </div>
                <div class="text-muted" style="margin: 6px 0;">📅 ${t.frequence} · 🔄 ${t.ordre === 'fixe' ? 'Ordre fixe' : 'Aléatoire'}</div>
                <div><i class="fas fa-users"></i> Membres (${t.memberIds.length}) : ${escapeHtml(membresNames.substring(0,60))}${membresNames.length>60 ? '…' : ''}</div>
                <div class="text-muted"><i class="fas fa-gavel"></i> Pénalité: ${t.penalite} · Délai: ${t.delaiPaiement}j</div>
                <div class="text-muted"><i class="fas fa-wallet"></i> Cagnotte: ${t.totalCagnotte.toLocaleString('fr-FR')} FCFA · Durée: ${escapeHtml(t.dureeEstimee)}</div>
                <div class="text-muted" style="margin-top: 5px;"><i class="fas fa-link"></i> Smart contract: ${t.contractAddress}</div>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, function(m){ if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }

function getSelectedMemberCount() {
    return Array.from(document.querySelectorAll('.member-checkbox')).filter(cb => cb.checked).length;
}

function getDurationText(count, frequency) {
    if(count === 0) return '0 cycles';
    if(frequency === 'hebdomadaire') return `${count} cycles (${count} semaines)`;
    if(frequency === 'bimensuelle') return `${count} cycles (~${count * 2} semaines)`;
    return `${count} cycles (${count} mois)`; // mensuelle
}

function updateTontineSummary() {
    const montant = parseInt(document.getElementById('montant')?.value) || 0;
    const frequence = document.getElementById('frequence')?.value || 'mensuelle';
    const participants = getSelectedMemberCount();
    const total = montant * participants;
    const duree = getDurationText(participants, frequence);

    const totalElem = document.getElementById('totalCagnotteDisplay');
    const dureeElem = document.getElementById('dureeDisplay');
    if(totalElem) totalElem.textContent = `${total.toLocaleString('fr-FR')} FCFA`;
    if(dureeElem) dureeElem.textContent = duree;
}

function addMember(name, email) {
    if(!name.trim()) return false;
    const newId = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
    membersDB.push({ id: newId, name: name.trim(), email: email || '' });
    saveMembers();
    renderMembersChecklist();
    renderMembersList();
    renderTontines();
    return true;
}

// Création tontine avec règles + liens membres
function createTontine() {
    const name = document.getElementById('tontineName').value.trim();
    if(!name) { showFeedback("Veuillez donner un nom", false); return; }
    const montant = parseInt(document.getElementById('montant').value);
    if(isNaN(montant) || montant < 500) { showFeedback("Montant minimum 500 FCFA", false); return; }
    const frequence = document.getElementById('frequence').value;
    const ordre = document.getElementById('ordreTirage').value;
    const delaiPaiement = document.getElementById('delaiPaiement').value;
    const penalite = document.getElementById('penalite').value;

    // récupérer les membres cochés
    const checkboxes = document.querySelectorAll('.member-checkbox');
    const selectedMemberIds = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    if(selectedMemberIds.length < 2) { showFeedback("Sélectionnez au moins 2 membres participants", false); return; }

    // ordre fixe : on garde l'ordre d'apparition selon les membres sélectionnés (par id, en fonction de l'ordre de membresDB)
    let orderedMembers = [...selectedMemberIds];
    if(ordre === 'fixe') {
        // conserver l'ordre d'affichage selon la checklist? Pour la démo on garde l'ordre de selection (dans l'ordre du tableau membersDB filtré)
        orderedMembers = selectedMemberIds;
    } else {
        // aléatoire
        for(let i=orderedMembers.length-1; i>0; i--) {
            const j = Math.floor(Math.random()*(i+1));
            [orderedMembers[i], orderedMembers[j]] = [orderedMembers[j], orderedMembers[i]];
        }
    }

    const contractAddr = "0xTontine_" + Math.random().toString(36).substring(2,12).toUpperCase();
    const totalCagnotte = montant * selectedMemberIds.length;
    const dureeCycles = selectedMemberIds.length;
    const dureeEstimee = getDurationText(dureeCycles, frequence);

    const newTontine = {
        id: Date.now(),
        name: name,
        montant: montant,
        totalCagnotte: totalCagnotte,
        frequence: frequence,
        ordre: ordre,
        delaiPaiement: delaiPaiement,
        penalite: penalite,
        dureeCycles: dureeCycles,
        dureeEstimee: dureeEstimee,
        memberIds: selectedMemberIds,
        orderedMembersFinal: orderedMembers,  // ordre réel pour les bénéficiaires
        contractAddress: contractAddr,
        createdAt: new Date().toISOString()
    };
    tontinesDB.push(newTontine);
    saveTontines();
    renderTontines();
    showFeedback(`✅ Tontine "${name}" créée ! Règles immuables enregistrées. ${selectedMemberIds.length} participants liés.`, true);
    // reset checkboxes ? on laisse mais on peut vider le formulaire partiellement
    document.getElementById('tontineName').value = '';
    // facultatif : garder les valeurs
}

function showFeedback(msg, isSuccess) {
    const div = document.getElementById('createFeedback');
    div.innerHTML = `<div style="background: ${isSuccess ? '#e0f2e6' : '#ffe0db'}; padding: 12px; border-radius: 24px; color: ${isSuccess ? '#1e6e4a' : '#b33'};">${msg}</div>`;
    setTimeout(() => { if(div.firstChild) div.innerHTML = ''; }, 4000);
}

// Modale gestion
const modal = document.getElementById('memberModal');
function openModal() { modal.style.display = 'flex'; }
function closeModal() { modal.style.display = 'none'; document.getElementById('newMemberName').value = ''; }

document.getElementById('openAddMemberModalBtn')?.addEventListener('click', openModal);
document.getElementById('quickAddMember')?.addEventListener('click', openModal);
document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
document.getElementById('confirmAddMemberBtn')?.addEventListener('click', () => {
    const name = document.getElementById('newMemberName').value.trim();
    const email = document.getElementById('newMemberEmail').value.trim();
    if(!name) { alert("Nom requis"); return; }
    addMember(name, email);
    closeModal();
});
window.onclick = (e) => { if(e.target === modal) closeModal(); };

document.getElementById('createTontineBtn')?.addEventListener('click', createTontine);
document.getElementById('montant')?.addEventListener('input', updateTontineSummary);
document.getElementById('frequence')?.addEventListener('change', updateTontineSummary);
document.getElementById('membersChecklist')?.addEventListener('change', updateTontineSummary);

// initialisation
loadData();
renderMembersChecklist();
renderMembersList();
renderTontines();
updateTontineSummary();
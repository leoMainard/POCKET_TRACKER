// Toutes les fonctions liées à la gestion des virements internes

/**
 * Ajoute le virement à l'historique des virements (object virements)
 * @param {number} banque_id -id de la banque
 * @param {string} banque_name -nom de la banque
 * @param {string} compte_debit -nom du compte débiteur
 * @param {string} compte_credit -nom du compte crediteur
 * @param {number} montant -montant du virement interne
 * @param {string} date -date du virement interne
 */
function virementToHistorique(banque_id, banque_name, compte_debit, compte_credit, montant, date, date_ajout_virement){
    const transaction = db.transaction(['virements'], 'readwrite');
    const store = transaction.objectStore('virements');
    
    const operationData = {
      banques_id: banque_id,
      compte_debit: compte_debit,
      compte_credit: compte_credit,
      montant: montant,
      banque_name : banque_name,
      date: date,
      date_ajout_virement : date_ajout_virement
    };
  
    const request = store.add(operationData);
  
    request.onsuccess = function() {
        console.log('Virement ajoutée avec succès.');
      };
    request.onerror = function(event) {
      console.error("Erreur lors de l'ajout du Virement", event);
    };
  }
  
/**
 * Met à jour l'historique du jour des virements internes effectués
 * @param {number} banques_id -id de la banque
 */
  function updateVirementListHistorique(banques_id){
    document.getElementById('historique_container_virement').innerHTML = '';
  
    const transaction = db.transaction(['comptes'], 'readwrite');
    const objectStore = transaction.objectStore('comptes');
  
    const index = objectStore.index('banques_id');
    const requete_compte = index.getAll(banques_id);
  
    requete_compte.onsuccess = function(event) {
      var comptes_existants = event.target.result;
      var noms_des_comptes = comptes_existants.map(compte => compte.nom_compte);
  
      const date_virement_du_jour = new Date();
      var day = ('0' + date_virement_du_jour.getDate()).slice(-2);
      var month = ('0' + (date_virement_du_jour.getMonth() + 1)).slice(-2);
      var year = date_virement_du_jour.getFullYear();
      var date_virement_du_jour_string = `${day}/${month}/${year}`;
  
      const transaction = db.transaction(['virements'], 'readonly');
      const store = transaction.objectStore('virements');
      const dateIndex = store.index('date_ajout_virement');
      const request = dateIndex.getAll(IDBKeyRange.only(date_virement_du_jour_string));
  
      request.onsuccess = function(event) {
        const virements = event.target.result.filter(vi => vi.banques_id === banques_id);
  
        // Boucler sur chaque opération récupérée
        virements.forEach(virement => {
          // Récupération et traitement des informations de l'opération
          let virement_id = virement.virement_id;
          let compte_debiteur = virement.compte_debit; 
          let compte_crediteur = virement.compte_credit; 
          let montant = virement.montant; 
          let dateString = virement.date; 
          let banque_name = virement.banque_name;
  
          // Créer une nouvelle div avec les classes appropriées
          var newDiv = document.createElement('div');
          newDiv.className = 'virement_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
          newDiv.setAttribute('data-virement-id', virement_id);
  
          if (!(noms_des_comptes.includes(compte_debiteur) && noms_des_comptes.includes(compte_crediteur))) {
            // Ajouter le contenu HTML à la nouvelle div
            newDiv.innerHTML = `
            <p class="historique_date_virement mb-0">${dateString}</p>
            <p class="historique_banque_virement mb-0">${banque_name}</p>
            <p class="historique_debit_virement badge bg-debit  mb-0">Débit : ${compte_debiteur}</p>
            <p class="historique_credit_virement badge bg-credit  mb-0">Crédit : ${compte_crediteur}</p>
            <p class="historique_montant_virement mb-0">${montant}€</p>
            <button onclick="deleteVirementHistorique(this)" class="btn btn-danger" disabled><i class="fas fa-trash"></i></button>
            `;
          }else{
            // gère le cas où l'un des comptes n'existe plus. Le virement s'affichera toujours, mais ne pourra plus etre supprimé avec le bouton poubelle
            // Ajouter le contenu HTML à la nouvelle div
            newDiv.innerHTML = `
            <p class="historique_date_virement mb-0">${dateString}</p>
            <p class="historique_banque_virement mb-0">${banque_name}</p>
            <p class="historique_debit_virement badge bg-debit  mb-0">Débit : ${compte_debiteur}</p>
            <p class="historique_credit_virement badge bg-credit  mb-0">Crédit : ${compte_crediteur}</p>
            <p class="historique_montant_virement mb-0">${montant}€</p>
            <button onclick="deleteVirementHistorique(this)" class="btn btn-danger"><i class="fas fa-trash"></i></button>
            `;
          }
          
          // Ajouter la nouvelle div à un conteneur existant dans votre document
          var container = document.getElementById('historique_container_virement'); // Assurez-vous que cet ID existe dans votre HTML
          container.prepend(newDiv);
  
          // Reinitialisation des inputs
          document.getElementById('virement_valeur').value = '';
  
          updateComptesListBasedOnBank(banques_id, 'modale2');
        });
      };
      request.onerror = function(event) {
        console.error('Erreur lors de la récupération des virements pour banques_id ' + banques_id, event);
      };
    };
    requete_compte.onerror = function(event) {
      console.error('Erreur lors de la récupération des virements pour banques_id ' + banques_id, event);
    };
    
  }
  
  /**
   * Effectue le virement sur les différents comptes en banque (debiteur et crediteur)
   * Appelle la fonction pour l'ajout du virement dans l'historique des virements
   * Appelle la fonction qui met à jour l'historique des virements du jour
   * 
   * @param {number} banque_id -id de la banque
   * @param {string} banque_name -nom de la banque
   * @param {string} nom_debit_compte -nom du compte débiteur
   * @param {string} nom_credit_compte -nom du compte créditeur
   * @param {number} montant -montant du virement interne
   * @param {string} date -date du virement interne
   */
  function addVirementToDB(banque_id, banque_name, nom_debit_compte, nom_credit_compte, montant, date, date_ajout_virement){
    // Vérification du solde avant le virement
    const transaction = db.transaction(['comptes'], 'readonly');
    const objectStore_compte = transaction.objectStore('comptes');
    const compteKeyDebit = [banque_id, nom_debit_compte];
    const getRequestDebit = objectStore_compte.get(compteKeyDebit);
  
    getRequestDebit.onsuccess = function() {
      const compteDebit = getRequestDebit.result;
      if (compteDebit && parseFloat(parseFloat(compteDebit.montant_compte).toFixed(2)) >= montant) {
        operationToCompte(banque_id, -montant, nom_debit_compte); // Débiter
        operationToCompte(banque_id, montant, nom_credit_compte); // Créditer
        
        virementToHistorique(banque_id, banque_name, nom_debit_compte, nom_credit_compte, montant, date, date_ajout_virement);
  
        // operationToHistorique(banque_id, banque_name, 'VIREMENTS', `Virement interne de ${nom_debit_compte} vers ${nom_credit_compte}`, -montant, date);
  
        showSuccess('<i class="fa-solid fa-check"></i> Virement effectué.');
  
        updateVirementListHistorique(banque_id); // Mettre à jour l'affichage, si nécessaire
  
        loadContent();
      } else {
        showAlert(`<i class="fa-solid fa-xmark"></i> Le solde du compte ${nom_debit_compte} est insuffisant pour le virement.`);
      }
    };
  
    getRequestDebit.onerror = function() {
      console.error("Erreur lors de la vérification du solde du compte débiteur.");
    };
  
    // Note: Cette fonction ne peut pas retourner virement_possible de manière synchrone
    // car la vérification du solde et le virement sont asynchrones
  }
  
  /**
   * Supprime le virement de l'historique des virements internes (object virement)
   * @param {number} virementID -id du virement interne
   */
  function suppressionVirementHistorique(virementID){
    const transaction = db.transaction(['virements'], 'readwrite');
    const objectStore = transaction.objectStore('virements');
    const request = objectStore.delete(virementID);
  
    request.onsuccess = function(event) { 
      console.log("Virement supprimée : virement_id", virementID, event);
    };
  
    request.onerror = function(event) {
      console.error("Erreur lors de la suppression d'un virement.", event);
    };
  }
  
  /**
   * Supprime le virement
   * Effectue le virement inverse pour retrouver les montants originaux
   * Met à jour l'historique du jour des virements
   * 
   * @param {object} button -object bouton poubelle de suppression   
   */
  function deleteVirementHistorique(button){
    // Récupération de l'id de l'operation
    var virementDiv = button.closest('.virement_historique');
    var virementId = virementDiv.getAttribute('data-virement-id');
  
    // Récupérer le montant de l'opération
    var montantElement = virementDiv.querySelector('.historique_montant_virement');
    var montantText = montantElement.textContent || montantElement.innerText;
    var montant = parseFloat(parseFloat(montantText.replace('€', '').trim()).toFixed(2));
  
    var banques_id = document.getElementById('banqueList_virement').value;
  
    var nom_debit_compte = virementDiv.querySelector('.historique_debit_virement');
    var debit_texte = nom_debit_compte.textContent || nom_debit_compte.innerText;
    var debit = debit_texte.replace('Débit : ','').trim();
  
    var nom_credit_compte = virementDiv.querySelector('.historique_credit_virement');
    var credit_texte = nom_credit_compte.textContent || nom_credit_compte.innerText;
    var credit = credit_texte.replace('Crédit : ','').trim(); 
  
    // operationToCompte mais dans le sens inverse
    operationToCompte(parseInt(banques_id), montant, debit); // Débiter
    operationToCompte(parseInt(banques_id), -montant, credit); // Créditer
  
    // Suppression de l'historique
    suppressionVirementHistorique(parseInt(virementId));
  
    updateVirementListHistorique(parseInt(banques_id));
  
    updateComptesListBasedOnBank(parseInt(banques_id), 'modale2');
  
    loadContent();
  }


  /**
   * Supprime tous les virements associés à une banque
   * @param {number} bankId -id de la banque
   */
  function deleteVirement(bankId) {
    // Supprime tous les virements associés à une banque (utile lors de la suppression d'une banque)
    const transaction = db.transaction(['virements'], 'readwrite');
    const store = transaction.objectStore('virements');
  
    // Créer une requête pour trouver tous les comptes avec le bankId spécifié
    const index = store.index('banques_id'); // Assurez-vous que cet index existe
    const request = index.openCursor(IDBKeyRange.only(bankId));
  
    request.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        // Supprimer chaque compte trouvé
        store.delete(cursor.primaryKey);
        cursor.continue(); // Continuer à parcourir les comptes suivants
      } else {
        // Tous les comptes associés ont été traités
        console.log('Tous les virements associées à la banque ont été supprimés');
      }
    };
  
    request.onerror = function(event) {
      console.error('Erreur lors de la suppression des virements associés', event);
    };
  }



/**
 * Vérifie que tous les éléments du modules de virement interne sont bons avant l'ajout du virement interne
 * à la base de données
 */
function virement() {
  // Captation des éléments de l'operation
  var debit = document.getElementById('compteList_virement_debit').value;
  var credit = document.getElementById('compteList_virement_credit').value;
  var banque_id = document.getElementById('banqueList_virement').value;
  var banque_name = document.getElementById('banqueList_virement').options[document.getElementById('banqueList_virement').selectedIndex].text;
  var montant = document.getElementById('virement_valeur').value;


  const date_ajout_virement_const = new Date();
  var day = ('0' + date_ajout_virement_const.getDate()).slice(-2);
  var month = ('0' + (date_ajout_virement_const.getMonth() + 1)).slice(-2);
  var year = date_ajout_virement_const.getFullYear();
  var date_ajout_virement = `${day}/${month}/${year}`;

  var date = document.getElementById('virement_date').value;
  var dateParts = date.split("-");
  var dateString = dateParts[2] + "/" + dateParts[1] + "/" + dateParts[0];

  if (!banque_id){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir une banque.');
  }
  else if (!debit){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir un compte débiteur.');
  }
  else if (!montant){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez inscrire un montant.');
  }
  else if (!credit){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir un compte créditeur');
  }
  else if(!date){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir une date de virement');
  }
  else if(credit != debit){
    addVirementToDB(parseInt(banque_id), banque_name, debit, credit, parseFloat(parseFloat(montant).toFixed(2)), dateString, date_ajout_virement);
  }else{
    showAlert('<i class="fa-solid fa-xmark"></i> Le compte débiteur et le compte créditeur doivent être différents')
  }
}
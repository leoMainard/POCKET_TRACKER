/**
 * Ajoute l'opération à l'objet Opération (historique des opérations)
 * Met à jour le montant du compte courant
 * Affiche l'opération dans l'historique du jour
 * 
 * @param {number} banque_id -id de la banque
 * @param {string} banque_name -nom de la banque
 * @param {string} category - Categorie de l'opération
 * @param {string} date -date de l'opération
 * @param {string} detail -detail de l'opération
 * @param {number} montant -montant de l'opération
 */
function addOperationToDB(banque_id, banque_name, category, detail, montant, date){
    operationToCompte(banque_id, montant);
  
    // Ajout de l'opération dans l'historique
    operationToHistorique(banque_id, banque_name, category, detail, montant, date);
  
    const transaction = db.transaction(['operations'], 'readonly');
    const store = transaction.objectStore('operations');
    const request = store.openCursor(null, 'prev');
  
    request.onsuccess = function(event) {
      let operation_id = 0;
      const cursor = event.target.result;
      if (cursor) {
        operation_id = parseInt(cursor.value.operation_id);
      }
  
      
      let colorClass = categoryColorMap[category] || "bg-divers"; // Utiliser une classe par défaut si la catégorie n'est pas trouvée
  
      // Création et configuration de la nouvelle div
      var newDiv = document.createElement('div');
      newDiv.className = 'operation_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
      newDiv.setAttribute('data-operation-id', operation_id);
      newDiv.innerHTML = `
        <p class="historique_date_operation mb-0">${date}</p>
        <p class="historique_banque_operation mb-0">${banque_name}</p>
        <p class="historique_detail_operation mb-0">${detail}</p>
        <p class="historique_category_operation badge ${colorClass[0]} text-white mb-0">${category} ${colorClass[1]}</p>
        <p class="historique_montant_operation mb-0">${montant}€</p>
        <button onclick="deleteOperationHistorique(this)" class="btn btn-danger"><i class="fas fa-trash"></i></button>
      `;
  
      // Ajouter la nouvelle div au conteneur
      var container = document.getElementById('historique_container_operation');
      container.prepend(newDiv);
  
      // Réinitialisation des champs après l'affichage des opérations
      document.getElementById('operation_detail').value = '';
      document.getElementById('operation_valeur').value = '';
  
      loadContent();
    }  
  }
  
  /**
 * Ajoute l'opération au compte, par défaut le compte courant
 * 
 * @param {number} banque_id -id de la banque
 * @param {number} montant -montant de l'opération
 * @param {string} [nom_compte='CC'] -nom du compte 
 */
  function operationToCompte(banque_id, montant, nom_compte='CC'){
    // Ajout ou soustraction du montant dans le compte CC de la banque
    const operation_compte = db.transaction(['comptes'], 'readwrite');
    const objectStore_compte = operation_compte.objectStore('comptes');
  
    const compteKey = [banque_id, nom_compte];
    const getRequest = objectStore_compte.get(compteKey);
  
    getRequest.onsuccess = function() {
      const compte = getRequest.result;
      if (compte) {
        compte.montant_compte += montant;
  
        // Sauvegarder l'enregistrement mis à jour
        const updateRequest = objectStore_compte.put(compte);
  
        updateRequest.onsuccess = function() {
          console.log('Le montant du compte a été mis à jour avec succès.');
        };
  
        updateRequest.onerror = function(event) {
          console.error('Erreur lors de la mise à jour du montant du compte', event);
        };
      } else {
        console.log('Compte non trouvé.');
      }
    };
  
    getRequest.onerror = function(event) {
      console.error('Erreur lors de la récupération du compte', event);
    };
  }
  
  /**
   * Ajoute l'opération à l'historique des opérations (objet operations)
   * @param {number} banque_id -id de la banque
   * @param {string} banque_name -nom de la banque
   * @param {string} category -category de l'opération
   * @param {string} detail -detail de l'opération
   * @param {number} montant -montant de l'opération
   * @param {string} date -date de l'opération
   */
  function operationToHistorique(banque_id, banque_name, category, detail, montant, date){
    const transaction = db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
    
    const operationData = {
      banques_id: banque_id,
      category: category,
      detail: detail,
      montant: montant,
      banque_name : banque_name,
      date: date
    };
  
    const request = store.add(operationData);
  
    request.onsuccess = function() {
        console.log('Opération ajoutée avec succès.');
      };
    request.onerror = function(event) {
      console.error("Erreur lors de l'ajout de l'opération", event);
    };
  }
  
  /**
   * Met à jour l'historique des opérations du jour
   * @param {number} banques_id -id de la banque
   */
  function updateOperationListHistorique(banques_id){
    document.getElementById('historique_container_operation').innerHTML = '';
  
    const date = new Date();
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var dateString = `${day}/${month}/${year}`;
  
    const transaction = db.transaction(['operations'], 'readonly');
    const store = transaction.objectStore('operations');
    const dateIndex = store.index('date');
    const request = dateIndex.getAll(IDBKeyRange.only(dateString));
  
    request.onsuccess = function(event) {
      const operations = event.target.result.filter(op => op.banques_id === banques_id);    
  
      // Boucler sur chaque opération récupérée
      operations.forEach(operation => {
        // Récupération et traitement des informations de l'opération
        let operation_id = operation.operation_id;
        let category = operation.category; 
        let detail = operation.detail; 
        let montant = operation.montant; 
        let date = operation.date; 
        let banque_name = operation.banque_name;
  
        let colorClass = categoryColorMap[category] || "bg-divers"; // Utiliser une classe par défaut si la catégorie n'est pas trouvée
  
        // Création et configuration de la nouvelle div
        var newDiv = document.createElement('div');
        newDiv.className = 'operation_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
        newDiv.setAttribute('data-operation-id', operation_id);
        
        // Affichage d'une opération de suppresion de compte avec un bouton de suppression désactivé
        if(detail.trim().includes("Suppression du compte")){
          newDiv.innerHTML = `
          <p class="historique_date_operation mb-0">${date}</p>
          <p class="historique_banque_operation mb-0">${banque_name}</p>
          <p class="historique_detail_operation mb-0">${detail}</p>
          <p class="historique_category_operation badge ${colorClass[0]} text-white mb-0">${category} ${colorClass[1]}</p>
          <p class="historique_montant_operation mb-0">${montant}€</p>
          <button onclick="deleteOperationHistorique(this)" class="btn btn-danger" disabled><i class="fas fa-trash"></i></button>
        `;
        }else{
          newDiv.innerHTML = `
          <p class="historique_date_operation mb-0">${date}</p>
          <p class="historique_banque_operation mb-0">${banque_name}</p>
          <p class="historique_detail_operation mb-0">${detail}</p>
          <p class="historique_category_operation badge ${colorClass[0]} text-white mb-0">${category} ${colorClass[1]}</p>
          <p class="historique_montant_operation mb-0">${montant}€</p>
          <button onclick="deleteOperationHistorique(this)" class="btn btn-danger"><i class="fas fa-trash"></i></button>
        `;
        }
        
  
        // Ajouter la nouvelle div au conteneur
        var container = document.getElementById('historique_container_operation');
        container.prepend(newDiv);
      });
  
      // Réinitialisation des champs après l'affichage des opérations
      document.getElementById('operation_detail').value = '';
      document.getElementById('operation_valeur').value = '';
    };
  
    request.onerror = function(event) {
      console.error('Erreur lors de la récupération des opérations pour banques_id ' + banques_id, event);
    };
  }
  
  /**
   * Supprime une opération de l'historique des opérations
   * @param {number} operationId -id de l'opération
   */
  function suppressionOperationHistorique(operationId){
    const transaction = db.transaction(['operations'], 'readwrite');
    const objectStore = transaction.objectStore('operations');
    const request = objectStore.delete(operationId);
  
    request.onsuccess = function(event) { 
      console.log("Opération supprimée : operation_id", operationId, event);
    };
  
    request.onerror = function(event) {
      console.error("Erreur lors de la suppression de l'opération.", event);
    };
  }
  
  /**
   * Supprime une opération de l'historique et ré-ajoute le montant de cette opération au compte courant
   * recharge l'historique des opérations et le contenu du tableau de bord
   * @param {object} button -object bouton suppression
   */
  function deleteOperationHistorique(button){
    // Récupération de l'id de l'operation
    var operationDiv = button.closest('.operation_historique');
    var operationId = operationDiv.getAttribute('data-operation-id');
  
    // Récupérer le montant de l'opération
    var montantElement = operationDiv.querySelector('.historique_montant_operation');
    var montantText = montantElement.textContent || montantElement.innerText;
    var montant = parseFloat(parseFloat(montantText.replace('€', '').trim()).toFixed(2));
  
    var montant_inverse = montant * -1;
  
    var banques_id = document.getElementById('bankList_operation').value;
  
    console.log(montant_inverse);
  
    // operationToCompte mais dans le sens inverse
    operationToCompte(parseInt(banques_id), montant_inverse);
  
    // Suppression de l'historique
    suppressionOperationHistorique(parseInt(operationId));
  
    updateOperationListHistorique(parseInt(banques_id));
  
    loadContent();
  }

  /**
   * Supprime une opération de l'historique des opérations (object operation)
   * @param {number} bankId -id de la banque
   */
  function deleteOperation(bankId) {
    // Supprime toutes les opérations liées à une banque (utile lors de la suppression de banque)
    const transaction = db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
  
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
        console.log('Toutes les opérations associées à la banque ont été supprimées');
      }
    };
  
    request.onerror = function(event) {
      console.error('Erreur lors de la suppression des opérations associées', event);
    };
  }

/**
 * Déselectionne le second bouton radio + -
 * @param {object} current -bouton radio + / -
 * @param {string} otherId -id du second bouton radio qui n'est pas sélectionné
 */
function toggleCheckbox(current, otherId) {
  if (current.checked) {
    document.getElementById(otherId).checked = false;
  }
}

/**
 * Vérifie que tous les éléments du module opérations sont correctes avant l'ajout d'une opération à l'historique
 */
function operation() {
  // Captation des éléments de l'operation
  var banque_id = document.getElementById('bankList_operation').value;
  var banque_name = document.getElementById('bankList_operation').options[document.getElementById('bankList_operation').selectedIndex].text;

  var category = document.getElementById('category').value;
  var detail = document.getElementById('operation_detail').value;
  var montant = document.getElementById('operation_valeur').value;

  var moins = document.getElementById('btn-check-minus').checked;
  var plus = document.getElementById('btn-check-plus').checked;

  const date = new Date();
  var day = ('0' + date.getDate()).slice(-2);
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  var dateString = `${day}/${month}/${year}`;

  if (!banque_id){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir une banque.');
  }
  else if (!category){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir une catégorie.');
  }
  else if (!montant){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez inscrire un montant.');
  }
  else if (!moins && !plus){
    showAlert("<i class='fa-solid fa-xmark'></i> Veuillez indiquer s'il s'agit d'une opération + ou - .");
  }
  else{

    
    // signe de l'operation
    if (moins){
      montant = '-' + montant;
    }

    montant = parseFloat(parseFloat(montant).toFixed(2));

    console.log(banque_name);

    addOperationToDB(parseInt(banque_id), banque_name, category, detail, montant, dateString);
  }

  
}
// Toutes les fonctions liées à la gestion du budget

/**
 * Vérifie que tous les éléments du module du budget sont corrects avant
 * d'ajouter le budget à l'object Budget
 */
function budget(){
    var banque_id = parseInt(document.getElementById('bankList_budget').value); 
  
    var revenu = parseInt(document.getElementById('budget_revenu').value); 
    var courses = parseInt(document.getElementById('budget_courses').value); 
    var loisirs = parseInt(document.getElementById('budget_loisirs').value); 
    var charges = parseInt(document.getElementById('budget_charges').value); 
    var abonnements = parseInt(document.getElementById('budget_abonnements').value); 
    var virements = parseInt(document.getElementById('budget_virements').value); 
    var divers = parseInt(document.getElementById('budget_divers').value); 
  
    somme_budget = courses + loisirs + charges + abonnements + virements + divers;
  
    if (!(banque_id > 0)){
      showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir une banque');
    }else if(!(revenu >= 0 && courses >= 0 && loisirs >= 0 && charges >= 0 && abonnements >= 0 && virements >= 0 && divers >= 0)){
      showAlert('<i class="fa-solid fa-xmark"></i> Remplissez tous les budgets');
    }else if(somme_budget > revenu){
      showAlert('<i class="fa-solid fa-xmark"></i> Attention, votre budget dépasse vos revenus');
    }else{
      addBudget(banque_id, revenu, courses, loisirs, charges, abonnements, virements, divers);
    }
  }
  
  /**
 * Charge le budget du mois d'une banque s'il a été créé.
 * 
 * @param {number} banque_id - id de la banque liée au budget
 */
  function loadBudget(banque_id){

    const date = new Date();
    const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`; // Format MM/YYYY
  
    // Ouvrir une transaction sur la base de données
    const transaction = db.transaction(['budget'], 'readwrite');
    const store = transaction.objectStore('budget');
  
    // Utiliser un index pour rechercher tous les budgets pour ce mois
    const index = store.index('date');
    const request = index.openCursor(IDBKeyRange.only(monthYear));
  
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        // Vérifier si ce budget correspond à la banque_id recherchée
        if (cursor.value.banque_id === banque_id) {
          // Un budget correspondant trouvé, mise à jour
          const updateData = cursor.value;
          document.getElementById('budget_revenu').value = updateData.budget_revenu;
          document.getElementById('budget_courses').value = updateData.budget_courses;
          document.getElementById('budget_loisirs').value = updateData.budget_loisirs;
          document.getElementById('budget_charges').value = updateData.budget_charges;
          document.getElementById('budget_abonnements').value = updateData.budget_abonnements;
          document.getElementById('budget_virements').value = updateData.budget_virements;
          document.getElementById('budget_divers').value = updateData.budget_divers;
  
        } else {
          cursor.continue(); // Continuer le parcours si ce n'est pas le bon enregistrement
        }
      }
    };
  
    request.onerror = (event) => {
      console.error('Erreur lors de la tentative de chargement du budget.', event);
    };
  }

/**
 * Ajoute ou modifie le budget d'une banque sur le mois en cours
 * 
 * @param {number} banque_id - id de la banque
 * @param {number} budget_revenu - montant des revenus
 * @param {number} budget_courses - montant du budget courses
 * @param {number} budget_loisirs - montant du budget loisirs
 * @param {number} budget_charges - montant du budget charges
 * @param {number} budget_abonnements - montant du budget abonnements
 * @param {number} budget_virements - montant du budget virements
 * @param {number} budget_divers - montant du budget divers
 */
  function addBudget(banque_id, budget_revenu, budget_courses, budget_loisirs, budget_charges, budget_abonnements, budget_virements, budget_divers) {
  
    const date = new Date();
    const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`; // Format MM/YYYY
    let budgetFound = false;
  
    // Ouvrir une transaction sur la base de données
    const transaction = db.transaction(['budget'], 'readwrite');
    const store = transaction.objectStore('budget');
  
    // Utiliser un index pour rechercher tous les budgets pour ce mois
    const index = store.index('date');
    const request = index.openCursor(IDBKeyRange.only(monthYear));
  
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        // Vérifier si ce budget correspond à la banque_id recherchée
        if (cursor.value.banque_id === banque_id) {
          // Un budget correspondant trouvé, mise à jour
          const updateData = cursor.value;
          updateData.budget_revenu = budget_revenu;
          updateData.budget_courses = budget_courses;
          updateData.budget_loisirs = budget_loisirs;
          updateData.budget_charges = budget_charges;
          updateData.budget_abonnements = budget_abonnements;
          updateData.budget_virements = budget_virements;
          updateData.budget_divers = budget_divers;
  
          store.put(updateData);
          showSuccess('<i class="fa-solid fa-check"></i> Budget mis à jour avec succès.');
          budgetFound = true; // Marquer qu'un budget a été trouvé et mis à jour
  
          loadContent()
        } else {
          cursor.continue(); // Continuer le parcours si ce n'est pas le bon enregistrement
        }
      } else if (!budgetFound) {
        // Si aucun budget correspondant n'a été trouvé après le parcours, ajouter un nouvel enregistrement
        const newData = {
          banque_id: banque_id,
          date: monthYear,
          budget_revenu: budget_revenu,
          budget_courses: budget_courses,
          budget_loisirs: budget_loisirs,
          budget_charges: budget_charges,
          budget_abonnements: budget_abonnements,
          budget_virements: budget_virements,
          budget_divers: budget_divers,
        };
        store.add(newData);
        showSuccess('<i class="fa-solid fa-check"></i> Nouveau budget ajouté avec succès.');
  
        loadContent()
      }
    };
  
    request.onerror = (event) => {
      console.error('Erreur lors de la tentative d\'ajout/mise à jour du budget.', event);
    };
  }
  
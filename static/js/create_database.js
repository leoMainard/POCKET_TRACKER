// Toutes les fonctions liées à la création de la base de données

/**
 * Instancie la base de données IndexedDB dans le navigateur si elle n'existe pas déjà
 */
function initDb() {
  const request = indexedDB.open('MaBaseDeDonnees', 3); // Increment the version number
  
  request.onupgradeneeded = function(event) {
    const db = event.target.result;
  
    // Création de la base banques
    if (!db.objectStoreNames.contains('banques')) {
      const banquesStore = db.createObjectStore('banques', { keyPath: 'banques_id', autoIncrement: true });
      banquesStore.createIndex('bankName', 'bankName', { unique: true });
    }

    // Création de la base comptes
    if (!db.objectStoreNames.contains('comptes')) {
      const comptesStore = db.createObjectStore('comptes', { keyPath: ['banques_id', 'nom_compte'] });
      comptesStore.createIndex('banques_id', 'banques_id', { unique: false });
      comptesStore.createIndex('montant_compte', 'montant_compte', { unique: false });
    }

    // Création ou mise à jour de la table operations
    if (!db.objectStoreNames.contains('operations')) {
      const operationsStore = db.createObjectStore('operations', { keyPath: 'operation_id', autoIncrement: true });
      operationsStore.createIndex('banques_id', 'banques_id', { unique: false });
      operationsStore.createIndex('category', 'category', { unique: false });
      operationsStore.createIndex('date', 'date', { unique: false });
      operationsStore.createIndex('date_ajout_operation', 'date_ajout_operation', { unique: false });
    }

    // Création ou mise à jour de la table virements
    if (!db.objectStoreNames.contains('virements')) {
      const virementsStore = db.createObjectStore('virements', { keyPath: 'virement_id', autoIncrement: true });
      virementsStore.createIndex('banques_id', 'banques_id', { unique: false });
      virementsStore.createIndex('compte_debit', 'compte_debit', { unique: false });
      virementsStore.createIndex('compte_credit', 'compte_credit', { unique: false });
      virementsStore.createIndex('date', 'date', { unique: false });
      virementsStore.createIndex('date_ajout_virement', 'date_ajout_virement', { unique: false });
    }

    if (!db.objectStoreNames.contains('budget')) {
      const operationsStore = db.createObjectStore('budget', { keyPath: 'budget_id', autoIncrement: true});

      operationsStore.createIndex('banques_id', 'banques_id', { unique: false });
      operationsStore.createIndex('date', 'date', { unique: false });
    }

  };

  request.onsuccess = function(event) {
    db = event.target.result;
    loadBanks(); // Charger les banques
  };

  request.onerror = function(event) {
    console.error('Erreur lors de l\'ouverture de la base de données', event);
  };
}
  

/**
 * Supprime la base de données du navigateur
 */
function deleteDatabase() {
  var request = indexedDB.deleteDatabase('MaBaseDeDonnees');

  request.onsuccess = function(event) {
    console.log('La base de données a été supprimée avec succès.');
  };

  request.onerror = function(event) {
    console.log('Erreur lors de la suppression de la base de données:', event);
  };

  request.onblocked = function(event) {
    console.log('La suppression de la base de données est bloquée:', event);
  };
}
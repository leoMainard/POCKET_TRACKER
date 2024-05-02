function initDb() {
    const request = indexedDB.open('MaBaseDeDonnees', 2);
  
    request.onupgradeneeded = function(event) {
      db = event.target.result;
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
  
      if (!db.objectStoreNames.contains('operations')) {
        const operationsStore = db.createObjectStore('operations', { keyPath: 'operation_id', autoIncrement: true });
        
        // Créer des index pour rechercher des opérations par différents attributs
        operationsStore.createIndex('banques_id', 'banques_id', { unique: false });
        operationsStore.createIndex('category', 'category', { unique: false });
        operationsStore.createIndex('date', 'date', { unique: false });
        
        // Note : Pas besoin de créer des index pour 'detail' et 'montant' à moins que vous n'ayez besoin de recherches spécifiques sur ces champs
      }
  
      if (!db.objectStoreNames.contains('virements')) {
        const operationsStore = db.createObjectStore('virements', { keyPath: 'virement_id', autoIncrement: true });
        
        // Créer des index pour rechercher des virements par différents attributs
        operationsStore.createIndex('banques_id', 'banques_id', { unique: false });
        operationsStore.createIndex('compte_debit', 'compte_debit', { unique: false });
        operationsStore.createIndex('compte_credit', 'compte_credit', { unique: false });
        operationsStore.createIndex('date', 'date', { unique: false });
        // Note : Pas besoin de créer un index pour 'montant_virement'
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
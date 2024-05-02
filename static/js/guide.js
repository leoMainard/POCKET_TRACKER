function guideOrNot(){
    var dbRequest = indexedDB.open("MaBaseDeDonnees");
  
    dbRequest.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['banques'], 'readonly'); 
      const store = transaction.objectStore('banques');
      const countRequest = store.count();
    
      countRequest.onsuccess = function() {
        const numberOfBanks = countRequest.result;
        if (numberOfBanks > 0) {
          document.getElementById('guideContainer').style.display = 'none';
          document.getElementById('selectionBanqueContent').style.display = 'block';
        } else {
          document.getElementById('guideContainer').style.display = 'flex';
          document.getElementById('selectionBanqueContent').style.display = 'none';
        }
      };
    
      countRequest.onerror = function(event) {
        console.error("Erreur lors de la récupération du nombre de banques:", event.target.error);
      };
    };
    
    dbRequest.onerror = function(event) {
      console.error("Erreur lors de l'ouverture de la base de données:", event.target.error);
    };
    
  }
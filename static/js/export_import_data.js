function exportAllIndexedDBToJson(databaseName, callback) {
    const request = indexedDB.open(databaseName);

    request.onsuccess = function(event) {
        const db = event.target.result;
        const objectStoreNames = db.objectStoreNames;
        const allData = {};
        let count = 0; // Compteur pour suivre le nombre d'object stores traités

        for (let i = 0; i < objectStoreNames.length; i++) {
            const tableName = objectStoreNames[i];
            const transaction = db.transaction(tableName, "readonly");
            const objectStore = transaction.objectStore(tableName);
            const allRecordsRequest = objectStore.getAll();

            allRecordsRequest.onsuccess = function() {
                allData[tableName] = allRecordsRequest.result;
                count++;
                // Vérifier si toutes les tables ont été traitées
                if (count === objectStoreNames.length) {
                    const jsonString = JSON.stringify(allData, null, 4);
                    callback(null, jsonString); // Appeler le callback avec les données JSON
                }
            };

            allRecordsRequest.onerror = function(event) {
                // En cas d'erreur, appeler le callback avec l'erreur
                callback(event.target.error, null);
                return; // Arrêter la boucle en cas d'erreur
            };
        }
    };

    request.onerror = function(event) {
        callback(event.target.error, null);
    };
}

function download(jsonString, fileName) {
    const blob = new Blob([jsonString], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleExport() {
    exportAllIndexedDBToJson('MaBaseDeDonnees', function(error, jsonString) {
        if (!error) {
            download(jsonString, "MaBaseDeDonneesExport.json");
            showSuccess('<i class="fa-solid fa-check"></i> Base de données téléchargée avec succès.');
        }
    });
}


function importJsonToIndexedDB(databaseName, jsonString, callback) {
    try{
        const parsedData = JSON.parse(jsonString);

        const request = indexedDB.open(databaseName);

        request.onsuccess = function(event) {
            const db = event.target.result;
            const storeNames = Object.keys(parsedData);
            const promises = [];

            storeNames.forEach(storeName => {
                const transaction = db.transaction(storeName, "readwrite");
                const store = transaction.objectStore(storeName);
                const data = parsedData[storeName];

                const clearPromise = new Promise((resolve, reject) => {
                    // Effacer les données existantes
                    const clearRequest = store.clear();
                    clearRequest.onsuccess = () => {
                        // Ajouter les nouvelles données
                        const addPromises = data.map(item => new Promise((resolve, reject) => {
                            const addRequest = store.add(item);
                            addRequest.onsuccess = resolve;
                            addRequest.onerror = () => reject(addRequest.error);
                        }));

                        // Attendre que toutes les données soient ajoutées
                        Promise.all(addPromises).then(resolve).catch(reject);
                    };
                    clearRequest.onerror = () => reject(clearRequest.error);
                });

                promises.push(clearPromise);
            });

            // Attendre la fin de toutes les transactions
            Promise.all(promises)
                .then(() => callback(null, 'Importation réussie'))
                .catch(error => callback(`Erreur lors de l'importation: ${error}`, null));
        };

        request.onerror = function(event) {
            callback(`Erreur lors de l'ouverture de la base de données: ${event.target.error}`, null);
        };
    } catch{
        showAlert(`<i class="fa-solid fa-xmark"></i> Une erreur est survenue lors de la lecture de votre fichier. Veuillez vérifier son contenu.`);
    }
}



function handleFileImport(event) {
    // Demande de confirmation avant de poursuivre
    const isConfirmed = confirm("Êtes-vous sûr de vouloir importer ce fichier ? Cela remplacera les données existantes.");
    
    if (isConfirmed) {
        const fileReader = new FileReader();
        fileReader.onload = function(fileEvent) {
            const jsonString = fileEvent.target.result;
            importJsonToIndexedDB('MaBaseDeDonnees', jsonString, function(error, message) {
                if (error) {
                    console.error(error);
                    showAlert('<i class="fa-solid fa-xmark"></i> Une erreur est survenue lors de l\'importation');
                } else {
                    console.log(message);
                    showSuccess('<i class="fa-solid fa-check"></i> Importation des données réussie.');
                    loadBanks();
                }
            });
        };
        fileReader.readAsText(event.target.files[0]);
    } else {
        // Si l'utilisateur annule, on ne fait rien de plus
        console.log("Importation annulée.");
    }

    // Réinitialiser l'input file après chaque utilisation pour permettre la réimportation du même fichier
    event.target.value = '';
}





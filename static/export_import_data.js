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
        }
    });
}


function importJsonToIndexedDB(databaseName, jsonString, callback) {
    const parsedData = JSON.parse(jsonString);
    const request = indexedDB.open(databaseName);

    request.onsuccess = function(event) {
        const db = event.target.result;
        
        Object.keys(parsedData).forEach(storeName => {
            const transaction = db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);
            const data = parsedData[storeName];

            // Effacer les données existantes dans l'object store pour éviter les doublons
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => {
                // Ajouter les nouvelles données
                data.forEach(item => {
                    store.add(item);
                });
            };

            clearRequest.onerror = function(event) {
                callback(`Erreur lors de la suppression des données existantes dans ${storeName}: ${event.target.error}`, null);
            };
        });

        // Gérer la fin de toutes les transactions
        transaction.oncomplete = function() {
            callback(null, 'Importation réussie');
        };

        transaction.onerror = function(event) {
            callback(`Erreur lors de l'importation: ${event.target.error}`, null);
        };
    };

    request.onerror = function(event) {
        callback(`Erreur lors de l'ouverture de la base de données: ${event.target.error}`, null);
    };
}

function handleFileImport(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(fileEvent) {
        const jsonString = fileEvent.target.result;
        importJsonToIndexedDB('MaBaseDeDonnees', jsonString, function(error, message) {
            if (error) {
                console.error(error);
            } else {
                console.log(message);
                alert("Importation réussie.");
            }
        });
    };
    fileReader.readAsText(event.target.files[0]);
}
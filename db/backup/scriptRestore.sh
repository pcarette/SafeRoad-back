#! /bin/bash

# Attendre que MongoDB soit prêt
until nc -z localhost 27017; do
  echo "Attente de MongoDB..."
  sleep 2
done

# Restaurer la base de données
mongorestore --host localhost --db SafeRoad-back /backup/SafeRoad-back

echo "Restauration de la base de données terminée."

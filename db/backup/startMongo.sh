#!/bin/bash

# Démarrer la restauration en arrière-plan
/backup/scriptRestore.sh &

# Lancer MongoDB en tant que processus principal avec exec
exec mongod --bind_ip_all

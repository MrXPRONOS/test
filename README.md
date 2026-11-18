# GW Suivi — Greatness Winner

Application PWA de gestion des employés, tâches, délais et primes de performance.

## Infrastructure

- GitHub : code source et versions.
- Cloudflare Workers : hébergement du site et API sécurisée.
- Cloudflare D1 : données partagées (comptes, employés, missions, primes).
- IndexedDB + Service Worker : données affichables et changements mis en file hors connexion.

## Sécurité

- Le premier administrateur se crée avec le code d’activation fourni séparément (jamais commis dans le dépôt).
- L'administrateur doit créer un employé et partager personnellement le code d’invitation généré. L’employé peut alors créer son accès.
- Les permissions sont vérifiées côté Worker ; un employé n’a accès qu’à ses missions, ne peut pas définir sa prime ou approuver ses tâches.
- Prime accordée après validation par l'administrateur et sous réserve du délai de soumission **reçu par le serveur**, ou dérogation explicite.
- Comptes et sessions protégés par mot de passe PBKDF2 et jetons aléatoires stockés côté serveur sous leur empreinte SHA-256.

## Hors ligne

Après une première ouverture connectée, l’application enregistre le shell PWA et les derniers enregistrements en local. Les opérations hors ligne rejoignent une file persistante, rejouée au retour du réseau. **Limites** : l’effacement des données navigateur supprime ce cache ; les conflits simultanés complexes ne sont pas fusionnés automatiquement ; il ne s’agit ni de preuves d’horodatage certifiées ni de paiements automatiques.

## Déploiement Cloudflare

La base doit être créée séparément, puis initialisée avec `cloudflare/schema.sql`. Le Worker `cloudflare/worker.js` importe `cloudflare/asset-bundle.js` généré depuis les ressources statiques pour l’envoi direct via API Cloudflare. Le Worker est associé à D1 par un binding nommé `DB`.

Pour un premier déploiement, un code d'activation aléatoire est généré hors du code source ; seule son empreinte est enregistrée dans la table `settings` sous la clé `setup_code_hash`.

Le déploiement Cloudflare peut être connecté au dépôt GitHub via le tableau de bord pour les mises à jour continues. La version livrée dans le dépôt contient tous les fichiers source, mais pas les identifiants confidentiels ni les mots de passe.

## Tester

L'application PWA exige HTTP sur `localhost` ou HTTPS sur Internet. Mode production activé dans `config.js`. Le script `TESTS-simulation.cjs` teste le parcours logique de démonstration en simulant un contexte navigateur, sans valider à lui seul la sécurité et la synchronisation serveur.
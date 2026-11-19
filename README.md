# GW Suivi — Greatness Winner (V1.3)

Application PWA de gestion des employés, missions, échéances et primes.

## Version de production

- Application : https://gw-suivi.pages.dev
- Code source : https://github.com/MrXPRONOS/test (branche `main`)
- Serveur : Cloudflare Pages `_worker.js`, API + front-end statique embarqué
- Données : base D1 `gw-suivi-production` (binding `DB`), migrations successives non destructives

## Création de comptes et partage des accès

- Trois modes : **e-mail seul**, **numéro WhatsApp seul** (sans boîte Gmail), ou **les deux**.
- Sur la page « Responsables », seul le Super admin peut inviter un administrateur.
- Sur la page « Employés », chaque responsable peut ajouter un employé.
- Dans les deux cas, il faut un nom et au moins un contact.
- Cloudflare génère un **lien d'activation personnel** valable 7 jours, renouvelable. Le lien comprend un jeton aléatoire dans le fragment `#invite=…` ; seule l'empreinte est stockée dans D1.
- Après la création, cliquer sur **Envoyer via WhatsApp** ou **Envoyer par e-mail** pour ouvrir une conversation ou un brouillon prérempli. **L'expéditeur doit confirmer l'envoi** dans WhatsApp ou dans son application de messagerie. L'application n'envoie pas automatiquement les messages et ne prétend pas disposer d'une API WhatsApp Business / SMTP configurée.
- Le destinataire ouvre le lien et définit un mot de passe (12 caractères minimum). L'activation ne fonctionne qu'une fois.
- La connexion accepte l'e-mail ou le téléphone ; les numéros togolais à 8 chiffres sont interprétés comme +228, sinon renseigner l'indicatif international.
- Un responsable peut regénérer le lien d'un employé non activé (« Envoyer l’accès »). Le Super admin peut régénérer un lien d'administrateur en attente. Les anciens liens sont invalidés.

## Modèle de données et migration

L'ancienne base D1 avait `email NOT NULL UNIQUE`. Pour conserver les comptes et les clés étrangères existants sans reconstruction destructive, un compte exclusivement téléphonique reçoit une **adresse interne technique non distribuable** (`phone-<num>@gw-suivi.invalid`). Elle n'est **jamais présentée à l'utilisateur** comme une adresse e-mail et n'est **jamais utilisée pour envoyer des messages**. Les coordonnées réelles sont dans `phone` et dans `email` uniquement quand une adresse existe.

Migration : `cloudflare/migration-v1.3.sql`. Les nouvelles colonnes `phone`, `invite_code_hash`, `invite_expires_at` et les index d'unicité assurent la coexistence avec les comptes V1.2. Les codes d'invitation historiques continuent d'être acceptés pendant la transition.

## Sécurité et réserves

- Validation des rôles et des jetons côté Cloudflare, sessions aléatoires, PBKDF2-SHA256, D1 préparé.
- Un lien d'activation est un secret : le partager **uniquement à la personne prévue**. La possession du lien permet l'activation ; sans vérification indépendante des coordonnées, une interception du lien est un risque.
- La livraison effective des messages WhatsApp et e-mail dépend de l'utilisateur, du téléphone et de l'application de messagerie.
- L'application ne vérifie pas encore la propriété du numéro par OTP, ni celle de l'adresse e-mail par un lien de confirmation indépendant. Une API WhatsApp Business ou un service d'envoi e-mail serait nécessaire pour envoyer de façon totalement automatique.
- La PWA continue de conserver les tâches hors connexion. **Créer un compte ou un lien exige Internet**, car le secret doit être généré côté serveur.
- Les réponses API ne sont pas stockées dans le cache Service Worker.

## Développement et vérification

Les sources sont `app.js`, `styles.css`, `cloudflare/worker.js`, `cloudflare/schema.sql`, `cloudflare/migration-v1.3.sql`. Reconstruire le Worker embarqué avec `python cloudflare/build-bundle.py`. Tests de parcours : `node test-v13.mjs`; test de la démo locale : `node TESTS-simulation.cjs`.
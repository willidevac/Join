# Join

Join is a learning project for a Kanban project management tool.

## Application architecture

Join uses a multi-page architecture. The HTML files in the project root are
small route entry documents; all visible UI markup remains organized by Atomic
Design in `components/html`. Each entry document declares its route through
`data-page`, while `main.js` loads the matching page component and shared app
layout. Shared page layouts live in `components/html/templates`, while images
and icons are stored below `components/assets/img`.

## Firebase setup

The app expects a local Firebase web config file at:

```text
components/js/firebaseConfig.js
```

This file is intentionally ignored by Git. To run Firebase features locally,
copy the example file:

```powershell
copy components\js\firebaseConfig.example.js components\js\firebaseConfig.js
```

Then replace the placeholder values in `firebaseConfig.js` with the Firebase
web app config from the project.

Without this local file, Firebase cannot initialize. Email/password login,
guest login, Firestore tasks and Firestore contacts will therefore be
unavailable.

### Retrieve the config with the Firebase CLI

Each team member needs access to the Firebase project `join-teamjob` and must
run these commands locally from the project directory.

Check Node.js and the current Firebase CLI:

```powershell
node --version
npx -y firebase-tools@latest --version
```

Sign in and select the shared project:

```powershell
npx -y firebase-tools@latest login
npx -y firebase-tools@latest projects:list
npx -y firebase-tools@latest use join-teamjob
```

List the registered apps and copy the App ID of the `WEB` app:

```powershell
npx -y firebase-tools@latest apps:list --project join-teamjob
$appId = "PASTE_THE_WEB_APP_ID_HERE"
```

Retrieve the SDK config and create the ignored local config file:

```powershell
$config = (
  npx -y firebase-tools@latest apps:sdkconfig WEB $appId --project join-teamjob |
  Out-String
).Trim()

"window.joinFirebaseConfig = $config;`r`n" |
  Set-Content -Encoding utf8 .\components\js\firebaseConfig.js
```

Verify the generated file without printing its complete contents:

```powershell
Test-Path .\components\js\firebaseConfig.js
node --check .\components\js\firebaseConfig.js
Select-String -Path .\components\js\firebaseConfig.js -Pattern "projectId|authDomain"
git check-ignore -v .\components\js\firebaseConfig.js
```

The selected config must point to the Firebase project `join-teamjob`. Start
Join through a local web server and open it through `localhost`, not directly
as a `file://` URL.

```powershell
python -m http.server 5500 --bind localhost
```

Then open `http://localhost:5500/index.html`.

If `projects:list` does not show `join-teamjob`, ask a Firebase project owner
to add the Google account as a project member. Do not create a second Firebase
project for the local setup.

Do not commit private credentials, service account files, passwords, API
secrets, or admin keys to this repository.

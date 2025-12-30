# Git Workflow - Zumik

## ✅ État Actuel

Votre repository Git est maintenant **propre et configuré correctement** !

```
✅ Branche principale : main
✅ Branche locale : main
✅ Branche distante : origin/main
✅ Tracking configuré : main → origin/main
✅ Aucune branche master résiduelle
```

---

## 📊 Historique des Commits

```
* 1388c94 (HEAD -> main, origin/main) feat: Add complete backend infrastructure with Auth feature
* 97faec9 first commit
```

---

## 🔄 Workflow Git Recommandé

### 1. Vérifier l'état actuel

```bash
git status
```

### 2. Ajouter des changements

```bash
# Ajouter tous les fichiers modifiés
git add -A

# OU ajouter des fichiers spécifiques
git add backend/src/features/new-feature/
```

### 3. Commiter avec un message descriptif

```bash
git commit -m "feat: Add new feature description"
```

**Format de message recommandé** :
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Modification de documentation
- `refactor:` - Refactoring du code
- `test:` - Ajout/modification de tests
- `chore:` - Tâches de maintenance

### 4. Pousser vers GitHub

```bash
# Push simple (quand tout est à jour)
git push

# OU spécifier explicitement
git push origin main
```

---

## 🚫 Commandes à ÉVITER

### ❌ Ne JAMAIS utiliser `master`

```bash
# ❌ INCORRECT
git checkout master
git push origin master

# ✅ CORRECT
git checkout main
git push origin main
```

### ⚠️ Force Push avec précaution

```bash
# ⚠️ À utiliser UNIQUEMENT si vous êtes seul sur le projet
git push --force origin main

# ✅ Plus sûr : force with lease (vérifie qu'on n'écrase pas le travail des autres)
git push --force-with-lease origin main
```

---

## 🌿 Travailler avec des Branches (pour features futures)

### Créer une nouvelle branche

```bash
# Créer et se déplacer sur une nouvelle branche
git checkout -b feature/friends-system

# OU en 2 commandes
git branch feature/friends-system
git checkout feature/friends-system
```

### Pousser la branche sur GitHub

```bash
git push -u origin feature/friends-system
```

### Merger une branche dans main

```bash
# Se placer sur main
git checkout main

# Merger la feature branch
git merge feature/friends-system

# Pousser les changements
git push
```

### Supprimer une branche après merge

```bash
# Supprimer localement
git branch -d feature/friends-system

# Supprimer sur GitHub
git push origin --delete feature/friends-system
```

---

## 🔧 Commandes Utiles

### Voir l'historique

```bash
# Historique simple
git log --oneline -10

# Historique avec graph
git log --oneline --graph --all
```

### Annuler des changements

```bash
# Annuler les modifications non commitées
git restore <file>

# Annuler le staging
git restore --staged <file>

# Annuler le dernier commit (garde les changements)
git reset --soft HEAD~1

# Annuler le dernier commit (supprime les changements)
git reset --hard HEAD~1
```

### Synchroniser avec GitHub

```bash
# Récupérer les changements sans merge
git fetch origin

# Récupérer et merger
git pull origin main

# Nettoyer les références distantes supprimées
git fetch --prune
```

---

## 🐛 Résoudre des Problèmes Courants

### "Your branch is behind..."

```bash
# Récupérer et merger les changements distants
git pull origin main
```

### "Updates were rejected (non-fast-forward)"

```bash
# Option 1 : Pull puis push
git pull origin main
git push origin main

# Option 2 : Force push (⚠️ si seul sur le projet)
git push --force origin main
```

### "Untracked files"

```bash
# Voir quels fichiers ne sont pas trackés
git status

# Les ajouter
git add <file>

# Ou les ignorer dans .gitignore
echo "file-to-ignore.txt" >> .gitignore
```

### Nettoyer les branches obsolètes

```bash
# Lister toutes les branches
git branch -a

# Supprimer les références distantes supprimées
git fetch --prune

# Supprimer les branches locales mergées
git branch --merged | grep -v "main" | xargs git branch -d
```

---

## 📝 .gitignore

Votre `.gitignore` actuel ignore :

```
node_modules/       # Dépendances npm
.env                # Variables d'environnement
dist/               # Build output
*.log               # Logs
.DS_Store           # macOS files
.claude/            # Claude Code cache
```

Pour ajouter d'autres fichiers à ignorer :

```bash
echo "mon-fichier-secret.txt" >> .gitignore
git add .gitignore
git commit -m "chore: Update gitignore"
```

---

## 🎯 Workflow Recommandé pour Futures Features

### Exemple : Ajouter la feature Friends

```bash
# 1. Créer une branche
git checkout -b feature/friends-system

# 2. Coder la feature
# ... développement ...

# 3. Commiter régulièrement
git add backend/src/features/friends/
git commit -m "feat: Add friends feature"

# 4. Pousser sur GitHub
git push -u origin feature/friends-system

# 5. Créer une Pull Request sur GitHub (optionnel mais recommandé)
# Via l'interface GitHub

# 6. Merger dans main
git checkout main
git merge feature/friends-system
git push

# 7. Supprimer la branche
git branch -d feature/friends-system
git push origin --delete feature/friends-system
```

---

## 🔗 Ressources

- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Documentation](https://git-scm.com/doc)

---

## 🆘 Besoin d'Aide ?

En cas de problème grave :

```bash
# Voir l'état de tout
git status
git log --oneline --graph --all -10
git branch -a

# Créer une sauvegarde locale avant toute action drastique
git branch backup-$(date +%Y%m%d)
```

---

**Dernière mise à jour** : 2025-01-15

# Configuration Paramétrable des Champs

## Vue d'ensemble

La configuration des champs est maintenant **centralisée et paramétrable**. Cela signifie :

✅ **Une source unique** - Les champs sont définis une seule fois
✅ **Réutilisable** - Mêmes champs en création et édition
✅ **Flexible** - Facile à modifier sans toucher au code des composants
✅ **Maintenable** - Tous les champs en un seul endroit

---

## Fichier de Configuration

**Localisation** : `lib/field-config.ts`

### Structure d'un champ

```typescript
{
  name: "nom",                          // Nom du champ (identifiant HTML)
  label: "Raison Sociale *",            // Label affiché
  type: "text",                         // Type d'input
  required: true,                       // Champ obligatoire ?
  placeholder: "Nom légal...",          // Texte d'aide
  options: [...],                       // Pour les select (optionnel)
  help: "Aide supplémentaire",          // Texte d'aide sous le champ
}
```

### Types supportés

```typescript
"text"; // Texte simple
"email"; // Email
"tel"; // Téléphone
"number"; // Nombre
"date"; // Date
"select"; // Dropdown avec options
"textarea"; // Texte multi-ligne
```

### Organisation en Sections

```typescript
export const CLIENT_SECTIONS: FormSection[] = [
  {
    id: "identity",                     // ID unique
    title: "Identité & Administration", // Titre affiché
    icon: "User",                       // Icône (optionnel)
    columns: 2,                         // 1 ou 2 colonnes
    fields: [...]                       // Tableau de champs
  },
  // ... autres sections
];
```

---

## Utilisation dans les Pages

### Exemple pour Clients

```typescript
import { CLIENT_SECTIONS } from "@/lib/field-config";
import { DynamicForm } from "@/components/form/DynamicForm";

export default function EditClientPage() {
  const [formData, setFormData] = useState({...});
  const [fieldErrors, setFieldErrors] = useState({});

  return (
    <DynamicForm
      sections={CLIENT_SECTIONS}
      formData={formData}
      fieldErrors={fieldErrors}
      onChange={handleChange}
      layout="accordion"  // ou "tabs"
    />
  );
}
```

### Exemple pour Projets

```typescript
import { PROJECT_SECTIONS } from "@/lib/field-config";

<DynamicForm
  sections={PROJECT_SECTIONS}
  formData={formData}
  fieldErrors={fieldErrors}
  onChange={handleChange}
  layout="tabs"      // Projets utilisent les tabs
/>
```

---

## Personnalisation

### 1. Ajouter un champ

```typescript
// Dans lib/field-config.ts
{
  id: "identity",
  fields: [
    // ... champs existants
    {
      name: "newField",
      label: "Mon Nouveau Champ",
      type: "text",
      required: false,
      placeholder: "Exemple",
    }
  ]
}
```

### 2. Masquer une section complète

```typescript
import { getVisibleSections, CLIENT_SECTIONS } from "@/lib/field-config";

// Afficher seulement certaines sections
const visibleSections = getVisibleSections(CLIENT_SECTIONS, [
  "identity",
  "location"
]);

<DynamicForm sections={visibleSections} {...props} />
```

### 3. Modifier les options d'un select

```typescript
// Dans lib/field-config.ts
{
  name: "type",
  label: "Type de Client",
  type: "select",
  options: [
    { label: "PME", value: "PME" },
    { label: "ETI", value: "ETI" },
    { label: "Startup", value: "Startup" },  // Nouveau
    // ... autres options
  ]
}
```

---

## Configuration en Base de Données (Futur)

Pour une flexibilité maximale, la configuration pourrait être déplacée en base de données :

```typescript
// Charger depuis l'API
const sections = await fetch("/api/admin/field-config").then(r => r.json());

<DynamicForm sections={sections} {...props} />
```

Cela permettrait aux administrateurs de modifier les champs en temps réel sans redéployer.

---

## Avantages

| Avant                                    | Après                       |
| ---------------------------------------- | --------------------------- |
| Champs dispersés dans plusieurs fichiers | Champs centralisés          |
| Création et édition différentes          | Mêmes champs partout        |
| Difficile à maintenir                    | Facile à modifier           |
| Duplication de code                      | DRY (Don't Repeat Yourself) |

---

## Prochaines Étapes

1. **Appliquer à Clients** - Utiliser DynamicForm pour client/[id]/edit
2. **Appliquer à Projets** - Utiliser DynamicForm pour projects/[id]/edit
3. **Tests** - Vérifier que tous les champs s'affichent
4. **Envisager DB** - Charger la configuration depuis une base de données

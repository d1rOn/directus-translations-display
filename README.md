# Description
This extension displays translations on the language that the user currently using.
Supports nested structures.

# Example
Assume that you have `translations` collection with `name` field.
```
{{name}}
```

Or you have `Blog Post` collection with field `category` that is related to `Blog Category` collection as m2o, that has translations with field `title`.
In this case you should setup directus-translations-display on `category` field with such template:
```
{{translations.name}}
```

# Build
```
npm i
npx directus-extension build
```

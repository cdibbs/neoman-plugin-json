[![Build Status](https://travis-ci.org/cdibbs/neoman-plugin-json.svg?branch=master)](https://travis-ci.org/cdibbs/neoman-plugin-json)
[![dependencies Status](https://david-dm.org/cdibbs/neoman-plugin-json/status.svg)](https://david-dm.org/cdibbs/neoman-plugin-json)
[![devDependencies Status](https://david-dm.org/cdibbs/neoman-plugin-json/dev-status.svg)](https://david-dm.org/cdibbs/neoman-plugin-json?type=dev)
[![codecov](https://codecov.io/gh/cdibbs/neoman-plugin-json/branch/master/graph/badge.svg)](https://codecov.io/gh/cdibbs/neoman-plugin-json)

[![MIT License][license-badge]][LICENSE]
[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]

# Neoman JSON Plugin

This is the official JSON transform plugin for the [Neoman](https://github.com/cdibbs/neoman) templating engine. Use it to transform
JSON files without modifying original whitespace and formatting.

## Basic Usage

Within your `.neoman.config/template.json` file, add something like the following to your `configurations` and `transform` sections:

```json
"#": "The following presumes variables configured in the inputConfig section.",
"transform": [
    { "subject": "$.name", "with": "{{userEnteredName}}", "using": "json" },
    { "subject": "$.scripts.test", "using": "json", "params": { "action": "remove" } },
    { "subject": "$.tags", "with": "{{userTags}}", "using": "json", "params": { "action": "append" } },
    { "subject": "$._publicDescr", "with": "description", "using": "json", "params": { "action": "setKey" }},
    { "subject": "$.someValue", "with": "3.14", "using": "json", "params": { "action": "set", "type": "number" } }
]
"configurations": {
    "json": {
        "files": ["package.json"],
        "plugin": "json"
    }
}
```

## Fields

The `subject` field uses the subset of JSONPath that identifies a single destination element. JSONPath semantics which
allow you to specify more than one destination element are not currently supported.

The `with` field follows the same behavior as the rest of Neoman.

The `using` field refers to an entry in the `configurations` section which configures an instance of this plugin.

The `params` field in Neoman can have anything in it. This plugin defines several such subfields. See [Params](#Params).

## Params

Here is a list of parameters accepted from the `params` field:

### The `action` field

Specifies the transform operation. Defaults to `set`.

- "set" (default) - sets the field specified by the JSONPath, and according to the `type` field.
- "setKey" - If an object, sets the key specified by the JSONPath. Else, throws.
- "append" - If an array or object, will append element(s) to the end. If a string, appends value. Else, throws.
- "prepend" - Same as append, but applies to the beginning.
- "insertAfter" - Inserts after the current element of the array or object.
- "insertBefore" - Inserts before the current element.
- "remove" - Removes the element (and key, if any), entirely.

### The `type` field

Specifies the field type to use when transforming (inserting, setting, etc). Defaults to `useSource`.

- "useDestination" - Identifies the type being replaced and attempts a conversion to the same.
- "useSource" (default) - Uses the value provided by `with`. If `with` is a string, it will always be a string. If `with` is a handler, it will be the type of value returned by the handler.
- "string" - Converts to a string, escapes and adds quotes.
- "verbatim" - Performs no conversion, using the `with` field value as is.
- "boolean" - Converts to a literal "true" or "false" without quotes.
- "number" - Attempts conversion to a number. Throws on failure.
- "object" - Attempts JSON serialization.
- "array" - Attempts JSON serialization.
- "null" - inserts a literal "null" without quotes.

### The `ignoreInvalid` field

Boolean: true or false. Default: false.

If the transform operation results in invalid JSON (according to ECMA-262 5th Edition, 15.12.1), the default action is to throw an error. You can override this behavior with `ignoreInvalid: true`, but be forewarned that any future JSON transforms over the same file will probably fail due to parsing errors.

### Pre-launch To Do

1. Add type field to transform elements (in addition to input section). Let users specify, e.g., that their "with" is JSON or a number.
2. Add option to reserialize/normalize resulting JSON. Discards original formatting.
3. Constructor and per-run params should be available in configurations section. Transform-specific params will override these.

[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg
[LICENSE]: https://github.com/cdibbs/neoman-plugin-json/blob/master/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/cdibbs/neoman-plugin-json/blob/master/other/code_of_conduct.md

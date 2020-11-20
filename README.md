Micro Pipeline: Components
==========================

## Creation from CLI
You can use the `micro-pipeline` CLI to create a component like so:

**For Javascript:**
```bash
micro-pipeline create component "My Component" node
```

**For Python:**
```bash
micro-pipeline create component "My Component" python
```

This will create a skeleton component file in either the path provided in a config or default to `./services/components`.

## Naming Convention
Components have a snake_cased filename and hold the same name as a property at minimum:

**Javascript:**
```javascript
const { Component } = require('../../utils/classes/Component');

const SomeComponent = Component({
	name: 'some_component'
});
```

**Python:**
```python
import os
import sys

ROOT_DIR = os.getcwd()
sys.path.insert(0, ROOT_DIR)

from utils.classes.Component import Component

class SomeComponent(Component):
	name: 'some_component'
```

Class names follow usual conventions of StarCase.

**Javascript:**
```javascript
const { IntentMatcher } = require('./services/components/intent_matcher');
```
**Python:**
```python
from services.components.language_manager import LanguageManager
```

## Exporting
You can either import services as modules "inline" or call their methods from the command line.

### As Modules
To turn a component into a requirable module in NodeJS, use the common object denotation:
`module.exports = { SomeComponent };`
In Python, you can use them as-is.

### As CLI
To turn a component into a CLI, use the command `export_as_cli`:

**Javascript / Python:**
```javascript
SomeComponent.export_as_cli()
```

## Manual Creation
If you create your component by hand, make sure your file is executable by adding a Shebang at the top of it…

**Javascript:**
```javascript
#!/usr/bin/env node
```
**Python:**
```python
#!/usr/bin/env python3
```

…and by giving it execution permissions (**bash**)…
```bash
chmod +x ./services/components/some_component.py
```

…to then run the methods:
```bash
./services/components/some_component.py fetch_data "parameter" 15 "{ \"sub-param\": \"value\" }"
```

The Component class will automagically look at the parameter defaults of your service's methods and try to parse parameters passed through the CLI accordingly. 

Consider the following example component (**Javascript**):
```javascript
const RecipeFetcher = new Component({
	name: 'recipe_fetcher',
	counts: 0,

	get_ingredients(ingredient_name, max_count=10, normalize=true, options={}) {
		...
	}
});

RecipeFetcher.export_as_cli();
module.exports = { RecipeFetcher };
```
We pass the following arguments via CLI:
```bash
./services/components/recipe_fetcher.py get_ingredients "Onion Soup" 15 false "{ \"pepper\": false }"
```

The component class will automatically parse 15, false, and the passed JSON string as JSON and use the true datatypes.

#### Named Arguments
You can pass named arguments by prefixing the parameter names with two hyphens instead:

```bash
/services/components/recipe_fetcher.py get_ingredients --ingredient_name "Mangosteen" --normalize=1
```

Properties for the component class can be passed the same way. Arguments that don't match method names will be applied as properties. Any hyphens will be replaced by underscores, meaning `--user-id` will be read as `user_id`.

```bash 
/services/components/recipe_fetcher.py get_ingredients --user-id=1337 --ingredient_name="Capers"
``` 

#### Method Chaining
Methods can be chained using the chain notation (beware that spacing is crucial):

```bash
/services/components/recipe_fetcher.py [ load_ingredients "all" , get_ingredients "Pepper" 12 ]
```
will first run ```RecipeFetcher.load_ingredients("all")```, then ```RecipeFetcher.get_ingredients("Pepper", 12)``` and return a dictionary of results for each execution.

### Caching
To cache individual methods in **JavaScript**, use the `cached_methods` property array:

```javascript
	const RecipeFetcher = new Component({
		name: 'recipe_fetcher',
		cached_methods: ['heavy_computational_task'],
		...
```

To cache individual methods in **Python**, you can use a `cached` decorator:

```python
	from utils.classes.Cache import cached

	class RecipeFetcher(Component):
		@cached
		def heavy_computational_task():
			...
```

A JSON cache will be auto-generated in `/data/caches/<component_name>.cache.json`.

## API
Components provide the following interface:

### Events
Components and utility classes all emit events that can be listened to. You can attach event listeners using the `on` method.

**JavaScript:**
```javascript
RecipeFetcher.on('spawn', (self) => console.log('RecipeFetcher loaded.'));
```

**Python:**
```python
RecipeFetcher.on('spawn', lambda self: print('RecipeFetcher loaded.'))
```

The following events are available on every component:

| Event Name | Triggered … | passed arguments |
| ---------- | ----------- | ---------------- |
| `spawn` | once on initialization | `self` instance, needs to be returned back |
| `init` | every time the component is being updated using `ComponentName.init(...)` | `self` instance, `options` object  |
| `cache` | every time a method's cache is being hit | `key` used to retrieve value from cache |
| `call_from_cli` | once upon calling the component from the command line | `command` is the called method, `args` the passed arguments, `verbose` to turn console output on/off |

To _trigger_ (e.g. your own) events, use the `trigger` method:

```python
RecipeFetcher.trigger('recipe_outdated', ['some', 'arguments'])

```

If the event handler returned something, it will be passed through trigger as return value.

```python
new_recipe = RecipeFetcher.trigger('recipe_outdated', [old_recipe])

```

----------

### Properties
You can access non-callable properties from the CLI using the component module's built-in get and set methods in your terminal:
```bash
./services/components/recipe_fetcher.py get counts 	# returns 1
```
```bash
./services/components/recipe_fetcher.py set counts 3
```

----------
### Shortcuts
All components automatically get a `help` method, so if uncertain about properties run `./services/components/recipe_fetcher.py help`.
All methods automatically get a `--help` directive, so if uncertain about parameters run `./services/components/recipe_fetcher.py get_ingredients --help`.

### Integration
You can call components written in Javascript from Python and vice-versa as if they were written in the same language using the `Component` module.

Our previous _RecipeFetcher_ example was written in Javascript, but now we want to use it in Python. Here's how:

**Javascript:**
```javascript
const { Component } = require('./utils/classes/component');

const { RecipeFetcher } = Component('./services/components/recipe_fetcher.py').from_cli();
let ingredients = RecipeFetcher.get_ingredients("Onion Soup", 15, false, { pepper: false });

```
**Python:**
```python
from utils.classes.Component import Component

RecipeFetcher = Component('./services/components/recipe_fetcher.js').from_cli()
ingredients = RecipeFetcher.get_ingredients("Onion Soup", 15, False, { "pepper": False })

```

To access properties, use the built-in property getters and setters (see "Properties"), like so:

**Javascript:**
```javascript
const { Component } = require('./utils/classes/component');

RecipeFetcher = Component('./services/components/recipe_fetcher.py');
const counts = RecipeFetcher.get("counts");

```
**Python:**
```python
from utils.classes.Component import Component

RecipeFetcher = Component('./services/components/recipe_fetcher.js')
counts = RecipeFetcher.get("counts")

```

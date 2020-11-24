Micro Components for NodeJS
===========================

Lightweight library to create components that can automagically be used as either CLI or as native classes in other programming languages

[![npm][npm-badge]][npm] [![npm][travis-badge]][npm]

[npm]: https://www.npmjs.org/package/micro-components
[npm-badge]: https://img.shields.io/npm/v/micro-components.svg?style=flat-square
[travis-badge]: https://travis-ci.com/polygoat/micro-components-js.svg?token=Lq7sM5SEXeYPspCGGGdD&branch=main

_The same package is available [for Python][]. [Check it out][] if you want Node and Python components talking to each other!_

[for Python]: https://github.com/polygoat/micro-components-py
[Check it out]: https://github.com/polygoat/micro-components-py

## Goals & Design

Often times, which programming language I pick is predetermined by technical requirements and the resources available in that language. In many cases I have to use a mixture of nodejs, Python, and bash scripts, and they all have to talk to each other.

The intent of this library is to provide a utility class turning [Singleton classes][] into command line interfaces and providing an intuitive class interface between different programming languages. Since a lot of the code I produce is either Node or Python, I started by creating components for those two languages.

The beauty of this is that components have a simple JSON interface to talk to each other, irregardless of the programming language. Any other language implementing the Component interface can now be imported as if it were a native class.

[Singleton classes]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static

## Installation

In your terminal run:

```bash
$ npm i micro-components-js
```

To install the CLI, run:

```bash
$ npm link micro-components-js
```

## Usage

To run a component from the terminal, you need the following structure at minimum:

```javascript
const { Component } = require('micro-components-js');

const TaskRunner = Component({
	name: 'task_runner',

	run(task_id) {
		return { task_id, status: 'running' };
	}

}).export_as_cli();
```

To then be able to run one of the following commands from your terminal:

```bash
$ taskrunner.js run 95
# output: { "task_id": 95, "status": "running"  }
```

```bash
$ taskrunner.js run --task-id="hello world"
# output: { "task_id": "hello world", "status": "running"  }
```

```bash
$ taskrunner.js run --task-id="[5,9,true]"
# output: { "task_id": [5, 9, true], "status": "running"  }
```

**Example of Python and Node components interacting:**

_Consider this Python component called `task_logger.py`:_

```python
from micro_components import Component

class TaskLogger(Component):
	name: 'task_logger',

	@staticmethod
	def log(infos):
		with open('log.json', 'w') as log_file:
			log_file.write(infos)

TaskLogger.export_to_cli()
```

We can now use TaskLogger from within our task_runner**.js** code:

```javascript
const { Component } = require('micro-components-js');
const { TaskLogger } = Component.from_cli('./task_logger.py');

const TaskRunner = Component({
	name: 'task_runner',

	run(task_id) {
		const result = { task_id, status: 'running' };
		TaskLogger.log(result);
		return result;
	}

}).export_as_cli();
```

## Creation from Terminal
You can use the `micro-components` CLI to create a component like so:

**In your terminal:**
```bash
$ micro-components create "My Component"
```

This will create a skeleton component file in your current directory.

## Naming Convention
Components have a snake_cased filename and hold the same name as a property at minimum:

```javascript
const { Component } = require('micro-components-js');

const SomeComponent = Component({
	name: 'some_component'
});
```

Class names follow usual conventions of StartCase.

```javascript
const { IntentMatcher } = require('./components/intent_matcher');
```

## Exporting
You can use one of two export methods to either import components as modules "inline" or call their methods from the command line.

### As Modules
To turn a component into a requirable module in NodeJS, use:
```javascript
SomeComponent.export_as_(module);
```

### As CLI
To turn a component into a CLI, use the command `export_as_cli()`:

```javascript
SomeComponent.export_as_cli();
```

## Manual Creation
If you create your component by hand, make sure your file is executable by adding a Shebang at the top of it…

```javascript
#!/usr/bin/env node
```

…and by giving it execution permissions (in your **terminal**)…
```bash
$ chmod +x ./components/some_component.js
```

…to then run the methods:
```bash
$ ./components/some_component.js fetch_data "parameter" 15 "{ \"sub-param\": \"value\" }"
```

The Component class will automagically look at the parameter defaults of your component's methods and try to parse parameters passed through the CLI accordingly. 

Consider the following example component:
```javascript
const RecipeFetcher = new Component({
	name: 'recipe_fetcher',
	counts: 0,

	get_ingredients(ingredient_name, max_count=10, normalize=true, options={}) {
		...
	}
});

RecipeFetcher.export_as_cli();
RecipeFetcher.export_as_(module);
```
We pass the following arguments via CLI:
```bash
$ ./components/recipe_fetcher.js get_ingredients "Onion Soup" 15 false "{ \"pepper\": false }"
```

The component class will automatically parse 15, false, and the passed JSON string as JSON and use the true datatypes.

#### Named Arguments
You can pass named arguments by prefixing the parameter names with two hyphens instead:

```bash
$ /components/recipe_fetcher.js get_ingredients --ingredient_name "Mangosteen" --normalize=1
```

Properties for the component class can be passed the same way. Arguments that don't match method names will be applied as properties. Any hyphens will be replaced by underscores, meaning `--user-id` will be read as `user_id`.

```bash 
$ /components/recipe_fetcher.js get_ingredients --user-id=1337 --ingredient_name="Capers"
``` 

#### Method Chaining
Methods can be chained using the chain notation (beware that spacing is crucial):

```bash
$ /components/recipe_fetcher.js [ load_ingredients "all" , get_ingredients "Pepper" 12 ]
```
will first run ```RecipeFetcher.load_ingredients("all")```, then ```RecipeFetcher.get_ingredients("Pepper", 12)``` and return a dictionary of results for each execution.

### Caching
Before using any of the built-in caching functionality, make sure you have a directory called `data/caches` to store those in.
To cache individual methods, use the `cached_methods` property array:

```javascript
	const RecipeFetcher = new Component({
		name: 'recipe_fetcher',
		cached_methods: ['heavy_computational_task'],
		...
```

A JSON cache will be auto-generated in `/data/caches/<component_name>.cache.json`.

## API
Components provide the following interface:

### Events
Components and utility classes all emit events that can be listened to. You can attach event listeners using the `on` method.

```javascript
RecipeFetcher.on('spawn', (self) => console.log('RecipeFetcher loaded.'));
```

The following events are available on every component:

| Event Name | Triggered … | passed arguments |
| ---------- | ----------- | ---------------- |
| `spawn` | once on initialization | `self` instance, needs to be returned back |
| `init` | every time the component is being updated using `ComponentName.init(...)` | `self` instance, `options` object  |
| `cache` | every time a method's cache is being hit | `key` used to retrieve value from cache |
| `call_from_cli` | once upon calling the component from the command line | `command` is the called method, `args` the passed arguments, `verbose` to turn console output on/off |

To _trigger_ (e.g. your own) events, use the `trigger` method:

```javascript
RecipeFetcher.trigger('recipe_outdated', ['some', 'arguments']);

```

If the event handler returned something, it will be passed through trigger as return value.

```javascript
const new_recipe = RecipeFetcher.trigger('recipe_outdated', [old_recipe]);

```

----------

### Properties
You can access non-callable properties from the CLI using the component module's built-in get and set methods in your terminal:
```bash
$ ./components/recipe_fetcher.js get counts 	# returns 1
```
```bash
$ ./components/recipe_fetcher.js set counts 3
```

----------
### Shortcuts
All components automatically get a `help` method, so if uncertain about properties run `./components/recipe_fetcher.js help`.
All methods automatically get a `--help` directive, so if uncertain about parameters run `./components/recipe_fetcher.js get_ingredients --help`.

### Integration
You can call components written in Javascript from Python and vice-versa as if they were written in the same language using the `Component` module.

Our previous _RecipeFetcher_ example was written in Javascript, but now we want to use it in Python. Here's how:

```javascript
const { Component } = require('micro-components-js');

const { RecipeFetcher } = Component.from_cli('./components/recipe_fetcher.py');
let ingredients = RecipeFetcher.get_ingredients("Onion Soup", 15, false, { pepper: false });

```

To access properties, use the built-in property getters and setters (see "Properties"), like so:

```javascript
const { Component } = require('micro-components-js');

RecipeFetcher = Component.from_cli('./components/recipe_fetcher.py');
const counts = RecipeFetcher.get("counts");

```

## Testing

This package comes with a set of standard JEST tests located in `[tests/micro-components.test.js][]`

Run them using:
```bash
$ npm test
```

[tests/micro-components.test.js]: https://github.com/polygoat/micro-components-js/tree/main/tests/micro-components.test.js


## Examples

Checkout the [components folder][] in the repo for some examples. The CLI used to create component templates for example is a component itself.

[components folder]: https://github.com/polygoat/micro-components-js/tree/main/components


License
-------
[MIT License][]

[MIT License]: https://github.com/polygoat/micro-components-js/blob/main/LICENSE
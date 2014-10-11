# multi-split-pane

## API

#### `var split = new MultiSplitPane(el, opts)`

Create a new `MultiSplitPane` rooted in empty DOM element `el`. Supported options:

  - `orientation`: either `MultiSplitPane.VERTICAL` or `MultiSplitPane.HORIZONTAL`
  - `scheduleRender`: called the split pane needs to redraw its internal structure. Callback receives a single function which it can either invoke immediately or schedule to call with e.g. `requestAnimationFrame()`.
  - `onPaneResize`: a function that will be called when panes are resized
  - `attachWidget`/`detachWidget`: callback functions for attaching/detaching child widgets added to the split pane. Signature is `(parentElement, widget)`. Default is to assume `widget` is a DOM element and perform e.g. `parentElement.appendChild(widget)`.
  - `setWidgetBounds`: callback function used to resize a widget; signature is `(widget, x, y, width, height)`. Default is to assume `widget` is a DOM element and set its dimensions directly.

#### `split.layout()`

Schedule a layout operation. Use the `scheduleRender` constructor operation to control when layout actually occurs.

#### `split.layoutImmediately()`

Layout the split pane immediately. It's not normally necessary to call this function manually.

#### `split.setOrientation(orientation)`

`orientation` is one of `MultiSplitPane.VERTICAL` or `MultiSplitPane.HORIZONTAL`.

#### `split.setPaneSizes(sizes)`

#### `split.addSplit(ratio, [widget])`

#### `split.removeWidgetAtIndex(ix)`

#### `split.getWidgetAtIndex(ix)`

#### `split.setWidgetAtIndex(ix, widget)`

## Example CSS

The root `split-pane` class can be substituted by whatever you want; it is not set by the constructor.

```css
.split-pane > .split-pane-divider {
	position: absolute;
	background-color: black;
}

.split-pane > .split-pane-ghost {
	background-color: #ff3300;
	opacity: 0.7;
}

.split-pane.horizontal > .split-pane-divider {
	left: 0; right: 0;
	height: 8px;
	cursor: row-resize;
}

.split-pane.vertical > .split-pane-divider {
	top: 0; bottom: 0;
	width: 8px;
	cursor: col-resize;
}
```

## Copyright &amp; License

&copy; 2014 Jason Frame [ [@jaz303](http://twitter.com/jaz303) / [jason@onehackoranother.com](mailto:jason@onehackoranother.com) ]

Released under the ISC license.
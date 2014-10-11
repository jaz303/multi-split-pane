module.exports = MultiSplitPane;

var du          = require('domutil'),
    rattrap     = require('rattrap');

var DIVIDER_SIZE    = 8;
var VERTICAL        = MultiSplitPane.VERTICAL   = 'v';
var HORIZONTAL      = MultiSplitPane.HORIZONTAL = 'h';

function defaultScheduleRender(fn) {
    fn();
}

function defaultAttachWidget(parent, widget) {
    parent.appendChild(widget);
}

function defaultDetachWidget(parent, widget) {
    parent.removeChild(widget);
}

function defaultSetWidgetBounds(el, x, y, w, h) {
    du.setRect(el, x, y, w, h);
}

function MultiSplitPane(el, opts) {

    opts = opts || {};

    this._el                = el;
    this._orientation       = opts.orientation || VERTICAL;
    this._widgets           = [null];
    this._splits            = [];
    
    this._layoutScheduled   = false;
    this._panesResized      = false;

    // Callbacks...
    this._scheduleRender    = opts.scheduleRender || defaultScheduleRender;
    this._onPaneResize      = opts.onPaneResize || function() {};
    this._attachWidget      = opts.attachWidget || defaultAttachWidget;
    this._detachWidget      = opts.detachWidget || defaultDetachWidget;
    this._setElementBounds  = opts.setWidgetBounds || defaultSetWidgetBounds;

    this._build();
    this._bind();

}

MultiSplitPane.prototype.layout = function() {
    if (this._layoutScheduled) return;
    this._layoutScheduled = true;
    var self = this;
    this._scheduleRender(function() { self.layoutImmediately(); });
}

MultiSplitPane.prototype.layoutImmediately = function() {

    this._layoutScheduled = false;

    var rect        = this._el.getBoundingClientRect(),
        width       = rect.width,
        height      = rect.height,
        horizontal  = this._orientation === HORIZONTAL,
        widgets     = this._widgets,
        splits      = this._splits,
        totalSpace  = (horizontal ? height : width) - (splits.length * DIVIDER_SIZE),
        pos         = 0,
        root        = this._el;

    if (totalSpace < 0) {

        // TODO: handle

    } else {

        var lastRatio = 0;
        
        for (var i = 0; i < splits.length; ++i) {
            
            var ratio   = splits[i].ratio,
                divider = splits[i].divider,
                widget  = widgets[i];

            if (horizontal) {
                
                var paneHeight = Math.floor(totalSpace * (ratio - lastRatio));

                if (widget) {
                    this._setElementBounds(widget, 0, pos, width, paneHeight);    
                }
                
                divider.style.top = (pos + paneHeight) + 'px';
                pos += paneHeight + DIVIDER_SIZE;
                
            } else {
                
                var paneWidth = Math.floor(totalSpace * (ratio - lastRatio));

                if (widget) {
                    this._setElementBounds(widget, pos, 0, paneWidth, height);    
                }
                       
                divider.style.left = (pos + paneWidth) + 'px';
                pos += paneWidth + DIVIDER_SIZE;
                
            }
            
            lastRatio = ratio;
            
        }

        var lastWidget = widgets[widgets.length-1];
        if (lastWidget) {
            if (horizontal) {
                this._setElementBounds(lastWidget, 0, pos, width, height - pos);
            } else {
                this._setElementBounds(lastWidget, pos, 0, width - pos, height);
            }    
        }

    }

    if (this._panesResized) {
        this._panesResized = false;
        this._onPaneResize(this);
    }

}

MultiSplitPane.prototype.setOrientation = function(orientation) {

    this._orientation = orientation;

    var self = this;
    self._scheduleRender(function() {
        du.removeClass(self._el, 'horizontal vertical');
        du.addClass(self._el, self._orientation === HORIZONTAL ? 'horizontal' : 'vertical');
    });
    
    this.layout();

}

MultiSplitPane.prototype.setPaneSizes = function(sizes) {

    var requested = 0,
        fill = 0;

    if (sizes.length !== this._widgets.length) {
        throw new Error("length of size array must equal number of widgets in split pane");
    }

    for (var i = 0; i < sizes.length; ++i) {
        if (sizes[i] === null) {
            fill++;
        } else {
            requested += sizes[i];
        }
    }

    var availableWidth = this.width - (this._splits.length * DIVIDER_SIZE),
        remainingWidth = availableWidth - requested;

    // wimp out if we can't fill exactly.
    // TODO: should probably try a best-effort thing
    if (fill === 0 && remainingWidth !== 0) {
        return;
    } else if (fill > 0 && remainingWidth <= 0) {
        return;
    }

    var last = 0;
    for (var i = 0; i < sizes.length - 1; ++i) {
        var s = (sizes[i] === null) ? (remainingWidth / fill) : sizes[i],
            r = last + (s / availableWidth)
        this._splits[i].ratio = r;
        last = r;
    }

    this.layout();

}

MultiSplitPane.prototype.addSplit = function(ratio, widget) {

    if (ratio < 0 || ratio > 1) {
        throw new Error("ratio must be between 0 and 1");
    }

    var div = document.createElement('div');
    div.className = 'split-pane-divider';

    // TODO: do we need to schedule this...
    this._el.appendChild(div);

    var newSplit = {divider: div, ratio: ratio};
    var addedIx = -1;

    for (var i = 0; i < this._splits.length; ++i) {
        var split = this._splits[i];
        if (ratio < split.ratio) {
            this._widgets.splice(i, 0, null);
            this._splits.splice(i, 0, newSplit);
            addedIx = i;
            break;
        }
    }

    if (addedIx == -1) {
        this._widgets.push(null);
        this._splits.push(newSplit);
        addedIx = this._widgets.length - 1;
    }

    if (widget) {
        this.setWidgetAtIndex(addedIx, widget);
    }

    this.layout();

}

MultiSplitPane.prototype.removeWidgetAtIndex = function(ix) {

    if (ix < 0 || ix >= this._widgets.length) {
        throw new RangeError("invalid element index");
    }

    if (this._widgets.length === 1) {
        this.setWidgetAtIndex(0, null);
        return;
    }

    var widget = this._widgets[ix];
    if (widget) {
        this._detachWidget(this._el, widget);
    }

    this._widgets.splice(ix, 1);

    var victimSplit = (ix === this._widgets.length) ? (ix - 1) : ix;
    this._splits.splice(victimSplit, 1);

    // TODO: again, should be schedule this?
    this._el.removeChild(this._splits[victimSplit].divider);
    
    this.layout();

    return widget;

}

MultiSplitPane.prototype.getWidgetAtIndex = function(ix) {

    if (ix < 0 || ix >= this._widgets.length) {
        throw new RangeError("invalid element index");
    }

    return this._widgets[ix];

}

MultiSplitPane.prototype.setWidgetAtIndex = function(ix, widget) {

    if (ix < 0 || ix >= this._widgets.length) {
        throw new RangeError("invalid element index");
    }

    var existingWidget = this._widgets[ix];
    
    if (widget !== existingWidget) {
        if (existingWidget) {
            this._detachWidget(this._el, existingWidget);
            this._widgets[ix] = null;
        }

        if (widget) {
            this._widgets[ix] = widget;
            this._attachWidget(this._el, widget);
        }

        this.layout();
    }
        
    return existingWidget;

}

//
// Private API

MultiSplitPane.prototype._build = function() {

    this._ghost = document.createElement('div');
    this._ghost.className = 'split-pane-divider split-pane-ghost';

    du.addClass(this._el, this._orientation === HORIZONTAL ? 'horizontal' : 'vertical');

}

MultiSplitPane.prototype._bind = function() {

    var self = this;
    this._el.addEventListener('mousedown', function(evt) {

        var horizontal = self._orientation === HORIZONTAL;

        if (evt.target.className === 'split-pane-divider') {

            evt.stopPropagation();

            var splitIx;
            for (var i = 0; i < self._splits.length; ++i) {
                if (self._splits[i].divider === evt.target) {
                    splitIx = i;
                    break;
                }
            }

            // TODO: need to find some way of caching this
            var rect = self._el.getBoundingClientRect();
            
            var min, max;

            if (splitIx === 0) {
                min = 0;
            } else {
                min = parseInt(self._splits[splitIx-1].divider.style[horizontal ? 'top' : 'left'], 10) + DIVIDER_SIZE;
            }
            
            if (splitIx === self._splits.length - 1) {
                max = parseInt(rect[horizontal ? 'height' : 'width']) - DIVIDER_SIZE;
            } else {
                max = parseInt(self._splits[splitIx+1].divider.style[horizontal ? 'top' : 'left'], 10) - DIVIDER_SIZE;
            }

            var spx       = evt.pageX,
                spy       = evt.pageY,
                sx        = parseInt(evt.target.style.left),
                sy        = parseInt(evt.target.style.top),
                lastValid = (horizontal ? sy : sx);

            function updateGhost() {
                self._ghost.style[horizontal ? 'top' : 'left'] = lastValid + 'px';
            }
            
            self._el.appendChild(self._ghost);
            updateGhost();

            var stopCapture = rattrap.startCapture(document, {
                cursor: (self._orientation === HORIZONTAL) ? 'row-resize' : 'col-resize',
                mousemove: function(evt) {
                    if (horizontal) {
                        var dy = evt.pageY - spy,
                            y = sy + dy;
                        if (y < min) y = min;
                        if (y > max) y = max;
                        lastValid = y;
                    } else {
                        var dx = evt.pageX - spx,
                            x = sx + dx;
                        if (x < min) x = min;
                        if (x > max) x = max;
                        lastValid = x;
                    }
                    updateGhost();
                },
                mouseup: function() {
                    stopCapture();
                    self._el.removeChild(self._ghost);

                    var p = (lastValid - min) / (max - min);
                    if (isNaN(p)) p = 0;

                    var minSplit = (splitIx === 0) ? 0 : self._splits[splitIx-1].ratio,
                        maxSplit = (splitIx === self._splits.length-1) ? 1 : self._splits[splitIx+1].ratio;
                        newSplit = minSplit + (maxSplit - minSplit) * p;

                    self._splits[splitIx].ratio = newSplit;
                    
                    self._panesResized = true;

                    self.layout();
                }
            });

        }
    
    });

}
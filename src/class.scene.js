/*
 * Copyright (c) 2012  Capgemini Technology Services (hereinafter “Capgemini”)
 *
 * License/Terms of Use
 *
 * Permission is hereby granted, free of charge and for the term of intellectual property rights on the Software, to any
 * person obtaining a copy of this software and associated documentation files (the "Software"), to use, copy, modify
 * and propagate free of charge, anywhere in the world, all or part of the Software subject to the following mandatory conditions:
 *
 *   •    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 *  Any failure to comply with the above shall automatically terminate the license and be construed as a breach of these
 *  Terms of Use causing significant harm to Capgemini.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 *  WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 *  OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 *  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 *  Except as contained in this notice, the name of Capgemini shall not be used in advertising or otherwise to promote
 *  the use or other dealings in this Software without prior written authorization from Capgemini.
 *
 *  These Terms of Use are subject to French law.
 * */

"use strict";

/**
 * Provides requestAnimationFrame in a cross browser way.
 * @property cgsgGlobalRenderingTimer
 * @private
 * @type {Number}
 */
var cgsgGlobalRenderingTimer = null;
//var cgsgGlobalFramerate = CGSG_DEFAULT_FRAMERATE;
(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame =
		window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function (callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 17 - (currTime - lastTime)); //1000/60 = 16.667
			cgsgGlobalRenderingTimer = window.setTimeout(function () {
				callback(currTime + timeToCall);
			}, timeToCall);
			lastTime = currTime + timeToCall;
			//return id;
		};
	}

	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function (id) {
			clearTimeout(id);
		};
	}
}());

/**
 * Represent the scene of the application.
 * It encapsulates the scene graph itself and several methods to track mouse and touch events, ...
 *
 * @class CGSGScene
 * @constructor
 * @module Scene
 * @main Scene
 * @extends {Object}
 * @param {HTMLElement} canvas a handler to the canvas HTML element
 * @type {CGSGScene}
 * @author Gwennael Buchet (gwennael.buchet@capgemini.com)
 */
var CGSGScene = CGSGObject.extend(
	{
		initialize : function (canvas) {

			//detect the current explorer to apply correct parameters
			cgsgDetectCurrentExplorer();

			//noinspection JSUndeclaredVariable
			cgsgCanvas = canvas;
			/**
			 * @property context
			 * @type {CanvasRenderingContext2D}
			 */
			this.context = cgsgCanvas.getContext("2d");

			/**
			 * Multiselection boolean.
			 * @property allowMultiSelect
			 * @default true
			 * @type {Boolean}
			 */
			this.allowMultiSelect = true;

			/**
			 * The scene graph itself
			 * @property sceneGraph
			 * @type {CGSGSceneGraph}
			 */
			this.sceneGraph = new CGSGSceneGraph(cgsgCanvas, this.context);

			/**
			 * List of the current selected nodes in the scenegraph.
			 * @property selectedNodes
			 * @type {Array}
			 */
			this.selectedNodes = this.sceneGraph.selectedNodes;

			/**
			 * Current framerate of the application
			 * @property fps
			 * @type {Number}
			 */
			this.fps = 0;

			////// @private /////////
			/**
			 * @property _isRunning
			 * @type {Boolean}
			 * @private
			 */
			this._isRunning = false;
			// when set to true, the canvas will redraw everything
			// invalidate() just sets this to false right now
			// we want to call invalidate() whenever we make a change
			this._needRedraw = true;

			/**
			 * @property _frameContainer Handler to the HTML Element displaying the FPS
			 * @type {HTMLElement}
			 * @private
			 */
			this._frameContainer = null;

			/**
			 * True if the [CTRL} key is being pressed
			 * @property _keyDownedCtrl
			 * @type {Boolean}
			 * @private
			 */
			this._keyDownedCtrl = false;

			/**
			 * Current position of the mouse
			 * @property _mousePosition
			 * @type {CGSGPosition}
			 * @private
			 */
			this._mousePosition = new CGSGPosition(0, 0);
			this._mouseOldPosition = new CGSGPosition(0, 0);
			this._isDrag = false;
			this._isResizeDrag = false;
			this._resizingDirection = -1;
			/**
			 * @property _listCursors List of the names for the cursor when overring a handlebox
			 * @type {Array}
			 * @private
			 */
			this._listCursors =
			['nw-resize', 'n-resize', 'ne-resize', 'w-resize', 'e-resize', 'sw-resize',
			 's-resize', 'se-resize'];
			this._offsetX = 0;
			this._offsetY = 0;
			/**
			 * @property _selectedNode The current last selected node
			 * @type {null}
			 * @private
			 */
			this._selectedNode = null;

			//Experimental : double-buffer for the temporary rendering
			/*this._dblCanvas = document.createElement('canvas');
			 this._dblContext = null;*/

			////// INITIALIZATION /////////

			//use an external variable to define the scope of the processes
			var scope = this;
			cgsgCanvas.onmousedown = function (event) {
				scope.onMouseDown(event);
			};
			cgsgCanvas.onmouseup = function (event) {
				scope.onMouseUp(event);
			};
			cgsgCanvas.ondblclick = function (event) {
				scope.onMouseDblClick(event);
			};
			cgsgCanvas.onmousemove = function (event) {
				scope.onMouseMove(event);
			};
			document.onkeydown = function (event) {
				scope.onKeyDownHandler(event);
			};
			document.onkeyup = function (event) {
				scope.onKeyUpHandler(event);
			};
			cgsgCanvas.addEventListener('touchstart', function (event) {
				scope.onTouchStart(event);
			}, false);
			cgsgCanvas.addEventListener('touchmove', function (event) {
				scope.onTouchMove(event);
			}, false);
			cgsgCanvas.addEventListener('touchend', function (event) {
				scope.onTouchEnd(event);
			}, false);

			this._lastUpdate = new Date().getTime();

			this._nodeMouseOver = null;

			/**
			 * Callback on click down on scene event
			 * @property onSceneClickStart
			 * @default null
			 * @type {Function}
			 */
			this.onSceneClickStart = null;
			/**
			 * Callback on click up on scene event
			 * @property onSceneClickEnd
			 * @default null
			 * @type {Function}
			 */
			this.onSceneClickEnd = null;
			/**
			 * Callback on double click start on scene event
			 * @property onSceneDblClickStart
			 * @default null
			 * @type {Function}
			 */
			this.onSceneDblClickStart = null;
			/**
			 * Callback on double click up on scene event
			 * @property onSceneDblClickEnd
			 * @default null
			 * @type {Function}
			 */
			this.onSceneDblClickEnd = null;
			/**
			 * Callback on start rendering event
			 * @property onRenderStart
			 * @default null
			 * @type {Function}
			 */
			this.onRenderStart = null;
			/**
			 * Callback on end rendering event
			 * @property onRenderEnd
			 * @default null
			 * @type {Function}
			 */
			this.onRenderEnd = null;
		},

		/**
		 * Change the dimension of the canvas.
		 * Does not really change the dimension of the rendering canvas container,
		 *  but is used by the different computations
		 * @method setCanvasDimension
		 * @param {CGSGDimension} newDimension
		 * */
		setCanvasDimension : function (newDimension) {
			cgsgCanvas.width = newDimension.width;
			cgsgCanvas.height = newDimension.height;
			this.sceneGraph.setCanvasDimension(newDimension);

			//Experimental
			/*this._dblCanvas.width = newDimension.x;
			 this._dblCanvas.height = newDimension.y;
			 this._dblContext = this._dblCanvas.getContext('2d');*/
		},

		/**
		 * Remove the nodes selected in the scene graph
		 * @method deleteSelected
		 */
		deleteSelected : function () {
			if (this.sceneGraph.selectedNodes.length > 0) {
				for (var i = this.sceneGraph.selectedNodes.length - 1; i >= 0; i--) {
					this._selectedNode = this.sceneGraph.selectedNodes[i];
					this.sceneGraph.removeNode(this._selectedNode, true);
				}
			}
		},

		/**
		 * Deselect all nodes
		 * @public
		 * @method deselectAll
		 * @param {Array} excludedArray CGSGNodes not to deselect
		 */
		deselectAll : function (excludedArray) {
			this._isDrag = false;
			this._isResizeDrag = false;
			this._resizingDirection = -1;

			this.sceneGraph.deselectAll(excludedArray);

			this.invalidate();
		},

		/**
		 * the main rendering loop
		 * @protected
		 * @method render
		 */
		render : function () {
			if (this._isRunning && this._needRedraw) {
				if (this.onRenderStart !== null) {
					this.onRenderStart();
				}
				this.sceneGraph.render();

				if (this.onRenderEnd !== null) {
					this.onRenderEnd();
				}

				//if (!this.sceneGraph.stillHaveAnimation()) {
				//    	this._needRedraw = false;
				//}
			}

			this._updateFramerate();
			this._updateFramerateContainer();
		},

		/**
		 * Call this to start the update of the scene
		 * @public
		 * @method startPlaying
		 */
		startPlaying : function () {
			//we want the callback of the requestAnimationFrame function to be this one.
			//however, the scope of 'this' won't be the same on the requestAnimationFrame function (scope = window)
			// and this one (scope = this). So we bind this function to this scope
			var bindStartPlaying = this.startPlaying.bind(this);
			window.requestAnimationFrame(bindStartPlaying);
			this._isRunning = true;
			this.render();
		},

		/**
		 * Call this to stop the rendering (and so animation) update
		 * @public
		 * @method stopPlaying
		 */
		stopPlaying : function () {
			window.cancelAnimationFrame(cgsgGlobalRenderingTimer);
			this._isRunning = false;
		},

		/**
		 * Inform the SceneGraph that a new render is needed
		 * @public
		 * @method invalidate
		 */
		invalidate : function () {
			this._needRedraw = true;
		},

		/**
		 * Update the current framerate
		 * @method _updateFramerate
		 * @private
		 */
		_updateFramerate : function () {
			if (!cgsgExist(this._fpss)) {
				this._fpss = [];
				this.currentFps = 0;
			}

			var now = new Date().getTime();
			var delta = (now - this._lastUpdate);
			this._fpss[this.currentFps++] = 1000.0 / delta;

			if (this.currentFps == cgsgFramerateDelay){
				this.currentFps = 0;
				this.fps = this._fpss.average();
			}

			this._lastUpdate = now;
		},

		/**
		 * Update the innerHTML of the HTMLElement passed as parameter of the "showFPS" function
		 * @method _updateFramerateContainer
		 * @private
		 */
		_updateFramerateContainer : function () {
			if (this._frameContainer !== null) {
				this._frameContainer.innerHTML = Math.round(this.fps).toString();
			}
		},

		/**
		 * @public
		 * @method showFPS
		 * @param {HTMLElement} elt an HTML element to receive the FPS. Can be null if you want to remove the framerate
		 */
		showFPS : function (elt) {
			this._frameContainer = elt;
		},

		/**
		 * Set the new value for the display ratio.
		 * The display ratio is used to resize all the elements on the graph to be adapted to the screen,
		 * depending on the reference screen size.
		 * You can compute the ratio like this: x = canvas.width/reference.width ; y = canvas.height/reference.height
		 * @public
		 * @method setDisplayRatio
		 * @param {CGSGScale} newRatio a CGSGScale value
		 */
		setDisplayRatio : function (newRatio) {
			//noinspection JSUndeclaredVariable
			cgsgDisplayRatio = newRatio;
			this.sceneGraph.initializeGhost(cgsgCanvas.width / cgsgDisplayRatio.x,
			                                cgsgCanvas.height / cgsgDisplayRatio.y);
		},

		/**
		 * @public
		 * @method getDisplayRatio
		 * @return {CGSGScale} the current display ratio
		 */
		getDisplayRatio : function () {
			return cgsgDisplayRatio;
		},

		/**
		 * click mouse Event handler function
		 * @protected
		 * @method onMouseDown
		 * @param {MouseEvent} event
		 */
		onMouseDown : function (event) {
			this._clickOnScene(event);
		},

		/**
		 * touch down Event handler function
		 * @protected
		 * @method onTouchStart
		 * @param {Event} event
		 */
		onTouchStart : function (event) {
			this._clickOnScene(event);
		},

		/**
		 * @private
		 * @method _clickOnScene
		 * @param {Event} event MouseEvent or TouchEvent
		 */
		_clickOnScene : function (event) {
			if (this.onSceneClickStart !== null) {
				this.onSceneClickStart(event);
			}

			this._mousePosition = cgsgGetCursorPosition(event, cgsgCanvas);

			//if the mouse cursor is over a handle box (ie: a resize marker)
			if (this._resizingDirection !== -1) {
				this._mouseOldPosition = this._mousePosition.copy();
				this._isResizeDrag = true;
				if (this.onSceneClickEnd !== null) {
					this.onSceneClickEnd({position : this._mousePosition.copy(), event : event});
				}
				return;
			}

			//try to pick up the nodes under the cursor
			this._selectedNode = this.sceneGraph.pickNode(this._mousePosition, function (node) {
				return (node.isClickable === true || node.isDraggable === true || node.isResizable === true)
			});
			//if a nodes is under the cursor, select it
			if (this._selectedNode !== null && this._selectedNode !== undefined) {
				if (this._selectedNode.isDraggable || this._selectedNode.isResizable) {

					//if multiselection is activated
					if (this.allowMultiSelect && this._keyDownedCtrl) {
						if (!this._selectedNode.isSelected) {
							this.sceneGraph.selectNode(this._selectedNode);
						}
						else {
							this.sceneGraph.deselectNode(this._selectedNode);
						}
					}
					//no multiselection
					else {
						//if node not already selected
						if (!this._selectedNode.isSelected) {
							this.deselectAll(null);
							this.sceneGraph.selectNode(this._selectedNode);
						}
					}

					this._isDrag = true;
					this._isResizeDrag = false;

					//ask for redraw
					this.invalidate();
				}

				//execute the action bound with the click event
				if (this._selectedNode.isClickable) {
					if (cgsgExist(this._selectedNode.onClick)) {
						this._selectedNode.onClick({node : this._selectedNode, position : this._mousePosition.copy(), event : event});
					}
					//deselect all node except the new _selectedNode
					if (this._selectedNode.isDraggable === false && this._selectedNode.isResizable === false) {
						this.deselectAll([this._selectedNode]);
					}
				}

			}
			//else if no nodes was clicked
			else {
				this.deselectAll(null);
			}

			if (this.onSceneClickEnd !== null) {
				this.onSceneClickEnd({position : this._mousePosition.copy(), event : event});
			}

			this._mouseOldPosition = this._mousePosition.copy();
		},

		/**
		 * mouse move Event handler function
		 * @protected
		 * @method onMouseMove
		 * @param {MouseEvent} event
		 */
		onMouseMove : function (event) {
			this._moveOnScene(event);
		},

		/**
		 * touch move Event handler function
		 * @protected
		 * @method onTouchMove
		 * @param {Event} event
		 */
		onTouchMove : function (event) {
			event.preventDefault();
			event.stopPropagation();
			this._moveOnScene(event);
		},

		/**
		 * @private
		 * @method _moveOnScene
		 * @param {Event} event MouseEvent or TouchEvent
		 */
		_moveOnScene : function (event) {
			var i, nodeOffsetX, nodeOffsetY;
			this._mousePosition = cgsgGetCursorPosition(event, cgsgCanvas);
			this._selectedNode = null;

			if (this._isDrag) {
				if (this.sceneGraph.selectedNodes.length > 0) {
					this._offsetX = this._mousePosition.x - this._mouseOldPosition.x;
					this._offsetY = this._mousePosition.y - this._mouseOldPosition.y;
					var canMove = true;
					for (i = this.sceneGraph.selectedNodes.length - 1; i >= 0; i--) {
						this._selectedNode = this.sceneGraph.selectedNodes[i];
						if (this._selectedNode !== null && this._selectedNode.isDraggable) {
							this._selectedNode.isMoving = true;
							//TODO : appliquer aussi l'opposée de la rotation
							nodeOffsetX = this._offsetX /
							              (this._selectedNode._absoluteScale.x / this._selectedNode.scale.x);
							nodeOffsetY = this._offsetY /
							              (this._selectedNode._absoluteScale.y / this._selectedNode.scale.y);
							//check for the region constraint
							if (this._selectedNode.regionConstraint !== null) {
								var reg = this._selectedNode.getRegion().copy();
								reg.position.x += nodeOffsetX;
								reg.position.y += nodeOffsetY;
								if (!cgsgRegionIsInRegion(reg, this._selectedNode.regionConstraint, 0)) {
									canMove = false;
								}
							}

							if (canMove) {
								this._selectedNode.translateWith(nodeOffsetX, nodeOffsetY);
								if (this._selectedNode.onDrag !== null) {
									this._selectedNode.onDrag({node : this._selectedNode, position : this._mousePosition.copy(), event : event});
								}
							}
						}
					}

					this._mouseOldPosition = this._mousePosition.copy();

					// something is changing position so we better invalidate the canvas!
					this.invalidate();
				}
			}
			else if (this._isResizeDrag) {
				if (this.sceneGraph.selectedNodes.length > 0) {
					this._offsetX = this._mousePosition.x - this._mouseOldPosition.x;
					this._offsetY = this._mousePosition.y - this._mouseOldPosition.y;
					for (i = this.sceneGraph.selectedNodes.length - 1; i >= 0; i--) {
						this._selectedNode = this.sceneGraph.selectedNodes[i];
						if (this._selectedNode.isResizable) {
							this._selectedNode.isResizing = true;
							//TODO : appliquer aussi l'opposée de la rotation
							nodeOffsetX = this._offsetX / this._selectedNode._absoluteScale.x;
							nodeOffsetY = this._offsetY / this._selectedNode._absoluteScale.y;

							var delta = Math.max(nodeOffsetX, nodeOffsetY);
							if (delta == 0) {
								delta = Math.min(nodeOffsetX, nodeOffsetY);
							}
							var realDimX = this._selectedNode.dimension.width *
							               this._selectedNode._absoluteScale.x;
							var realDimY = this._selectedNode.dimension.height *
							               this._selectedNode._absoluteScale.y;
							var d = {dW : 0, dH : 0};
							// 0  1  2
							// 3     4
							// 5  6  7
							switch (this._resizingDirection) {
								case 0:
									if (this._selectedNode.isProportionalResize) {
										d = this._getDeltaOnMove(delta, nodeOffsetX, nodeOffsetY, realDimX,
										                         realDimY,
										                         -1, -1);
										this._selectedNode.translateWith(-d.dW, -d.dH, false);
										this._selectedNode.resizeWith(d.dW, d.dH, false);
									}
									else {
										this._selectedNode.translateWith(nodeOffsetX * this._selectedNode.scale.x,
										                                 nodeOffsetY * this._selectedNode.scale.y,
										                                 false);
										this._selectedNode.resizeWith(-nodeOffsetX, -nodeOffsetY, false);
									}
									break;
								case 1:
									this._selectedNode.translateWith(0, nodeOffsetY * this._selectedNode.scale.y,
									                                 false);
									this._selectedNode.resizeWith(0, -nodeOffsetY, false);
									break;
								case 2:
									if (this._selectedNode.isProportionalResize) {
										d = this._getDeltaOnMove(delta, nodeOffsetX, nodeOffsetY, realDimX,
										                         realDimY,
										                         1, -1);
										this._selectedNode.translateWith(0, -d.dH, false);
										this._selectedNode.resizeWith(d.dW, d.dH, false);
									}
									else {
										this._selectedNode.translateWith(0, nodeOffsetY * this._selectedNode.scale.y,
										                                 false);
										this._selectedNode.resizeWith(nodeOffsetX, -nodeOffsetY, false);
									}
									break;
								case 3:
									this._selectedNode.translateWith(nodeOffsetX * this._selectedNode.scale.x, 0,
									                                 false);
									this._selectedNode.resizeWith(-nodeOffsetX, 0, false);
									break;
								case 4:
									this._selectedNode.resizeWith(nodeOffsetX, 0, false);
									break;
								case 5:
									if (this._selectedNode.isProportionalResize) {
										d = this._getDeltaOnMove(delta, nodeOffsetX, nodeOffsetY, realDimX,
										                         realDimY,
										                         1, -1);
										this._selectedNode.translateWith(d.dW, 0, false);
										this._selectedNode.resizeWith(-d.dW, -d.dH, false);
									}
									else {
										this._selectedNode.translateWith(nodeOffsetX * this._selectedNode.scale.x, 0,
										                                 false);
										this._selectedNode.resizeWith(-nodeOffsetX, nodeOffsetY, false);
									}
									break;
								case 6:
									this._selectedNode.resizeWith(0, nodeOffsetY, false);
									break;
								case 7:
									if (this._selectedNode.isProportionalResize) {
										d = this._getDeltaOnMove(delta, nodeOffsetX, nodeOffsetY, realDimX,
										                         realDimY,
										                         1, 1);
										this._selectedNode.resizeWith(d.dW, d.dH, false);
									}
									else {
										this._selectedNode.resizeWith(nodeOffsetX, nodeOffsetY, false);
									}
									break;
							}
							this._selectedNode.computeAbsoluteMatrix(false);
							if (this._selectedNode.onResize !== null) {
								this._selectedNode.onResize({node : this._selectedNode, position : this._mousePosition.copy(), event : event});
							}
						}
					}
				}
				this._mouseOldPosition = this._mousePosition.copy();

				this.invalidate();
			}
			// if there's a selection, see if we grabbed one of the resize handles
			else if (this.sceneGraph.selectedNodes.length > 0 && this._isResizeDrag == false) {
				for (i = this.sceneGraph.selectedNodes.length - 1; i >= 0; i--) {
					this._selectedNode = this.sceneGraph.selectedNodes[i];
					if (this._selectedNode.isResizable) {
						for (var h = 0; h < 8; h++) {
							var selectionHandle = this._selectedNode.resizeHandles[h];

							// resize handles will always be rectangles
							if (selectionHandle.checkIfSelected(this._mousePosition, cgsgResizeHandleThreshold)) {
								// we found one!
								this._resizingDirection = h;

								//draw the correct cursor
								cgsgCanvas.style.cursor = this._listCursors[h];

								return;
							}
						}
					}
				}

				// not over a selection box, return to normal
				this._isResizeDrag = false;
				this._resizingDirection = -1;
				cgsgCanvas.style.cursor = 'auto';

				//ask for redraw
				this.invalidate();
			}

			//mouse over a node ?
			if (!this._isDrag && !this._isResizeDrag) {
				var n = null;
				//first test the mouse over the current _nodeMouseOver. If it's ok, no need to traverse other
				if (cgsgExist(this._nodeMouseOver)) {
					n = this._nodeMouseOver.pickNode(this._mousePosition, null, cgsgGhostContext, false, null);

					if (n === null) {
						this._nodeMouseOver.isMouseOver = false;
						if (cgsgExist(this._nodeMouseOver.onMouseOut)) {
							this._nodeMouseOver.onMouseOut({node : this._nodeMouseOver, position : this._mousePosition.copy()});
						}
						this._nodeMouseOver = null;
					}
				}

				//if the previous node under the mouse is no more under the mouse, test the other nodes
				if (n === null) {
					if ((n = this.sceneGraph.pickNode(this._mousePosition, function (node) {
						return node.onMouseOver !== null
					})) !== null) {
						n.isMouseOver = true;
						this._nodeMouseOver = n;
						this._nodeMouseOver.onMouseOver({node : this._nodeMouseOver, position : this._mousePosition.copy()})
					}
				}

			}
		},

		/**
		 * @method _getDeltaOnMove
		 * @param delta
		 * @param nodeOffsetX
		 * @param nodeOffsetY
		 * @param w
		 * @param h
		 * @param signeX
		 * @param signeY
		 * @return {Object}
		 * @private
		 */
		_getDeltaOnMove : function (delta, nodeOffsetX, nodeOffsetY, w, h, signeX, signeY) {
			var dW = nodeOffsetX, dH = nodeOffsetY;
			var ratio = 1.0;
			if (delta == nodeOffsetX) {
				ratio = (w + signeX * delta) / w;
				dW = signeX * delta;
				dH = (ratio - 1.0) * h;
			}
			else {
				ratio = (h + signeY * delta) / h;
				dH = signeY * delta;
				dW = (ratio - 1.0) * w;
			}

			return {dW : dW, dH : dH};
		},

		/**
		 * mouse up Event handler function
		 * @protected
		 * @method onMouseUp
		 * @param {MouseEvent} event
		 */
		onMouseUp : function (event) {
			this._upOnScene(event);
		},

		/**
		 * touch up Event handler function
		 * @protected
		 * @method onTouchEnd
		 * @param {Event} event
		 */
		onTouchEnd : function (event) {
			this._upOnScene(event);
		},

		/**
		 * @method _upOnScene
		 * @param {Event} event MouseEvent or TouchEvent
		 * @private
		 */
		_upOnScene : function (event) {
			var i = 0;

			//if current action was to drag nodes
			if (this._isDrag) {
				for (i = this.sceneGraph.selectedNodes.length - 1; i >= 0; i--) {
					this._selectedNode = this.sceneGraph.selectedNodes[i];
					if (this._selectedNode.isMoving) {
						this._selectedNode.isMoving = false;
						this._selectedNode.computeAbsoluteMatrix(true);
						if (this._selectedNode.onDragEnd !== null) {
							this._selectedNode.onDragEnd({node : this._selectedNode, position : this._mousePosition.copy(), event : event});
						}
					}
				}
				this._isDrag = false;
			}

			//else if current action was to resize nodes
			else if (this._isResizeDrag) {
				for (i = this.sceneGraph.selectedNodes.length - 1; i >= 0; i--) {
					this._selectedNode = this.sceneGraph.selectedNodes[i];
					if (this._selectedNode.isResizing) {
						this._selectedNode.isResizing = false;
						this._selectedNode.computeAbsoluteMatrix(true);
						if (this._selectedNode.onResizeEnd !== null) {
							this._selectedNode.onResizeEnd({node : this._selectedNode, position : this._mousePosition.copy(), event : event});
						}
					}
				}
				this._isResizeDrag = false;
			}

			//else if jst up the mice of nodes
			else {
				this._selectedNode = this.sceneGraph.selectedNodes[this.sceneGraph.selectedNodes.length - 1];
				if (cgsgExist(this._selectedNode) && this._selectedNode.onMouseUp !== null) {
					this._selectedNode.onMouseUp({node : this._selectedNode, position : this._mousePosition.copy(), event : event});
				}
			}

			this._resizingDirection = -1;
		},

		/**
		 * mouse double click Event handler function
		 * @protected
		 * @method onMouseDblClick
		 * @param {MouseEvent} event
		 */
		onMouseDblClick : function (event) {
			this.dblClickOnScene(event);
		},

		/**
		 * @protected
		 * @method dblClickOnScene
		 * @param {Event} event
		 * @return {CGSGNode} the node that was double-clicked
		 */
		dblClickOnScene : function (event) {
			if (this.onSceneDblClickStart !== null) {
				this.onSceneDblClickStart(event);
			}
			this._mousePosition = cgsgGetCursorPosition(event, cgsgCanvas);
			this._selectedNode = this.sceneGraph.pickNode(this._mousePosition, function (node) {
				return true;
			});
			if (cgsgExist(this._selectedNode) && this._selectedNode.onDblClick !== null) {
				this._selectedNode.onDblClick({node : this._selectedNode, position : this._mousePosition.copy(), event : event});
			}
			else if (this.onSceneDblClickEnd !== null) {
				this.onSceneDblClickEnd({position : this._mousePosition.copy(), event : event});
			}
			return this._selectedNode;
		},

		/**
		 * @method onKeyDownHandler
		 * @protected
		 * @param {KeyboardEvent} event
		 * @return {Number}
		 */
		onKeyDownHandler : function (event) {
			var keynum = (window.event) ? event.keyCode : event.which;

			switch (keynum) {
				case 17:
					this._keyDownedCtrl = true;
					break;
			}

			return keynum;
		},

		/**
		 * @method onKeyUpHandler
		 * @protected
		 * @param {KeyboardEvent} event
		 * @return {Number}
		 */
		onKeyUpHandler : function (event) {
			var keynum = (window.event) ? event.keyCode : event.which;

			switch (keynum) {
				case 17:
					this._keyDownedCtrl = false;
					break;
			}

			return keynum;
		}
	}
);

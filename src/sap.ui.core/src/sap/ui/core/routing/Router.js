/*!
 * ${copyright}
 */

/*global crossroads */
sap.ui.define(['jquery.sap.global', 'sap/ui/base/EventProvider', 'sap/ui/base/ManagedObject', './HashChanger', './Route', './Views', './Targets', 'sap/ui/thirdparty/crossroads', 'sap/ui/thirdparty/signals'],
	function($, EventProvider, ManagedObject, HashChanger, Route, Views, Targets) {
	"use strict";

		var oRouters = {};

		/**
		 * Instantiates a SAPUI5 Router
		 * 
		 * @class
		 * @extends sap.ui.base.EventProvider
		 *
		 * @param {object|object[]} [oRoutes] may contain many Route configurations as {@link sap.ui.core.routing.Route#constructor}.<br/>
		 * Each of the routes contained in the array/object will be added to the router.<br/>
		 *
		 * One way of defining routes is an array:
		 * <pre>
		 * [
		 *     //Will create a route called 'firstRouter' you can later use this name in navTo to navigate to this route
		 *     {
		 *         name: "firstRoute"
		 *         pattern : "usefulPattern"
		 *     },
		 *     //Will create a route called 'anotherRoute'
		 *     {
		 *         name: "anotherRoute"
		 *         pattern : "anotherPattern"
		 *     }
		 * ]
		 * </pre>
		 *
		 * When you pass an object, the name attribute is the name of the proerty.
		 * <pre>
		 * {
		 *     //Will create a route called 'firstRouter' you can later use this name in navTo to navigate to this route
		 *     firstRoute : {
		 *         pattern : "usefulPattern"
		 *     },
		 *     //Will create a route called 'anotherRoute'
		 *     anotherRoute : {
		 *         pattern : "anotherPattern"
		 *     }
		 * }
		 * </pre>
		 * The values that may be provided are the same as in {@link sap.ui.core.routing.Route#constructor}
		 * 
		 * @param {object} [oConfig] Default values for route configuration - also takes the same parameters as {@link sap.ui.core.routing.Target#constructor}.<br/>
		 * This config will be used for routes and for targets, used in the router<br/>
		 * Eg: if the config object specifies :
		 * <pre>
		 * <code>
		 * { viewType : "XML" }
		 * </code>
		 * </pre>
		 * The targets look like this:
		 * <pre>
		 * {
		 *     xmlTarget : {
		 *         ...
		 *     },
		 *     jsTarget : {
		 *         viewType : "JS"
		 *         ...
		 *     }
		 * }
		 * </pre>
		 * Then the effective config will look like this:
		 * <pre>
		 * {
		 *     xmlTarget : {
		 *         viewType : "XML"
		 *         ...
		 *     },
		 *     jsTarget : {
		 *        viewType : "JS"
		 *       ...
		 *   }
		 * }
		 * </pre>
		 *
		 * Since the xmlTarget does not specify its viewType, XML is taken from the config object. The jsTarget is specifying it, so the viewType will be JS.
		 * 
		 * @param {sap.ui.core.UIComponent} [oOwner] the owner of all the views that will be created by this Router, will get forwarded to the {@link sap.ui.core.routing.Views}, created by the router.
		 * @param {object} [oTargetsConfig] {@link sap.ui.core.routing.Targets} @since 1.28 the target configuration, see {@link sap.ui.core.routing.Targets#constructor} documentation (the options object).<br>
		 *        You should use Targets to create and display views. Since 1.28 the route should only contain routing relevant properties.
		 * @public
		 * @alias sap.ui.core.routing.Router
		 */
		var Router = EventProvider.extend("sap.ui.core.routing.Router", /** @lends sap.ui.core.routing.Router.prototype */ {

			constructor : function(oRoutes, oConfig, oOwner, oTargetsConfig) {
				EventProvider.apply(this);

				this._oConfig = oConfig;
				this._oRouter = crossroads.create();
				this._oRouter.ignoreState = true;
				this._oRoutes = {};
				this._oViews = new Views({component : oOwner});

				if (oTargetsConfig) {
					this._oTargets = this._createTargets(oConfig, oTargetsConfig);
				}

				var that = this,
					aRoutes;

				if (!oRoutes) {
					oRoutes = {};
				}

				if ($.isArray(oRoutes)) {
					//Convert route object
					aRoutes = oRoutes;
					oRoutes = {};
					$.each(aRoutes, function(iRouteIndex, oRouteConfig) {
						oRoutes[oRouteConfig.name] = oRouteConfig;
					});
				}

				$.each(oRoutes, function(sRouteName, oRouteConfig) {
					if (oRouteConfig.name === undefined) {
						oRouteConfig.name = sRouteName;
					}
					that.addRoute(oRouteConfig);
				});

			},

			_createTargets : function (oConfig, oTargetsConfig) {
				return new Targets({
					views: this._oViews,
					config: oConfig,
					targets: oTargetsConfig
				});
			},

			metadata : {
				publicMethods: ["initialize", "getURL", "register", "getRoute"]
			}

		});
		
		Router.M_EVENTS = {
			RouteMatched : "routeMatched",
			RoutePatternMatched : "routePatternMatched",
			ViewCreated : "viewCreated"
		};

		/**
		 * Adds a route to the router
		 * 
		 * @param {object} oConfig configuration object for the route @see sap.ui.core.routing.Route#constructor
		 * @param {sap.ui.core.routing.Route} oParent the parent of the route
		 * @public
		 */
		Router.prototype.addRoute = function (oConfig, oParent) {
			if (!oConfig.name) {
				$.sap.log.error("A name has to be specified for every route", this);
			}
	
			if (this._oRoutes[oConfig.name]) {
				$.sap.log.error("Route with name " + oConfig.name + " already exists", this);
			}
			this._oRoutes[oConfig.name] = new Route(this, oConfig, oParent);
		};

		Router.prototype.parse = function (sNewHash) {
			this._oRouter.parse(sNewHash);
		};

		/**
		 * Attaches the router to the hash changer @see sap.ui.core.routing.HashChanger
		 *
		 * @public
		 * @returns {sap.ui.core.routing.Router} this for chaining.
		 */
		Router.prototype.initialize = function () {
			var that = this,
				oHashChanger = this.oHashChanger = HashChanger.getInstance();

			if (this._bIsInitialized) {
				$.sap.log.warning("Router is already initialized.", this);
				return this;
			}

			this._bIsInitialized = true;
	
			this.fnHashChanged = function(oEvent) {
				that.parse(oEvent.getParameter("newHash"), oEvent.getParameter("oldHash"));
			};

			if (!oHashChanger) {
				$.sap.log.error("navTo of the router is called before the router is initialized. If you want to replace the current hash before you initialize the router you may use getUrl and use replaceHash of the Hashchanger.", this);
				return;
			}

			oHashChanger.attachEvent("hashChanged", this.fnHashChanged);

			if (!oHashChanger.init()) {
				this.parse(oHashChanger.getHash());
			}

			return this;
		};
		
		/**
		 * Stops to listen to the hashChange of the browser.</br>
		 * If you want the router to start again, call initialize again.
		 * @returns { sap.ui.core.routing.Router } this for chaining.
		 * @public
		 */
		Router.prototype.stop = function () {
	
			if (!this._bIsInitialized) {
				$.sap.log.warning("Router is not initialized. But it got stopped", this);
			}
	
			if (this.fnHashChanged) {
				this.oHashChanger.detachEvent("hashChanged", this.fnHashChanged);
			}
	
			this._bIsInitialized = false;
	
			return this;
	
		};

		/**
		 * Removes the router from the hash changer @see sap.ui.core.routing.HashChanger
		 *
		 * @public
		 * @returns { sap.ui.core.routing.Router } this for chaining.
		 */
		Router.prototype.destroy = function () {
			EventProvider.prototype.destroy.apply(this);

			if (!this._bIsInitialized) {
				$.sap.log.info("Router is not initialized, but got destroyed.", this);
			}

			if (this.fnHashChanged) {
				this.oHashChanger.detachEvent("hashChanged", this.fnHashChanged);
			}

			//will remove all the signals attached to the routes - all the routes will not be useable anymore
			this._oRouter.removeAllRoutes();
			this._oRouter = null;

			$.each(this._oRoutes, function(iRouteIndex, oRoute) {
				oRoute.destroy();
			});
			this._oRoutes = null;
			this._oConfig = null;

			if (this._oTargets) {
				this._oTargets.destroy();
				this._oTargets = null;
			}

			this.bIsDestroyed = true;

			return this;
		};

		/**
		 * Returns the URL for the route and replaces the placeholders with the values in oParameters
		 * 
		 * @param {string} sName Name of the route
		 * @param {object} oParameters Parameters for the route
		 * @return {string} the unencoded pattern with interpolated arguments
		 * @public
		 */
		Router.prototype.getURL = function (sName, oParameters) {
			if (oParameters === undefined) {
				//even if there are only optional parameters crossroads cannot navigate with undefined
				oParameters = {};
			}
			
			var oRoute = this.getRoute(sName);
			if (!oRoute) {
				$.sap.log.warning("Route with name " + sName + " does not exist", this);
				return;
			}
			return oRoute.getURL(oParameters);
		};

		/**
		 * Returns the Route with a name, if no route is found undefined is returned
		 *
		 * @param {string} sName Name of the route
		 * @return {sap.ui.core.routing.Route} the route with the provided name or undefined.
		 * @public
		 * @since 1.25.1
		 */
		Router.prototype.getRoute = function (sName){
			return this._oRoutes[sName];
		};

		/**
		 * Returns the views instance created by the router
		 *
		 * @return {sap.ui.core.routing.Views} the Views instance
		 * @public
		 * @since 1.28
		 */
		Router.prototype.getViews = function () {
			return this._oViews;
		};


		/**
		 * Returns a cached view for a given name or creates it if it does not yet exists
		 *
		 * @deprecated @since 1.28 use {@link #getViews} instead.
		 * @param {string} sViewName Name of the view
		 * @param {string} sViewType Type of the view
		 * @param {string} sViewId Optional view id
		 * @return {sap.ui.core.mvc.View} the view instance
		 * @public
		 */
		Router.prototype.getView = function (sViewName, sViewType, sViewId) {
			var oView = this._oViews._getViewWithGlobalId({
				viewName: sViewName,
				type: sViewType,
				id: sViewId
			});

			this.fireViewCreated({
				view: oView,
				viewName: sViewName,
				type: sViewType
			});

			return oView;
		};

		/**
		 * Adds or overwrites a view in the viewcache of the router, the viewname serves as a key
		 *
		 * @deprecated @since 1.28 use {@link #getViews} instead.
		 * @param {string} sViewName Name of the view
		 * @param {sap.ui.core.mvc.View} oView the view instance
		 * @since 1.22
		 * @public
		 * @returns {sap.ui.core.routing.Router} @since 1.28 the this pointer for chaining
		 */
		Router.prototype.setView = function (sViewName, oView) {
			this._oViews.setView(sViewName, oView);
			return this;
		};
		
		/**
		 * Navigates to a specific route defining a set of parameters. The Parameters will be URI encoded - the characters ; , / ? : @ & = + $ are reserved and will not be encoded.
		 * If you want to use special characters in your oParameters, you have to encode them (encodeURIComponent).
		 * 
		 * @param {string} sName Name of the route
		 * @param {object} oParameters Parameters for the route
		 * @param {boolean} bReplace Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
		 * @public
		 * @returns {sap.ui.core.routing.Router} this for chaining.
		 */
		Router.prototype.navTo = function (sName, oParameters, bReplace) {
			if (bReplace) {
				this.oHashChanger.replaceHash(this.getURL(sName, oParameters));
			} else {
				this.oHashChanger.setHash(this.getURL(sName, oParameters));
			}

			return this;
		};

		/**
		 * Returns the instance of Targets, if you pass a targets config to the router
		 *
		 * @public
		 * @returns {sap.ui.core.routing.Targets|undefined} The instance of targets, the router uses to place views or undefined if you did not specify the targets parameter in the router's constructor.
		 */
		Router.prototype.getTargets = function () {
			return this._oTargets;
		};

		/**
		 * Attach event-handler <code>fnFunction</code> to the 'routeMatched' event of this <code>sap.ui.core.routing.Router</code>.<br/>
		 *
		 *
		 * @param {object} [oData] The object, that should be passed along with the event-object when firing the event.
		 * @param {function} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {object} [oListener] Object on which to call the given function. If empty, this Model is used.
		 *
		 * @return {sap.ui.core.routing.Router} <code>this</code> to allow method chaining
		 * @public
		 */
		Router.prototype.attachRouteMatched = function(oData, fnFunction, oListener) {
			this.attachEvent("routeMatched", oData, fnFunction, oListener);
			return this;
		};

		/**
		 * Detach event-handler <code>fnFunction</code> from the 'routeMatched' event of this <code>sap.ui.core.routing.Router</code>.<br/>
		 *
		 * The passed function and listener object must match the ones previously used for event registration.
		 *
		 * @param {function} fnFunction The function to call, when the event occurs.
		 * @param {object} oListener Object on which the given function had to be called.
		 * @return {sap.ui.core.routing.Router} <code>this</code> to allow method chaining
		 * @public
		 */
		Router.prototype.detachRouteMatched = function(fnFunction, oListener) {
			this.detachEvent("routeMatched", fnFunction, oListener);
			return this;
		};

		/**
		 * Fire event routeMatched to attached listeners.
		 *
		 * @param {object} [mArguments] the arguments to pass along with the event.
		 * 
		 * @return {sap.ui.core.routing.Router} <code>this</code> to allow method chaining
		 * @protected
		 */
		Router.prototype.fireRouteMatched = function(mArguments) {
			this.fireEvent("routeMatched", mArguments);
			return this;
		};

		/**
		 * Attach event-handler <code>fnFunction</code> to the 'viewCreated' event of this <code>sap.ui.core.routing.Router</code>.<br/>
		 * @param {object} [oData] The object, that should be passed along with the event-object when firing the event.
		 * @param {function} fnFunction The function to call, when the event occurs. This function will be called on the
		 * oListener-instance (if present) or in a 'static way'.
		 * @param {object} [oListener] Object on which to call the given function. If empty, this Model is used.
		 *
		 * @deprecated @since 1.28 use {@link #getViews} instead.
		 * @return {sap.ui.core.routing.Router} <code>this</code> to allow method chaining
		 * @public
		 */
		Router.prototype.attachViewCreated = function(oData, fnFunction, oListener) {
			this.attachEvent("viewCreated", oData, fnFunction, oListener);
			return this;
		};

		/**
		 * Detach event-handler <code>fnFunction</code> from the 'viewCreated' event of this <code>sap.ui.core.routing.Router</code>.<br/>
		 *
		 * The passed function and listener object must match the ones previously used for event registration.
		 *
		 * @deprecated @since 1.28 use {@link #getViews} instead.
		 * @param {function} fnFunction The function to call, when the event occurs.
		 * @param {object} oListener Object on which the given function had to be called.
		 * @return {sap.ui.core.routing.Router} <code>this</code> to allow method chaining
		 * @public
		 */
		Router.prototype.detachViewCreated = function(fnFunction, oListener) {
			this.detachEvent("viewCreated", fnFunction, oListener);
			return this;
		};

		/**
		 * Fire event viewCreated to attached listeners.
		 *
		 * @deprecated @since 1.28 use {@link #getViews} instead.
		 * @param {object} [mArguments] the arguments to pass along with the event.
		 * 
		 * @return {sap.ui.core.routing.Router} <code>this</code> to allow method chaining
		 * @protected
		 */
		Router.prototype.fireViewCreated = function(mArguments) {
			this.fireEvent("viewCreated", mArguments);
			return this;
		};

		/**
		 * Attach event-handler <code>fnFunction</code> to the 'routePatternMatched' event of this <code>sap.ui.core.routing.Router</code>.<br/>
		 * This event is similar to route matched. But it will only fire for the route that has a matching pattern, not for its parent Routes <br/>
		 *
		 * @param {object} [oData] The object, that should be passed along with the event-object when firing the event.
		 * @param {function} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {object} [oListener] Object on which to call the given function. If empty, this Model is used.
		 *
		 * @return {sap.ui.core.routing.Router} <code>this</code> to allow method chaining
		 * @public
		 */
		Router.prototype.attachRoutePatternMatched = function(oData, fnFunction, oListener) {
			this.attachEvent("routePatternMatched", oData, fnFunction, oListener);
			return this;
		};

		/**
		 * Detach event-handler <code>fnFunction</code> from the 'routePatternMatched' event of this <code>sap.ui.core.routing.Router</code>.<br/>
		 * This event is similar to route matched. But it will only fire for the route that has a matching pattern, not for its parent Routes <br/>
		 *
		 * The passed function and listener object must match the ones previously used for event registration.
		 *
		 * @param {function} fnFunction The function to call, when the event occurs.
		 * @param {object} oListener Object on which the given function had to be called.
		 * @return {sap.ui.core.routing.Router} <code>this</code> to allow method chaining
		 * @public
		 */
		Router.prototype.detachRoutePatternMatched = function(fnFunction, oListener) {
			this.detachEvent("routePatternMatched", fnFunction, oListener);
			return this;
		};

		/**
		 * Fire event routePatternMatched to attached listeners.
		 * This event is similar to route matched. But it will only fire for the route that has a matching pattern, not for its parent Routes <br/>
		 *
		 * @param {object} [mArguments] the arguments to pass along with the event.
		 * 
		 * @return {sap.ui.core.routing.Router} <code>this</code> to allow method chaining
		 * @protected
		 */
		Router.prototype.fireRoutePatternMatched = function(mArguments) {
			this.fireEvent("routePatternMatched", mArguments);
			return this;
		};

		/**
		 * Registers the router to access it from another context. Use sap.ui.routing.Router.getRouter() to receive the instance
		 * 
		 * @param {string} sName Name of the router
		 * @public
		 */
		Router.prototype.register = function (sName) {
			oRouters[sName] = this;
			return this;
		};

		/**
		 * Get a registered router
		 * 
		 * @param {string} sName Name of the router
		 * @return {sap.ui.core.routing.Router} The router with the specified name, else undefined
		 * @public
		 */
		Router.getRouter = function (sName) {
			return oRouters[sName];
		};

	return Router;

}, /* bExport= */ true);

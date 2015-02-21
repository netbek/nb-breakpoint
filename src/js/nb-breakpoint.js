/**
 * AngularJS service for checking breakpoints in responsive design
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (w, angular, undefined) {
	'use strict';

	angular
		.module('nb.breakpoint', [
			'nb.lodash'
		])
		.provider('nbBreakpointConfig', nbBreakpointConfig)
		.factory('nbBreakpoint', nbBreakpoint)
		.run(runBlock);

	function nbBreakpointConfig () {
		var config = {
			mediaqueries: {
				small: 'only screen and (min-width: 0px)',
				medium: 'only screen and (min-width: 640px)',
				large: 'only screen and (min-width: 992px)',
				xlarge: 'only screen and (min-width: 1440px)',
				xxlarge: 'only screen and (min-width: 1920px)',
				landscape: 'only screen and (orientation: landscape)',
				portrait: 'only screen and (orientation: portrait)',
				// http://css-tricks.com/snippets/css/retina-display-media-query
				retina: 'only screen and (-webkit-min-device-pixel-ratio: 2), ' +
					'only screen and (min--moz-device-pixel-ratio: 2), ' +
					'only screen and (-o-min-device-pixel-ratio: 2/1), ' +
					'only screen and (min-device-pixel-ratio: 2), ' +
					'only screen and (min-resolution: 192dpi), ' +
					'only screen and (min-resolution: 2dppx)'
			}
		};
		return {
			set: function (values) {
				config = values;
			},
			$get: function () {
				return config;
			}
		};
	}

	runBlock.$inject = ['$rootScope', 'nbBreakpoint'];
	function runBlock ($rootScope, nbBreakpoint) {
		nbBreakpoint.init();
		$rootScope.nbBreakpoint = nbBreakpoint;
	}

	nbBreakpoint.$inject = ['$rootScope', 'nbBreakpointConfig', '_'];
	function nbBreakpoint ($rootScope, nbBreakpointConfig, _) {
		var current = [];
		var doc = window.document;
		var docElm = doc.documentElement;
		var vwCache = {};
		var units = {};

		/**
		 * Returns 1em in css px for html/body default size
		 *
		 * @returns {Number}
		 *
		 * Based on:
		 * https://github.com/scottjehl/Respond
		 */
		var getEmValue = (function () {
			var eminpx;
			// baseStyle also used by getEmValue (i.e.: width: 1em is important)
			var baseStyle = "position:absolute;left:0;visibility:hidden;display:block;padding:0;border:none;font-size:1em;width:1em;overflow:hidden;clip:rect(0px, 0px, 0px, 0px)";
			var fsCss = "font-size:100%!important;";
			return function () {
				var body;
				if (!eminpx && (body = doc.body)) {
					var div = doc.createElement("div"),
						originalHTMLCSS = docElm.style.cssText,
						originalBodyCSS = body.style.cssText;
					div.style.cssText = baseStyle;
					// 1em in a media query is the value of the default font size of the browser
					// reset docElem and body to ensure the correct value is returned
					docElm.style.cssText = fsCss;
					body.style.cssText = fsCss;
					body.appendChild(div);
					eminpx = div.offsetWidth;
					body.removeChild(div);
					//also update eminpx before returning
					eminpx = parseFloat(eminpx, 10);
					// restore the original values
					docElm.style.cssText = originalHTMLCSS;
					body.style.cssText = originalBodyCSS;
				}
				return eminpx || 16;
			};
		})();

		/**
		 * Creates CSS units and invalidates the viewport depending cache
		 *
		 * Based on:
		 * https://github.com/aFarkas/picturefill/blob/issues-313-262-314/src/picturefill.js
		 */
		function updateUnits () {
			vwCache = {};
			units = {
				px: 1,
				width: Math.max(window.innerWidth || 0, docElm.clientWidth),
				height: Math.max(window.innerHeight || 0, docElm.clientHeight),
				em: getEmValue(),
				rem: getEmValue()
			};
			units.vw = units.width / 100;
			units.vh = units.height / 100;
			units.orientation = units.height > units.width; // If portrait
			units.devicePixelRatio = window.devicePixelRatio || 1;
			units.dpi = 0; // @todo
			units.dppx = 0; // @todo
			units.resolution = 0; // @todo
		}

		/**
		 * Gets a mediaquery and returns a boolean or gets a CSS length and returns a number
		 *
		 * @param {String} css mediaqueries or css length
		 * @returns {Boolean|Number}
		 *
		 * Based on:
		 * https://gist.github.com/jonathantneal/db4f77009b155f083738
		 * https://github.com/aFarkas/picturefill/blob/issues-313-262-314/src/picturefill.js
		 */
		var evalCSS = (function () {
			var cache = {};
			var regLength = /^([\d\.]+)(em|vw|px)$/;
			var replace = function () {
				var args = arguments, index = 0, string = args[0];
				while (++index in args) {
					string = string.replace(args[index], args[++index]);
				}
				return string;
			};
			var buildStr = function (css) {
				if (!cache[css]) {
					cache[css] = "return " + replace((css || "").toLowerCase(),
						// ignore `only`
						/^only\s+/g, '',
						// wrap `not`
						/not([^)]+)/g, '!($1)',
						// strip vendor prefixes
						/-(webkit|moz|ms|o)-([a-z-]+)/g, '$2',
						/(min|max)--(webkit|moz|ms|o)-([a-z-]+)/g, '$1-$3',
						// interpret `all`, `portrait`, and `screen` as truthy
						/all|portrait|screen/g, 1,
						// interpret `landscape`, `print` and `speech` as falsey
						/landscape|print|speech/g, 0,
						// interpret `and`
						/\band\b/g, "&&",
						// interpret `,`
						/,/g, "||",
						// interpret `min-` as >=
						/min-device-pixel-ratio\s*:/g, 'e.devicePixelRatio >=',
						// interpret `max-` as >=
						/max-device-pixel-ratio\s*:/g, 'e.devicePixelRatio <=',
						// interpret as ==
						/device-pixel-ratio\s*:/g, 'e.devicePixelRatio ==',
						// interpret as ==
						/orientation\s*:/g, 'e.orientation ==',
						// interpret `min-` as >=
						/min-([a-z-\s]+):/g, "e.$1 >=",
						// interpret `min-` as <=
						/max-([a-z-\s]+):/g, "e.$1 <=",
						// calc value
						/calc([^)]+)/g, "($1)",
						// interpret css values
						/(\d+[\.]*[\d]*)([a-z]+)/g, "($1 * e.$2)"
						// make eval less evil - does not work?
//						/^(?!(e.[a-z]|[0-9\.&=|><\+\-\*\(\)\/])).*/ig, ""
						) + ";";
					// Until we can strip invalid properties successfully to
					// make eval less evil, return nothing if `-` found. This
					// excludes vendor prefixes, for example.
					if (cache[css].indexOf('-') > -1) {
						cache[css] = 'return;';
					}
				}
				return cache[css];
			};

			return function (css, length) {
				var parsedLength;
				if (!(css in vwCache)) {
					vwCache[css] = false;
					if (length && (parsedLength = css.match(regLength))) {
						vwCache[css] = parsedLength[ 1 ] * units[parsedLength[ 2 ]];
					} else {
						/*jshint evil:true */
						try {
							vwCache[css] = new Function("e", buildStr(css))(units);
						} catch (e) {
						}
						/*jshint evil:false */
					}
				}
				return vwCache[css];
			};
		})();

		var matchesMedia;
		if (w.matchMedia && (matchMedia("(min-width: 0.1em)") || {}).matches) {
			matchesMedia = function (media) {
				return w.matchMedia(media).matches;
			};
		}
		else {
			matchesMedia = evalCSS;
		}

		function update () {
			var arr = [];

			updateUnits();

			angular.forEach(nbBreakpointConfig.mediaqueries, function (mq, name) {
				if (matchesMedia(mq)) {
					arr.push(name);
				}
			});

			// If the list of matched breakpoints has changed and if the root scope is not already in a digest, then trigger one.
			// @todo What if already in digest? E.g. ng-if="nbBreakpoint.includes()" would not reflect changes.
			if (!$rootScope.$$phase && !_.isEqual(current, arr)) {
				current = arr;
				$rootScope.$digest();
			}
		}

		var onWindowResize = _.throttle(function () {
			update();
		}, 60);

		if (window.addEventListener) {
			window.addEventListener('resize', onWindowResize, false);
		}
		else if (window.attachEvent) {
			window.attachEvent('onresize', onWindowResize);
		}

		return {
			/**
			 *
			 */
			init: function () {
				update();
			},
			/**
			 * Checks if the current breakpoints includes the given breakpoint.
			 *
			 * @param {string} breakpoint
			 * @returns {boolean}
			 */
			includes: function (breakpoint) {
				return (_.indexOf(current, breakpoint) > -1);
			},
			/**
			 * Checks if the current breakpoints includes one ore more of the given breakpoints.
			 *
			 * @param {array} breakpoints
			 * @returns {boolean}
			 */
			any: function (breakpoints) {
				for (var i = 0, il = breakpoints.length; i < il; i++) {
					var bp = breakpoints[i];
					if (_.indexOf(current, bp) > -1) {
						return true;
					}
				}
				return false;
			},
			/**
			 * Checks if the current breakpoints matches the given breakpoint.
			 *
			 * @param {string} breakpoint
			 * @returns {boolean}
			 */
			is: function (breakpoint) {
				return _.isEqual(current, [breakpoint]);
			},
			/**
			 * Checks if the current breakpoints matches all of the given breakpoints.
			 *
			 * @param {array} breakpoints
			 * @returns {boolean}
			 */
			all: function (breakpoints) {
				return _.isEqual(current, breakpoints);
			}
		};
	}
})(window, window.angular);

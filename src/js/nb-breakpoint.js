/**
 * AngularJS service for checking breakpoints in responsive design
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
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

	nbBreakpoint.$inject = ['$rootScope', '$window', 'nbBreakpointConfig', '_'];
	function nbBreakpoint ($rootScope, $window, nbBreakpointConfig, _) {
		var $$window = angular.element($window);
		var current = [];

		function update () {
			var arr = [];

			angular.forEach(nbBreakpointConfig.mediaqueries, function (mq, name) {
				if ($window.matchMedia(mq).matches) {
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

		$$window.on('resize', onWindowResize);

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

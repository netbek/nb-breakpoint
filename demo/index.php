<!doctype html>
<html xmlns:ng="http://angularjs.org" lang="en" id="ng-app" ng-app="nb.breakpoint.demo">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>nb-breakpoint demo</title>

		<script src="../bower_components/angularjs/angular.js"></script>
		<script src="../bower_components/lodash/lodash.js"></script>
		<script src="../bower_components/nb-lodash/dist/js/nb-lodash.js"></script>
		<script src="../bower_components/matchMedia/matchMedia.js"></script>

<!--
		<script src="../dist/js/nb-breakpoint.js"></script>
-->
		<script src="../src/js/nb-breakpoint.js"></script>

		<script src="../demo/js/app.js"></script>
	</head>
	<body ng-controller="MainController">
		<div ng-if="nbBreakpoint.includes('landscape')">
			Matched: only screen and (orientation: landscape)
		</div>
		<div ng-if="nbBreakpoint.includes('portrait')">
			Matched: only screen and (orientation: portrait)
		</div>
		<div ng-if="!nbBreakpoint.includes('large')">
			Matched: only screen and (min-width: 0px)
		</div>
		<div ng-if="nbBreakpoint.includes('large')">
			Matched: only screen and (min-width: 992px)
		</div>
	</body>
</html>

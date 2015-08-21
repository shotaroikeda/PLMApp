var app = angular.module('PLMApp', ['ngRoute', 'ngCookies']);
app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
    /*
      add this when done
      .when('/', {
      controller: 'SelectionController',
      templateUrl: 'views/selection.html'
      })
    */
        .when('/index', {
            controller: 'SelectionController',
            templateUrl: 'views/selection.html'
        })
        .when('/selection', {
            controller: 'SelectionController',
            templateUrl: 'views/selection.html'
        })
    /* Quick Note:
       When we having a working backend, this will change quite a bit.
       It will go from /detail/ to stuff like /index/:id_detail/:id_story/...
       and so on.

       For now we'll have static URLs.
    */
        .when('/storyboard', {
            controller: 'StoryboardController',
            templateUrl: 'views/storyboard.html'
        })
        .when('/detail', {
            controller: 'DetailController',
            templateUrl: 'views/detail.html'
        })
        .when('/canvas', {
            controller: 'CanvasController',
            templateUrl: 'views/canvas.html'
        })
        .otherwise({
            redirectTo: '/selection' // Point to most recent section of development for convenience.
        });

    $locationProvider.html5Mode({
	enabled: true,
	requireBase: false
    });
}]);

const _COLOR_RED = 0;
const _COLOR_GREEN = 1;
const _COLOR_BLUE = 2;
const _COLOR_ALPHA = 3;

const T_PEN = 0;
const T_ERASER = 1;
const T_BUCKET = 2;
const T_RECT = 3;
const T_RECTFILL = 4;
